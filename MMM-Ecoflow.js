Module.register("MMM-Ecoflow",
{
  defaults:
  {
    updateInterval: 60 * 1000, // default update interval is 1 minute

    sn: null,
    name: "",
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

    this.getEcoflowData()

    console.log("Update-Intervall (ms):", this.updateInterval)

    // set timeout for next random text
    setInterval(() => this.getEcoflowData(), this.updateInterval)
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
        this.name = `${data.name}`
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

        if(this.state === "Online")
          console.log("Ecoflow Stream Daten aktualisiert: Watts: " + this.grid_watts + "W")
        else
          console.log("Ecoflow Stream MQTT Status: " + this.mqtt_connected)
          console.log("Ecoflow Stream ist offline und liefert aktuell keine Daten!")

        this.updateDom()
      }
  },

  /**
   * Render the page we're on.
   */
  getDom()
  {
    /*let icon = "fa-battery-half"; // Default
    if (this.battery > 80) icon = "fa-battery-full";
    else if (this.battery > 60) icon = "fa-battery-three-quarters";
    else if (this.battery > 40) icon = "fa-battery-half";
    else if (this.battery > 20) icon = "fa-battery-quarter";
    else icon = "fa-battery-empty";*/

    const wrapper = document.createElement("div")
    if (this.state === "Online")
    {
      wrapper.classList.add("mediumText");
      wrapper.innerHTML = `<b>Ecoflow Stream (${this.name})</b> &nbsp; 
      ${this.grid_watts} Watt`
    }
    else
    {
      wrapper.innerHTML = `<b>Ecoflow Stream</b> - MQTT ${this.mqtt_connected} - Stream ist offline`
    }
    return wrapper

  },

  getEcoflowData()
  {
    this.sendSocketNotification("GET_ECOFLOW_DATA", {})
  },

  /**
   * This is the place to receive notifications from other modules or the system.
   *
   * @param {string} notification The notification ID, it is preferred that it prefixes your module name
   * @param {any} data the payload type.
   */
  notificationReceived(notification, data)
  {
    if (notification === "ECOFLOW_DATA") {
      console.log("Notification from other module received")
      this.sn = `${data.sn}`
      this.name = `${data.name}`
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
