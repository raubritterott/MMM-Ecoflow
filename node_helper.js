const NodeHelper = require("node_helper");
const crypto = require("crypto");
const https = require('https');

module.exports = NodeHelper.create(
{

  async socketNotificationReceived(notification, payload)
  {
    if (notification === "GET_ECOFLOW_DATA")
    {
      console.log("GET_ECOFLOW_DATA wurde aufgerufen");

      const options = {
          hostname: 'localhost',
          port: 5000,
          path: `/api/ecoflow/flat`, ///${deviceId}/commands`,
          method: 'GET',
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
            //const version = json.body?.version || "";
            const name = json.body?.name || "-";
            const temperature = json.body?.temperature === 0 ? "0.0" : json.body?.temperature ?? "";
            //const humidity = json.body?.humidity === 0 ? "0" : json.body?.humidity ?? "";
            //const battery = json.body?.battery === 0 ? "0" : json.body?.battery ?? "";
            //const deviceType = json.body?.deviceType || "";
            const state = json.body?.state || "Offline";
            //console.log("Response:", json);

            this.sendSocketNotification("ECOFLOW_DATA", { name: name, temperature: temperature, state: state });

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
        console.error("HTTPS error:", error);
        this.sendSocketNotification("ECOFLOW_DATA", { state: "HTTPS error" });
      });

      req.end();
    }
  },

})
