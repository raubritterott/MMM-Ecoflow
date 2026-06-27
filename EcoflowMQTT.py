# 1. Create folder Ecoflow: mkdir ~/Ecoflow
# 2. Copy script EcoflowMQTT.py to the folder
# 3. Create virtual environment: python3 -m venv venv
# 4. Activate virtual environment: cd ~/Ecoflow && source venv/bin/activate
# 5. pip install requests paho-mqtt
# 6. Run script with pm2: pm2 start venv/bin/python --name ecoflowmqtt -- EcoflowMQTT.py
# 7. Save pm2 process list: pm2 save

import time
import json
import random
import threading
import ssl
import hmac
import hashlib
import requests

from flask import Flask, jsonify
from paho.mqtt import client as mqtt_client
from datetime import datetime

# =========================================================
# KONFIGURATION
# =========================================================

ACCESS_KEY = "YOUR_ACCESS_KEY"
SECRET_KEY = "YOUR_SECRET_KEY"

BASE_URL = "https://api-e.ecoflow.com"

FLASK_PORT = 5000

# =========================================================
# FLASK
# =========================================================

app = Flask(__name__)

# =========================================================
# GLOBALER DATENCACHE
# =========================================================

current_data = {
    "devices": {},
    "mqtt_connected": False
}

mqtt_credentials = {}

# =========================================================
# SIGNATUR ERZEUGEN
# =========================================================

def create_signature(params=None):

    nonce = str(random.randint(100000, 999999))
    timestamp = str(int(time.time() * 1000))

    param_str = ""

    if params:
        sorted_items = sorted(params.items())

        param_str = "&".join(
            f"{k}={v}" for k, v in sorted_items
        )

    sign_str = (
        param_str +
        f"&accessKey={ACCESS_KEY}" +
        f"&nonce={nonce}" +
        f"&timestamp={timestamp}"
    )

    sign_str = sign_str.lstrip("&")

    sign = hmac.new(
        SECRET_KEY.encode("utf-8"),
        sign_str.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    return {
        "accessKey": ACCESS_KEY,
        "nonce": nonce,
        "timestamp": timestamp,
        "sign": sign
    }

# =========================================================
# GERÄTE HOLEN
# =========================================================

def get_devices():

    url = f"{BASE_URL}/iot-open/sign/device/list"

    response = requests.get(
        url,
        headers=create_signature(),
        timeout=30
    )

    return response.json()

# =========================================================
# MQTT ZUGANGSDATEN HOLEN
# =========================================================

def get_mqtt_credentials():

    url = f"{BASE_URL}/iot-open/sign/certification"

    response = requests.get(
        url,
        headers=create_signature(),
        timeout=30
    )

    data = response.json()
    
    if data.get("code") != "0":
        raise Exception(f"MQTT Fehler: {data}")

    return data["data"]

# =========================================================
# MQTT CALLBACKS
# =========================================================

mqtt_devices = {}

# Seriennummern einmalig laden
try:
    devices = get_devices()
    #print(json.dumps(devices, indent=2))
    for device in devices.get("data", []):
        sn = device.get("sn")

        mqtt_devices[sn] = {
            "name": device.get("deviceName"),
            "online": device.get("online", 0)
        }

except Exception as e:
    print("Fehler beim Laden der Geräte:")
    print(e)

# =========================================================

def on_connect(client, userdata, flags, reason_code, properties):

    print(f"\nMQTT verbunden: {reason_code}")

    current_data["mqtt_connected"] = True

    for sn in mqtt_devices:

        account = mqtt_credentials["certificateAccount"]

        topicStatus = f"/open/{account}/{sn}/status"
        client.subscribe(topicStatus)
        print(f"Abonniert: {topicStatus}")

        topic = f"/open/{account}/{sn}/quota"
        client.subscribe(topic)
        print(f"Abonniert: {topic}")

# =========================================================

def on_disconnect(client, userdata, disconnect_flags, reason_code, properties):

    current_data["mqtt_connected"] = False

    print("MQTT getrennt")

# =========================================================

def on_message(client, userdata, msg):

    global current_data

    try:

        payload = msg.payload.decode()

        try:
            data = json.loads(payload)

        except:
            print("Ungültiges JSON")
            return

        topic = msg.topic

        #print("\n====================================")
        #print(f"TOPIC: {topic}")
        
        #print(json.dumps(data, indent=2))

        # SN aus Topic extrahieren
        parts = topic.split("/")

        sn = parts[-2]

        if sn not in current_data["devices"]:
            current_data["devices"][sn] = {}

        # Metadaten ergänzen
        current_data["devices"][sn]["name"] = mqtt_devices.get(sn, {}).get("name")
        current_data["devices"][sn]["online"] = mqtt_devices.get(sn, {}).get("online")

        # Rohdaten speichern
        current_data["devices"][sn]["raw"] = data

        # Einige typische Felder extrahieren
        topic = parts[-1]
        if topic == "status":
            pstatus = data.get("params", {})
        pdata = data

        # Parsed initialisieren
        if "parsed" not in current_data["devices"][sn]:
            current_data["devices"][sn]["parsed"] = {}
            current_data["devices"][sn]["parsed"]["last_update"] = None
            current_data["devices"][sn]["parsed"]["last_full_update"] = None

        parsed = current_data["devices"][sn]["parsed"]

        # Timestamp
        timestamp = int(time.time())
        formatted = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")

        FIELD_MAP = {
            "powGetPv": "pv1_watts",
            "powGetPv2": "pv2_watts",
            "gridConnectionPower": "grid_watts",
            "plugInInfoPvVol": "pv1_voltage",
            "plugInInfoPv2Vol": "pv2_voltage",
            "gridConnectionVol": "grid_voltage",
            "plugInInfoPvAmp": "pv1_ampere",
            "plugInInfoPv2Amp": "pv2_ampere",
            "gridConnectionAmp": "grid_ampere",
            "moduleWifiRssi": "wifi_rssi",
            "gridConnectionFreq": "grid_frequency",
            "invNtcTemp3": "temperature",
            "feedGridModePowMax": "max_power"
        }

        updated = False

        for mqtt_key, parsed_key in FIELD_MAP.items():
            if mqtt_key in pdata:
                parsed[parsed_key] = pdata[mqtt_key]
                updated = True
        
        if topic == "status":
            if pstatus["status"] == 1:
                parsed["state"] = "Online"
            else:
                parsed["state"] = "Offline"

        if updated:
            parsed.pop("last_update", None)
            parsed["last_update"] = formatted
            parsed["state"] = "Online"

        FULL_UPDATE_FIELDS = [
            "powGetPv",
            "powGetPv2",
            "gridConnectionPower",
            "plugInInfoPvVol",
            "plugInInfoPv2Vol",
            "gridConnectionVol",
            "plugInInfoPvAmp",
            "plugInInfoPv2Amp",
            "gridConnectionAmp",
            "moduleWifiRssi",
            "gridConnectionFreq",
            "invNtcTemp3",
            "feedGridModePowMax"
        ]

        if all(field in pdata for field in FULL_UPDATE_FIELDS):
            parsed.pop("last_full_update", None)
            parsed["last_full_update"] = formatted
            parsed["state"] = "Online"

        # =====================================================
        # Parsed Daten speichern
        # =====================================================

        current_data["devices"][sn]["parsed"] = parsed

    except Exception as e:

        print("Fehler bei MQTT Nachricht:")
        print(e)

# =========================================================
# MQTT THREAD
# =========================================================

def mqtt_loop():

    while True:

        try:

            global mqtt_credentials
            mqtt_credentials = get_mqtt_credentials()

            print("\nMQTT Zugangsdaten geladen")

            client = mqtt_client.Client(
                mqtt_client.CallbackAPIVersion.VERSION2
            )

            client.username_pw_set(
                mqtt_credentials["certificateAccount"],
                mqtt_credentials["certificatePassword"]
            )

            client.tls_set(cert_reqs=ssl.CERT_NONE)
            client.tls_insecure_set(True)

            client.on_connect = on_connect
            client.on_disconnect = on_disconnect
            client.on_message = on_message

            print("\nVerbinde MQTT...")

            client.connect(
                mqtt_credentials["url"],
                int(mqtt_credentials["port"]),
                60
            )

            client.loop_forever()

        except Exception as e:

            current_data["mqtt_connected"] = False

            print("\nMQTT Fehler:")
            print(e)

            print("Neuer Versuch in 30 Sekunden...")

            time.sleep(30)

# =========================================================
# API ROUTES
# =========================================================

@app.route("/api/ecoflow")
def api_ecoflow():

    return jsonify(current_data)

# =========================================================

@app.route("/api/ecoflow/devices")
def api_devices():

    return jsonify(current_data.get("devices", {}))

# =========================================================

@app.route("/api/ecoflow/flat")
def api_flat():

    if current_data.get("devices", {}) != {} and current_data["devices"][sn]["parsed"].get("state", "Offline") != "Offline":
        return jsonify({
            "sn": sn,
            "name": current_data["devices"][sn].get("name", None),
            "pv1_watts": current_data["devices"][sn]["parsed"].get("pv1_watts", None),
            "pv2_watts": current_data["devices"][sn]["parsed"].get("pv2_watts", None),
            "grid_watts": current_data["devices"][sn]["parsed"].get("grid_watts", None),
            "pv1_voltage": current_data["devices"][sn]["parsed"].get("pv1_voltage", None),
            "pv2_voltage": current_data["devices"][sn]["parsed"].get("pv2_voltage", None),
            "grid_voltage": current_data["devices"][sn]["parsed"].get("grid_voltage", None),
            "pv1_ampere": current_data["devices"][sn]["parsed"].get("pv1_ampere", None),
            "pv2_ampere": current_data["devices"][sn]["parsed"].get("pv2_ampere", None),
            "grid_ampere": current_data["devices"][sn]["parsed"].get("grid_ampere", None),
            "wifi_rssi": current_data["devices"][sn]["parsed"].get("wifi_rssi", None),
            "grid_frequency": current_data["devices"][sn]["parsed"].get("grid_frequency", None),
            "temperature": current_data["devices"][sn]["parsed"].get("temperature", None),
            "max_power":  current_data["devices"][sn]["parsed"].get("max_power", None),
            "mqtt_connected": current_data.get("mqtt_connected", None),
            "last_update": current_data["devices"][sn]["parsed"].get("last_update", None),
            "last_full_update": current_data["devices"][sn]["parsed"].get("last_full_update", None),
            "state": current_data["devices"][sn]["parsed"].get("state", "Offline")
        })
    elif current_data.get("devices", {}) != {}:
        return jsonify({
            "sn": sn,
            "name": current_data["devices"][sn].get("name", None),
            "pv1_watts": 0,
            "pv2_watts": 0,
            "grid_watts": 0,
            "pv1_voltage": 0,
            "pv2_voltage": 0,
            "grid_voltage": 0,
            "pv1_ampere": 0,
            "pv2_ampere": 0,
            "grid_ampere": 0,
            "wifi_rssi": None,
            "grid_frequency": None,
            "temperature": None,
            "max_power":  current_data["devices"][sn]["parsed"].get("max_power", None),
            "mqtt_connected": current_data.get("mqtt_connected", None),
            "last_update": current_data["devices"][sn]["parsed"].get("last_update", None),
            "last_full_update": current_data["devices"][sn]["parsed"].get("last_full_update", None),
            "state": "Offline",
        })
    else:
        return jsonify({})


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    import logging

    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)

    print("\n====================================")
    print("EcoFlow MQTT Backend startet")
    print("====================================")

    # MQTT Thread starten
    mqtt_thread = threading.Thread(target=mqtt_loop)

    mqtt_thread.daemon = True
    mqtt_thread.start()

    # Flask starten
    app.run(
        host="0.0.0.0",
        #host="127.0.0.1",
        port=FLASK_PORT
    )
