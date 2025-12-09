import { json } from "body-parser";
import { AbstractDevice } from "./abstractdevice";
import { evenements, KONST } from "./controller";
import { Logger, LogLevel } from "./logger";
import Mqtt, { MQTTMessage } from "./Mqtt";
import { SettingConfig, SettingDevice, SettingHass } from "./settings";
import { getArexx2HassVersion } from "./utils";

let logger = new Logger(__filename)

interface SettingBridge {
    receivertype: string;
    loglevel: LogLevel;
    discovery: boolean;
    address: string;
}
/**
 * Bridge is paramters screen in hass
 */
export class BridgeDevice extends AbstractDevice{
    datanames: string[];
    confHass: SettingHass;
    bridgeValues: SettingBridge;
    configG: SettingConfig;


    constructor(mqtt: Mqtt, config: SettingConfig) {
        super(mqtt,config.homeassistant,config.homeassistant.discovery_bridge_unique_id, 'ArexxBridge');
        if(logger.isDebug())logger.debug(`BridgeDevice constructor ${JSON.stringify(config,null,4)}`)
        this.configG = config;
        this.confHass = config.homeassistant;
        this.mqtt = mqtt;
        this.datanames = ['address','receivertype','loglevel','discovery']
        this.bridgeValues = {
            receivertype: 'BS1000 or BS5xx',
            address:  this.configG.arexx.address ,
            loglevel: this.configG.loglevel,
            discovery: this.confHass.discovery
        }

    }
    setaddress(address: string) {
        evenements.emit(KONST.EVENT_SETADDRESSAREXX, address ) ;
    }
    setloglevel(level: LogLevel) {
        this.bridgeValues.loglevel = level;
        this.lastStatus = this.bridgeValues;
        this.publishState();
        evenements.emit(KONST.EVENT_SETLOGLEVEL, level ) ;
    }
    setDiscovery(message: any) {
        if(logger.isDebug())logger.debug(`message discovery ${message}`)
        message = message.toLowerCase() ===  'true'
        if(logger.isDebug())logger.debug(`message: ${typeof message} ${message}`)
        this.confHass.discovery = message;
        this.bridgeValues.discovery = message;
        this.lastStatus = this.bridgeValues;
        this.publishState();
        evenements.emit(KONST.EVENT_WRITECONFIG);
    }
    onMQTTMessage(data: MQTTMessage): void {
        switch (data.command) {
            case "setloglevel":
                this.setloglevel(data.message);
                break;
            case "setdiscovery":
                this.setDiscovery(data.message);
                break;
            case "setaddress":
                this.setaddress(data.message);
                break;
            default:
                logger.error('unknown command ' + data.command)
                break;
        }
    }    
    publishAllDiscovery(): void {
        this.publishDiscoveryAll('bridge',this.datanames,'Bridge Arexx','Arexx Bridge');
        this.publishState(this.bridgeValues)
    }
}