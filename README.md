

# MMM-SwitchBot

*MMM-SwitchBot* is a module for [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror) that displays that displays data of your SwitchBot sensors exposed by the Switchbot API.

For more information on the API [API](htttps://github.com/OpenWonderLabs/SwitchBotAPI).


## Screenshot

![Example of MMM-SwitchBot](./example_1.png)

## Installation

### Install

In your terminal, go to the modules directory and clone the repository:

```bash
cd ~/MagicMirror/modules
git clone https://github.com/raubritterott/MMM-SwitchBot
```

### Update

Go to the module directory and pull the latest changes:

```bash
cd ~/MagicMirror/modules/MMM-SwitchBot
git pull
```

## Configuration

To use this module, you have to add a configuration object to the modules array in the `config/config.js` file.

### Example configuration

Minimal configuration to use the module:

```js
    {
        module: 'MMM-SwitchBot',
        position: "top_right",
        config: {
            token: 'yourToken',     // SwitchBot app developer settings
            secret: 'yourSecret',   // SwitchBot app developer settings
            updateInterval: 60000,
            deviceId: 'deviceId',   // mac of your SwitchBot device 
            displayName: 'NameDisplayedOnTheMirror'
        }
	},
```

Configuration with all options:

```js
    {
        module: 'MMM-SwitchBot',
        position: "top_right",
        config: {
            token: 'yourToken',     // SwitchBot app developer settings
            secret: 'yourSecret',   // SwitchBot app developer settings
            updateInterval: 60000,
            deviceId: 'deviceId',   // mac of your SwitchBot device 
            displayName: 'NameDisplayedOnTheMirror'
        }
	},
```

<!--### Configuration options

Option|Possible values|Default|Description
------|------|------|-----------
`exampleContent`|`string`|not available|The content to show on the page

## Sending notifications to the module

Notification|Description
------|-----------
`TEMPLATE_RANDOM_TEXT`|Payload must contain the text that needs to be shown on this module

## Developer commands

- `npm install` - Install devDependencies like ESLint.
- `node --run lint` - Run linting and formatter checks.
- `node --run lint:fix` - Fix linting and formatter issues.
-->
## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Changelog

All notable changes to this project will be documented in the [CHANGELOG.md](CHANGELOG.md) file.
