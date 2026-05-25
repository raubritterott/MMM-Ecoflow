Module.register("MMM-SwitchBot",
{
  defaults:
  {
    token: "",
    secret: "",
    updateInterval: 60000, // default update interval is 1 minute
    version: null,
    temperature: null,
    humidity: null,
    battery: null,
    deviceType: null,
    status: "waiting for data",
    deviceId: null,
    displayName: "notDefined"
  },

  /**
   * Apply the default styles.
   */
  getStyles()
  {
    return ["SwitchBot.css"]
  },

  /**
   * Pseudo-constructor for our module. Initialize stuff here.
   */
  start() 
  {
    this.token = this.config.token
    this.secret = this.config.secret
    this.updateInterval = this.config.updateInterval
    this.deviceId = this.config.deviceId
    this.displayName = this.config.displayName
    this.getSwitchBotData()

    console.log("Update-Intervall (ms):", this.updateInterval)

    // set timeout for next random text
    setInterval(() => this.getSwitchBotData(), this.updateInterval)
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
    if (notification === "SWITCHBOT_DATA")
      {
        this.temperature = `${data.temperature}`
        this.humidity = `${data.humidity}`
        this.battery = `${data.battery}`
        this.deviceType = `${data.deviceType}`
        this.status = `${data.status}`
        if(this.status === "success")
          console.log("Daten aktualisiert:", this.temperature, this.humidity, this.battery, this.deviceType)
        else
          console.log("Fehler beim Abrufen der Daten!")
        this.updateDom()
      }
  },

  /**
   * Render the page we're on.
   */
  getDom()
  {
    let icon = "fa-battery-half"; // Default
    if (this.battery > 80) icon = "fa-battery-full";
    else if (this.battery > 60) icon = "fa-battery-three-quarters";
    else if (this.battery > 40) icon = "fa-battery-half";
    else if (this.battery > 20) icon = "fa-battery-quarter";
    else icon = "fa-battery-empty";

    const wrapper = document.createElement("div")
    if (!this.status || this.status === "waiting for data")
    {
      wrapper.innerHTML = `<b>SwitchBot (${this.displayName})</b> - Warte auf Daten...`
    }
    else if (this.status === "success")
    {
      wrapper.classList.add("mediumText");
      wrapper.innerHTML = `<b>SwitchBot (${this.displayName}) &nbsp; 
      ${this.temperature}°C &nbsp; 
      <i class="fas fa-tint"></i> ${this.humidity}% &nbsp;
      <i class="fas ${icon}"></i> ${this.battery}%
      </b>`
    } 
    else
    {
      wrapper.innerHTML = `<b>SwitchBot Data - $${this.displayName}</b><br />Fehler beim abrufen der Daten: ${this.status}`
    }
    return wrapper
  },

  getSwitchBotData()
  {
    this.sendSocketNotification("GET_SWITCHBOT_DATA", { token: this.token, secret: this.secret, deviceId: this.deviceId, displayName: this.displayName })
  },

  /**
   * This is the place to receive notifications from other modules or the system.
   *
   * @param {string} notification The notification ID, it is preferred that it prefixes your module name
   * @param {any} data the payload type.
   */
  notificationReceived(notification, data)
  {
    if (notification === "SWITCHBOT_DATA") {
      console.log("Notification from other module reveived:", this.temperature, this.humidity, this.battery, this.deviceType)
      this.temperature = `${data.temperature} °C`
      this.humidity = `${data.humidity} %`
      this.battery = `${data.battery} %`
      this.deviceType = `${data.deviceType}`
      this.status = `${data.status}`
      console.log("Daten aktualisiert:", this.temperature, this.humidity, this.battery, this.deviceType)
      this.updateDom()
    }
  }
})
