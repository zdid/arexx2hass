# EN CONSTRUCTION
# EN CONSTRUCTION
# EN CONSTRUCTION
# EN CONSTRUCTION
# EN CONSTRUCTION
# AREXX2HASS
Arexx to home assistant by MQTT bridge for RFXtrx433 devices

All received Arexx events are published to the MQTT 
It is up to the MQTT receiver to filter these messages or to have a register/learning/pairing mechanism.

## Usage

### Configuration

See example **config.yml**


### Subscribe to topic **arexx2hass/devices** to receive incoming messages.

Example JSON message on topic `"arexx2hass/ArexxBridge_00001/AREXX-8852/state"`:

    {
      "value": "19.9",
      "dbm":"-98",
      "name": "yourpropername",
      "unique_id": "AREXX-8852",
    }

## Publish command examples (topic/payload)
