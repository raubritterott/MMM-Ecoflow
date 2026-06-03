const NodeHelper = require("node_helper");
const crypto = require("crypto");
const http = require('http');

module.exports = NodeHelper.create(
{

  async socketNotificationReceived(notification, payload)
  {
    if (notification === "GET_ECOFLOW_DATA")
    {
      console.log("GET_ECOFLOW_DATA wurde aufgerufen");

      const { apiEndpoint } = payload;
      const url = new URL(apiEndpoint);

      //console.log("API Endpoint:", apiEndpoint);

      const options = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'GET'
      };
      
      const req = http.request(options, (res) =>
      {
        let rawData = "";
      
        res.on('data', chunk =>
        {
          rawData += chunk;
        });

        res.on('end', () =>
        {
          try
          {
            const json = JSON.parse(rawData);

            const sn = json.sn ?? "";
            const name = json.name ?? "";
            const pv1_ampere = json.pv1_ampere === 0 ? "0.00" : json?.pv1_ampere ?? "";
            const pv2_ampere = json.pv2_ampere === 0 ? "0.00" : json?.pv2_ampere ?? "";
            const grid_ampere = json.grid_ampere === 0 ? "0.00" : json?.grid_ampere ?? "";
            const pv1_voltage = json.pv1_voltage === 0 ? "0.00" : json?.pv1_voltage ?? "";
            const pv2_voltage = json.pv2_voltage === 0 ? "0.00" : json?.pv2_voltage ?? "";
            const grid_voltage = json.grid_voltage === 0 ? "0.00" : json?.grid_voltage ?? "";
            const pv1_watts = json.pv1_watts === 0 ? "0.00" : json?.pv1_watts ?? "";
            const pv2_watts = json.pv2_watts === 0 ? "0.00" : json?.pv2_watts ?? "";
            const grid_watts = json.grid_watts === 0 ? "0.00" : json?.grid_watts ?? "";
            const grid_frequency = json.grid_frequency === 0 ? "0.00" : json?.grid_frequency ?? "";
            const temperature = json.temperature === 0 ? "0.00" : json?.temperature ?? "";
            const wifi_rssi = json.wifi_rssi === 0 ? "0.00" : json?.wifi_rssi ?? "";
            const max_power = json.max_power === 0 ? "0.00" : json?.max_power ?? "";
            const state = json.state ?? "Offline";
            const mqtt_connected = json.mqtt_connected ?? false;
            const last_update = json.last_update ?? "";
            const last_full_update = json.last_full_update ?? "";

            //console.log("Ecoflow Response:", json);
            //console.log("Ecoflow MQTT Status:", mqtt_connected);

            this.sendSocketNotification("ECOFLOW_DATA", { 
                 sn: sn
                ,name: name
                ,pv1_ampere: pv1_ampere
                ,pv2_ampere: pv2_ampere
                ,grid_ampere: grid_ampere
                ,pv1_voltage: pv1_voltage
                ,pv2_voltage: pv2_voltage
                ,grid_voltage: grid_voltage
                ,pv1_watts: pv1_watts
                ,pv2_watts: pv2_watts
                ,grid_watts: grid_watts
                ,grid_frequency: grid_frequency
                ,temperature: temperature
                ,wifi_rssi: wifi_rssi
                ,max_power: max_power
                ,state: state
                ,mqtt_connected: mqtt_connected
                ,last_update: last_update
                ,last_full_update: last_full_update
            });

          }
          catch (err)
          {
            console.error("Fehler beim JSON-Parsen:", err);
            this.sendSocketNotification("ECOFLOW_DATA", { state: "Parse error" });
          }
        });
      });

      req.on("error", (error) =>
      {
        console.error("HTTP error:", error);
        this.sendSocketNotification("ECOFLOW_DATA", { state: "HTTP error" });
      });

      req.end();
    }
  },

})
