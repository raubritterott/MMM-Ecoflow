Module.register("MMM-Ecoflow",
{
  defaults:
  {
    updateInterval: 60 * 1000, // default update interval is 1 minute
    apiEndpoint: "",

    sn: null,
    deviceName: "",
    pv1_watts: 0,
    pv2_watts: 0,
    grid_watts: 0,
    pv1_voltage: 0,
    pv2_voltage: 0,
    grid_voltage: 0,
    pv1_ampere: 0,
    pv2_ampere: 0,
    grid_ampere: 0,
    wifi_rssi: null,
    grid_frequency: null,
    temperature: null,
    max_power: null,
    last_update: null,
    last_full_update: null,
    state: "Offline",
    mqtt_connected: false
  },

  /**
   * Apply the default styles.
   */
  getStyles()
  {
    return ["Ecoflow.css"]
  },

  /**
   * Pseudo-constructor for our module. Initialize stuff here.
   */
  start() 
  {
    this.updateInterval = this.config.updateInterval
    this.apiEndpoint = this.config.apiEndpoint

    console.log("Update-Intervall (ms):", this.updateInterval)
    console.log("API Endpoint:", this.apiEndpoint)

    this.getEcoflowData()

    // set timeout for next random text
    setInterval(() => this.getEcoflowData(), this.updateInterval)

    this.updateDom(0);
  },

  /**
   * Handle notifications received by the node helper.
   * So we can communicate between the node helper and the module.
   *
   * @param {string} notification - The notification identifier.
   * @param {any} data - The payload data`returned by the node helper.
   */
  socketNotificationReceived: function (notification, data)
  {
    if (notification === "ECOFLOW_DATA")
      {
        this.sn = `${data.sn}`
        this.deviceName = `${data.deviceName}`
        this.pv1_watts = data.pv1_watts
        this.pv2_watts = data.pv2_watts
        this.grid_watts = data.grid_watts
        this.pv1_voltage = data.pv1_voltage
        this.pv2_voltage = data.pv2_voltage
        this.grid_voltage = data.grid_voltage
        this.pv1_ampere = data.pv1_ampere
        this.pv2_ampere = data.pv2_ampere
        this.grid_ampere = data.grid_ampere
        this.wifi_rssi = data.wifi_rssi
        this.grid_frequency = data.grid_frequency
        this.temperature = data.temperature
        this.max_power = data.max_power
        this.last_update = `${data.last_update}`
        this.last_full_update = `${data.last_full_update}`
        this.state = `${data.state}`
        this.mqtt_connected = `${data.mqtt_connected}`

        //if(this.state === "Online")
        //  console.log("Ecoflow Stream Daten aktualisiert: Watts: " + this.grid_watts + "W")
        //else
        //  console.log("Ecoflow Stream ist offline und liefert aktuell keine Daten!")

        this.updateDom()
      }
  },

  /**
   * Render the page we're on.
   */
  getDom() {
  const wrapper = document.createElement("div");
  wrapper.classdeviceName = "mmm-ecoflow";
  if (this.state !== "Online") {
      wrapper.innerHTML = `
          <div class="mmm-ecoflow-offline">
              <div class="mmm-ecoflow-title">⚡ EcoFlow Stream</div>
              <div class="mmm-ecoflow-status">🔴 Offline</div>
              <div class=".mmm-ecoflow-small">
                  MQTT: ${this.mqtt_connected}
              </div>
          </div>
      `;

      return wrapper;
  }

  wrapper.innerHTML = `
      <div class="mmm-ecoflow-card">

          <div class="mmm-ecoflow-header">
              <span>⚡ EcoFlow Stream</span>
              <span class="mmm-ecoflow-online">🟢 Online</span>
          </div>

          <div class="mmm-ecoflow-deviceName">
              ${this.deviceName}
          </div>

          <div class="mmm-ecoflow-power">
              <div class="mmm-ecoflow-big-value">
                  ${this.grid_watts} W
              </div>
              <div class=".mmm-ecoflow-medium">
                  Netzleistung
              </div>
          </div>

          <div class="mmm-ecoflow-grid">

              <div class="mmm-ecoflow-item">
                  <div class="mmm-ecoflow-label">☀️ PV1</div>
                  <div>${this.pv1_watts} W</div>
                  <div class=".mmm-ecoflow-medium">
                      ${this.pv1_voltage} V · ${this.pv1_ampere} A
                  </div>
              </div>

              <div class="mmm-ecoflow-item">
                  <div class="mmm-ecoflow-label">☀️ PV2</div>
                  <div>${this.pv2_watts} W</div>
                  <div class=".mmm-ecoflow-medium">
                      ${this.pv2_voltage} V · ${this.pv2_ampere} A
                  </div>
              </div>

              <div class="mmm-ecoflow-item">
                  <div class="mmm-ecoflow-label">🔌 Netz</div>
                  <div>${this.grid_watts} W</div>
                  <div class=".mmm-ecoflow-medium">
                      ${this.grid_voltage} V · ${this.grid_ampere} A
                  </div>
              </div>

              <div class="mmm-ecoflow-item">
                  <div class="mmm-ecoflow-label">🌡 Temperatur</div>
                  <div>${this.temperature} °C</div>
              </div>

              <div class="mmm-ecoflow-item">
                  <div class="mmm-ecoflow-label">📶 WLAN</div>
                  <div>${this.wifi_rssi} dBm</div>
              </div>

              <div class="mmm-ecoflow-item">
                  <div class="mmm-ecoflow-label">⚙️ Frequenz</div>
                  <div>${this.grid_frequency} Hz</div>
              </div>

          </div>

          <div class="mmm-ecoflow-footer">
              <div>Max: ${this.max_power} W</div>
              <div>${this.last_update}</div>
          </div>

      </div>
  `;

  return wrapper;
  },

  getEcoflowData()
  {
    this.sendSocketNotification("GET_ECOFLOW_DATA", {apiEndpoint: this.apiEndpoint})
  },

  /**
   * This is the place to receive notifications from other modules or the system.
   *
   * @param {string} notification The notification ID, it is preferred that it prefixes your module deviceName
   * @param {any} data the payload type.
   */
  notificationReceived(notification, data)
  {
    if (notification === "ECOFLOW_DATA") {
      console.log("Notification from other module received")
      this.sn = `${data.sn}`
      this.deviceName = `${data.deviceName}`
      this.pv1_watts = data.pv1_watts
      this.pv2_watts = data.pv2_watts
      this.grid_watts = data.grid_watts
      this.pv1_voltage = data.pv1_voltage
      this.pv2_voltage = data.pv2_voltage
      this.grid_voltage = data.grid_voltage
      this.pv1_ampere = data.pv1_ampere
      this.pv2_ampere = data.pv2_ampere
      this.grid_ampere = data.grid_ampere
      this.wifi_rssi = data.wifi_rssi
      this.grid_frequency = data.grid_frequency
      this.temperature = data.temperature
      this.max_power = data.max_power
      this.last_update = `${data.last_update}`
      this.last_full_update = `${data.last_full_update}`
      this.state = `${data.state}`
      this.mqtt_connected = `${data.mqtt_connected}`
      this.updateDom()
    }
  }
})
