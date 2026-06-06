

# MMM-Ecoflow

*MMM-Ecoflow* is a module for [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror) that displays data of your Ecoflow Stream Inverter exposed by Ecoflow-MQTT-Bridge..

For more information see Ecoflow IoT Developer Platform (https://developer-eu.ecoflow.com/us/document/introduction).


## Screenshots

### Online State State
![Example of MMM-Ecoflow](./example_1.png)

### Offline State
![Example of MMM-Ecoflow](./example_2.png)

## Installation

### Install

In your terminal, go to the modules directory and clone the repository:

```bash
cd ~/MagicMirror/modules
git clone https://github.com/raubritterott/MMM-Ecoflow
```

### Update

Go to the module directory and pull the latest changes:

```bash
cd ~/MagicMirror/modules/MMM-Ecoflow
git pull
```

## Configuration

To use this module, you have to add a configuration object to the modules array in the `config/config.js` file.

### Example configuration

Minimal configuration to use the module:

```js
    {
        module: 'MMM-Ecoflow',
        position: "top_right",
        config: {
            updateInterval: 60000,
        }
	},
```

Configuration with all options:

```js
    {
        module: 'MMM-Ecoflow',
        position: "top_right",
        config: {
            updateInterval: 60000,
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
