# AREXX2HASS

This is a Mqtt bridge between HomeAssistant and Arexx BS10xx and bs5xx hardware.
Discovery mode is enabled by default, but information is only transmitted to HomeAssistant after validation.

## USAGE 
### WITH HOMEASSISTANT
Validation is done through a specific object in ha.
This object is accessible via the menu
 - settings->Devices and services->MQTT->devices->New Arexx

2 boxes interest us:
- configuration
- diagnostic
  
In the configuration box:
- select the arexx device in the list
- fill in the 'name' and 'suggested Area' fields, ex: Temperature and Living room
- click on 'press' of 'add/modify'

The sensor is then sent to ha and assigned to the indicated room.
Why enter this data? to recognize them immediately in the arexx2hass settings (config/devices.yml), and assign a full name to the entity_id of ha.

### Installation
This module can be installed
- either directly by git cloning on your machine
- or by docker (installation recommended) on x86/amd64 or arm64 machines. There is no version for armv7 at the moment.
- not yet by NPM

On Docker installations, use the compose.yml file below. you must adapt to your environment
```bibtex
services:
  arexx2mqtt:
    image: zdid2/arexx2hass:latest
    container_name: arexx2hass
    privileged: true
    volumes:
      - ./data:/app/data
    environment:
      AREXX2HASS_MQTT_SERVER: localhost
      AREXX2HASS_MQTT_USER: youruser
      AREXX2HASS_MQTT_PASSWORD: passwd
      TZ: Europe/Paris
    restart: unless-stopped
    #devices:
    #- /dev/ttyUSB0:/dev/ttyUSB0
```
customize the contents of "volumes" and "environment".

During the first start a copy of the configuration files are made accessible on ./data
then you can act on the config.yml file (voir Configuration)
 
The devices.yml file contains the configuration data for ha of the Arexx sensors detected.

#### Installation on BS1000
2 possibilities:
1) recommended method: position by access to the bs1000 administrator mode,
- http://ADRESSE_IP_ BS1000
- clic menu 'Admin',
- enter user admin password,
- clic menu 'Messenger'
- in "Messengers rules" panel upload 'rulefile.txt' with the following content:
```bibtex
Vrulefile
A1push to templogger
B2
C0
E<ADDRESS OF AREXX2HASS>:49161/rules
Ztype==$q&&id==$i&&time==$S&&v==$v&&rssi==$r&&missing==$w
```
2) otherwise (easier and not recommended) indicate by parameter the network address of the bs1000 by the parameter box of arexx2hass (address) in HA:
- parameters->Devices and services->MQTT->devices->ArexxBridge

#### Installation with a BS5xx
The BS5xx must be connected to a rpi with an operating system that recognizes the BS5xx (bullseye) (the most recent ones do not recognize it (incident to submit to Arexx))
On the arexx site you have to download the specific module rf_usb_http_rpi_0_6 https://arexx.nl/com-old/templogger/html/nl/software.php (also present in the linux directory). See on github
as for the BS1xxx the rulefile.txt file is necessary but also the device.xml file.
When Arexx will have solved the problem of assigning the USB device, the module can be executed directly on the docker.
Arexx to home assistant by MQTT bridge for RFXtrx433 devices. 


### Configuration
File: config.yml in data directory
```bibtex
loglevel: debug  # change on HA ArexxBridge 
homeassistant: # Paramétrage p
  discovery: true  # change on HA ArexxBridge 
  base_topic: arexx2hass
  discovery_bridge_unique_id: ArexxBridge_000001 # for arexx2hass multiple, change here
  topics: # Do not modify topic templates
    discovery: homeassistant/device/%discovery_bridge_unique_id%/%device_unique_id%/config
    command: "%base_topic%/%discovery_bridge_unique_id%/%device_unique_id%/%command\
      type%"
    state: "%base_topic%/%discovery_bridge_unique_id%/%device_unique_id%/state"
    will: "%base_topic%/%discovery_bridge_unique_id%/status"
    homeassistant_availability: homeassistant/status
    ecoute: "%base_topic%/%discovery_bridge_unique_id%/#"
mqtt:
  base_topic: arexx2hass
  server: ftp://localhost:1883 # mqtt server
  username: null # Specify username to access Mqtt
  password: null # Specify password to access Mqtt
  qos: 0
  retain: false # todo
  retain_config: true # todo
arexx:
  address: XX.XX.XX.XX # Not recommended for BS1000, change on HA ArexxBridge 
  httpserv_port: 49161
  isusb: false # When Arexx has corrected the problem, to activate the BS5xx directly on the same machine
  #      change on HA ArexxBridge 
  
```

