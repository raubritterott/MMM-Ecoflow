const NodeHelper = require("node_helper");
const crypto = require("crypto");
const https = require('https');

module.exports = NodeHelper.create(
{

  async socketNotificationReceived(notification, payload)
  {
    if (notification === "GET_SWITCHBOT_DATA")
    {
      const { token, secret, deviceId } = payload; // Extrahiere token und secret aus dem Payload-Objekt
      console.log("GET_SWITCHBOT_DATA wurde aufgerufen");
      //console.log("Token:", token);
      //console.log("Secret:", secret);
      const t = Date.now();
      const nonce = "MagicMirrorAO";
      const data = token + t + nonce;
      const sign = crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('base64');
      const options = {
          hostname: 'api.switch-bot.com',
          port: 443,
          path: `/v1.1/devices/${deviceId}/status`, ///${deviceId}/commands`,
          method: 'GET',
          headers: {
              "Authorization": token,
              "sign": sign,
              "nonce": nonce,
              "t": t,
              'Content-Type': 'application/json',
              //'Content-Length': body.length,
          },
      };
      
      const req = https.request(options, (res) =>
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
            const version = json.body?.version || "";
            const temperature = json.body?.temperature === 0 ? "0.0" : json.body?.temperature ?? "";
            const humidity = json.body?.humidity === 0 ? "0" : json.body?.humidity ?? "";
            const battery = json.body?.battery === 0 ? "0" : json.body?.battery ?? "";
            const deviceType = json.body?.deviceType || "";
            const status = json.message || "Error parsing message";

            //console.log("Response:", json);

            this.sendSocketNotification("SWITCHBOT_DATA", { version: version, temperature: temperature, humidity: humidity, battery: battery, deviceType: deviceType, status: status });

          }
          catch (err)
          {
            console.error("Fehler beim JSON-Parsen:", err);
            this.sendSocketNotification("SWITCHBOT_DATA", { status: "Parse error" });
          }
        });
      });

      req.on("error", (error) =>
      {
        console.error("HTTPS error:", error);
        this.sendSocketNotification("SWITCHBOT_DATA", { status: "HTTPS error" });
      });

      req.end();
    }
  },

})
