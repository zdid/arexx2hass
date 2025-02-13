import {  SettingConfig, SettingDevice, SettingResult } from './settings';
import { Logger } from './logger';
import { ArexxDevice } from './arexxdevice'
import { BridgeDevice } from './bridgedevice';
import { NewArexxDevice } from './newarexxdevice';
import Mqtt from './Mqtt';
import { getFileFromConfig, writeFileToConfig } from './utils';
import { evenements, KONST } from './controller';

const logger = new Logger(__filename);



/**
 * Devices contains the devices detected with a flag for send to mqtt
 */
export class Devices {
   
   private config: SettingConfig;
   private devicesParms: {[s: string]: any}
    private devices: {[s: string]: ArexxDevice}; 
    private timer?: NodeJS.Timeout= undefined;
    private isModifiedDevices: boolean; 
    private mqtt: any;
    private iarexx: any;
    private bridgeDiscovery?: BridgeDevice;
    private hassStarted: boolean;
    private publishWait:boolean;
    private newArexxDevice?: NewArexxDevice;
    
    //private listOfNewsParametersDevice: AbstractDevice[]
    private saveTimeout: any;

    constructor( config: SettingConfig) {
        this.devices = {};
        this.devicesParms = {};
        this.config = config;
        this.hassStarted = false;
        this.publishWait = false;
        this.isModifiedDevices = false;
        //this.listOfNewsParametersDevice = [];
    }
 
    start(mqtt: Mqtt): void {
        this.mqtt = mqtt;
        this.bridgeDiscovery = new BridgeDevice(mqtt,this.config)
        this.newArexxDevice = new NewArexxDevice(mqtt,this.config.homeassistant,this);
        this.loadDevices();
   }

    stop(): void {
        clearInterval(this.timer);
        this.save();
    }

    private addDevice(dev:  SettingDevice) {
        this.devicesParms[dev.unique_id] = dev;
        if(dev.transmit) {
            this.devices[dev.unique_id] = new ArexxDevice(this.mqtt,this.config.homeassistant,dev)
            if(this.hassStarted) {
                this.devices[dev.unique_id].publishAllDiscovery();
            }
        }
        }

    setNewDevice(setting: SettingDevice) {
        this.addDevice(setting);
        this.isModifiedDevices = true;
        this.save();

    }
   
    getDeviceParm(unique_id: string): SettingDevice {
        return JSON.parse(JSON.stringify(this.devicesParms[unique_id]));
    }
    
    deleteDevice(numdevice: string) {
        if(logger.isDebug())logger.debug(`deleteDevice de devices ${numdevice}`)
        if(this.devicesParms) {
            delete this.devicesParms[numdevice];
            this.isModifiedDevices = true;
        }
        if(this.devices[numdevice]) {
            this.devices[numdevice].publishDeleteDevice();
            delete this.devices[numdevice];
        }
        this.save();
    }

    private loadDevices(): void {
        if(logger.isDebug())logger.debug("loaddevives")
        let tempDevicesParms : any = getFileFromConfig(KONST.DEVICES_YAML)
        if(logger.isDebug())logger.debug(`loaddevices ${JSON.stringify(tempDevicesParms)}`)
        if(tempDevicesParms === null || tempDevicesParms === undefined) {
            tempDevicesParms = {};
        }
        if(Array.isArray(tempDevicesParms) ) {
            this.devicesParms = {}
            for(let dev of tempDevicesParms) {
                this.devicesParms[dev.unique_id] = dev;
            }
            evenements.emit(KONST.EVENT_WRITEDEVICES, this.devicesParms )
        } else {
            this.devicesParms = tempDevicesParms;
        }
        this.devices = {};
        for(let ident in this.devicesParms) {
            if(logger.isDebug())logger.debug(` read ident ${ident} `)
            this.addDevice(this.devicesParms[ident]);
        }
    }
    getKeysDevices() {
        return Object.keys(this.devicesParms).sort();
    }
    
    
    private save(): void {
        if(this.saveTimeout) {
            return;
        }
        if (this.isModifiedDevices === true) {
            logger.info(`Saving devices to file devices.yml`);
            evenements.emit(KONST.EVENT_WRITEDEVICES, this.devicesParms)
          } 
    }

    setDeviceFromEvent(evt: SettingResult ) : void {
        if( ! this.devicesParms[evt.unique_id] 
            &&  this.config.homeassistant.discovery) {
                let dev : SettingDevice = {
                    unique_id : evt.unique_id,
                    name:'',
                    transmit: false,
                    suggested_area: '', 
                    except: {
                        humidity:     evt.typecapt== '3'?false:true,
                        temperature:  evt.typecapt== '3'?true:false
                    }
                }
                this.setNewDevice(dev);
         }
 
    }

   
    stopPublishDiscovery() {
        this.hassStarted = false;
    }
   
    startPublishDiscovery() {
        logger.info('start to publish discovery message')
        this.hassStarted = true;
        this.publishAllDiscovery();
    }
 
    async publishAllDiscovery() {
        if(logger.isDebug())logger.debug('publishAllDiscovery')
        if(this.publishWait) return;
        this.publishWait = true;
        if(logger.isDebug())logger.debug(`publishAllDiscovery de bridge`)
        this.bridgeDiscovery?.publishAllDiscovery();
        if(logger.isDebug())logger.debug(`publishAllDiscovery de newarexx`)
        this.newArexxDevice?.publishAllDiscovery();
        for(let ident in this.devices) {
            if(logger.isDebug())logger.debug(`publishAllDiscovery de ${ident}`)
            this.devices[ident].publishAllDiscovery();
        }
        // logger.info("publishAllDiscovery avant new onoff virtual")
        // for(let numparmdevice in this.listOfNewsParametersDevice) {
        //     this.listOfNewsParametersDevice[numparmdevice].publishAllDiscovery();
        // }
        this.publishWait = false;
    }

    async execute(unique_id: string, command: string, parm : any, callback: Function) {
        if(this.devices[unique_id]) {
            await this.devices[unique_id].execute(command,parm, callback);
        } else {
            logger.error(`exec command on '${unique_id}' : device no exists`)
        }
    }
 
}

export default Devices;
