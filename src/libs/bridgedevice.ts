import { AbstractDevice } from "./abstractdevice";
import { evenements, konst } from "./controller";
import { Logger, LogLevel } from "./logger";
import Mqtt, { MQTTMessage } from "./Mqtt";
import { SettingConfig, SettingDevice, SettingHass } from "./settings";
import { getArexx2HassVersion } from "./utils";

let logger = new Logger(__filename)

interface SettingBridge {
    version: string;
    receivertype: string;
    loglevel: LogLevel;
    discovery: boolean;
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
        super(mqtt,config.homeassistant,config.homeassistant.discovery_bridge_unique_id, 'Bridge');
        this.configG = config;
        this.confHass = config.homeassistant;
        this.mqtt = mqtt;
        this.datanames = ['version','receivertype','loglevel','discovery']
        this.bridgeValues = {
            version: getArexx2HassVersion(),
            receivertype: 'TODO',
            loglevel: this.configG.loglevel,
            discovery: this.confHass.discovery
        }

    }
    setloglevel(level: LogLevel) {
        this.bridgeValues.loglevel = level;
        this.lastStatus = this.bridgeValues;
        this.publishState();
        evenements.emit(konst.EVENT_SETLOGLEVEL, level ) ;
    }
    setDiscovery(message: any) {
        logger.debug(`message discovery ${message}`)
        message = message.toLowerCase() ===  'true'
        logger.debug(`message: ${typeof message} ${message}`)
        this.confHass.discovery = message;
        this.bridgeValues.discovery = message;
        this.lastStatus = this.bridgeValues;
        this.publishState();
        evenements.emit(konst.EVENT_WRITECONFIG);
    }
    onMQTTMessage(data: MQTTMessage): void {
        switch (data.command) {
            case "setloglevel":
                this.setloglevel(data.message);
                break;
            case "setdiscovery":
                this.setDiscovery(data.message);
                break;
            default:
                logger.error('unknown command ' + data.command)
                break;
        }
    }    
    publishAllDiscovery(): void {
        this.publishDiscoveryAll('bridge',this.datanames,'Arexx','infra');
        this.publishState(this.bridgeValues)
    }
}