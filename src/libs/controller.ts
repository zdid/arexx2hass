'use strict';

import EventEmitter from "events";
import { Logger, LogLevel } from "./logger";
import { RfUsb } from './rfusb'
import { FromHttp } from './fromhttp';
import { HttpServ } from './httpserv';
import { getFileFromConfig,  writeFileToConfig } from "./utils";
import { applyEnvironmentVariables, SettingConfig, SettingResult } from "./settings";
import Mqtt, { MqttEventListener, MQTTMessage } from "./Mqtt";
import Devices from "./devices";
import { AbstractDevice } from "./abstractdevice";

const logger = new Logger(__filename)

export const evenements = new EventEmitter();

export const konst = {
    CONFIG_YAML : 'config.yml',
    DEVICES_YAML: 'devices.yml',
    COMPONENTS_YAML: 'components.yml',
    EVENT_WRITECONFIG: 'writeFile:config',
    EVENT_WRITEDEVICES: 'writeFile:devices',
    EVENT_DEVICE: 'DEVICE:',
    EVENT_MQTT: 'MQTT:',
    EVENT_RECEPTION: 'reception',
    EVENT_ANO      : 'ano',
    EVENT_SETLOGLEVEL : 'setloglevel'
}
var timeoutconfig:any  = undefined;
var timeoutdevices: any = undefined;

export const log = logger;

const AREXX = 'arexx';
interface  Options {
    will: any;
    username?: string;
    password?: string;
  }
  

export class Controller implements MqttEventListener { 
    httpserv: HttpServ | undefined;
    fromHttp: FromHttp | undefined;
    rfUsb: RfUsb | undefined;
    exit: any;
    devices: Devices ;
    mqttClient: Mqtt| undefined;
    config: SettingConfig;
    indexElementaryTopic: number;
    indexCommand: number;
    
    constructor(exit: any ) {
        this.config = getFileFromConfig(konst.CONFIG_YAML);
        applyEnvironmentVariables(this.config);
        if (!this.config.homeassistant.discovery_bridge_unique_id) {
            this.config.homeassistant.discovery_bridge_unique_id = 'ArexxBridge_'+Math.round(Math.random()*1000000);
        }
        evenements.emit(konst.EVENT_WRITECONFIG);
        log.setLevel(this.config.loglevel ?? 'info')
        this.devices = new Devices(this.config)
        this.exit = exit;
        
        let temp = this.config.homeassistant.topics.command
            .split('/')
        this.indexElementaryTopic = temp.indexOf('%device_unique_id%');
        this.indexCommand = temp.indexOf('%commandtype%');
    }

    async start() {
        
        this.mqttClient = new Mqtt(this.config)
        this.mqttClient.addListener(this);
        this.devices.start(this.mqttClient)
    
        await this.mqttClient.connect();
        evenements.on(konst.EVENT_WRITECONFIG, ()=>{
            if( ! timeoutconfig) {
               timeoutconfig = setTimeout(()=>{
                    writeFileToConfig(konst.CONFIG_YAML,this.config);
                    timeoutconfig= null;
                }, 5000);
            }
        });
        evenements.on(konst.EVENT_WRITEDEVICES, (devices)=>{
            if( ! timeoutdevices) {
               timeoutdevices = setTimeout(()=>{
                    writeFileToConfig(konst.DEVICES_YAML,devices);
                    timeoutdevices = null;
                }, 5000);
            }
        });
        
        evenements.on(konst.EVENT_RECEPTION, (evt: SettingResult) =>{
          this.devices.setDeviceFromEvent(evt)
          evenements.emit('DEVICE:'+evt.unique_id, evt);
        });
        
        evenements.on(konst.EVENT_SETLOGLEVEL, (loglevel : LogLevel) =>{
          this.config.loglevel = loglevel;
          log.setLevel(loglevel);
          evenements.emit(konst.EVENT_WRITECONFIG);
        })   
        
        evenements.on(konst.EVENT_ANO, ()=>{ this.stop()});

        // read a usb arexx bs50x
        if(this.config.arexx.isusb) {
            this.httpserv = new HttpServ(this.config.arexx);
            this.httpserv.start();
            this.rfUsb = new RfUsb(this.config.arexx);
            this.rfUsb.start();
        } else
        // read bs1000 or bs5xx remote
        if(this.config.arexx.address) {
            // read from http 
            this.fromHttp = new FromHttp(this.config.arexx);
            this.fromHttp.start();
        } else {
            this.httpserv = new HttpServ(this.config.arexx);
            this.httpserv.start();  
        }
    }
    stop(flag: boolean = false) {
       this.mqttClient?.stop();
       this.rfUsb?.stop();
       this.fromHttp?.stop();
       this.httpserv?.stop();
       this.exit();  
    }
    subscribeTopic(): string[]{
        return [AbstractDevice.getTopicCompleteName('ecoute',
            this.config.homeassistant.discovery_bridge_unique_id,'',this.config.homeassistant),
            AbstractDevice.getTopicCompleteName('homeassistant_availability','','',this.config.homeassistant)];
    }
    onMQTTMessage(data: MQTTMessage) {
        log.debug(`receive from mqtt ${JSON.stringify(data)}`)
        if(AbstractDevice.getTopicCompleteName('homeassistant_availability','') ==data.topic) {
            this.avaibilityHomeAssistant(data)
            return;
        }
        let topicSplit = data.topic.split('/')
        let elementaryTopic = topicSplit[this.indexElementaryTopic];
        data.topic = elementaryTopic
        data.command = topicSplit[this.indexCommand];
        log.debug(`receive from mqtt data: ${JSON.stringify(data)}`)
        if(!data.command || data.command === 'state' ) {
            return;
        }

        logger.debug(`controller on mqtt ${JSON.stringify(data)}`)
        evenements.emit('MQTT:'+elementaryTopic, data)
    }
    private avaibilityHomeAssistant(data: MQTTMessage) {
        if(data.message === 'online') {
            this.devices.startPublishDiscovery();
        } else {
            this.devices.stopPublishDiscovery();
        }
    }
}

