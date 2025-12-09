'use strict';


import Mqtt, { MQTTMessage } from './Mqtt';

import { Logger } from './logger';
import { throws } from 'assert';
import { evenements, KONST } from './controller';
import { Components } from './components';
import { SettingHass } from './settings';
import { getArexx2HassVersion, onEvenement } from './utils';
const logger = new Logger(__filename);

/**
 * 
 */
export class AbstractDevice   { //implements MqttEventListener{

  protected mqtt: Mqtt;
  protected config : SettingHass;
  protected topics2Subscribe : string[];
  private static discoveryOrigin: any;
  private json2delete: any;
  protected lastStatus: any;
  static mqtt: Mqtt;
  static config: SettingHass ;
  protected isFirstTime : boolean;
  protected receiveEventForDelete: any[]; //( data: any) => void;
  protected topics: { state: string; will: string; discovery: string; };
  protected unique_id: string;
  protected devicename: string;
  
  
  constructor(mqtt: Mqtt,  config : SettingHass, unique_id : string, devicename:string = ''){
    if(logger.isDebug())logger.debug(`AbstractDevice constructor for device ${unique_id}, devicename ${devicename}`)
    this.mqtt = mqtt;
    this.topics2Subscribe = [];
    this.isFirstTime = true;
    this.unique_id = unique_id;
    this.config = config;//.homeassistant;
    this.receiveEventForDelete = [];
    if( !AbstractDevice.mqtt) {
        AbstractDevice.mqtt = mqtt;
    }
    if( !AbstractDevice.config) {
        AbstractDevice.config = config;
    }
    this.devicename= devicename;
    this.topics = {
      state : AbstractDevice.getTopicCompleteName('state',unique_id),
      will: AbstractDevice.getTopicCompleteName('will',unique_id),
      discovery: AbstractDevice.getTopicCompleteName('discovery',unique_id),
    }
  }
  
  // protected setName(name: string) {
  //   this.devicename = name
  // }
   
  

  static getDiscoveryOrigin() {
    if (! AbstractDevice.discoveryOrigin) {
        AbstractDevice.discoveryOrigin=  {
        name: 'Arexx bridge', 
        sw: getArexx2HassVersion(), 
        //url: 'https://zdid.github.io/arexx2hass/'
        };
    }
    return AbstractDevice.discoveryOrigin;
  }

  
  static getTopicCompleteName(name: string, unique_id : string, commandtype: string='', config?: SettingHass) : string {
    if(config) {
      AbstractDevice.config = config;
    }
    let  model: string = AbstractDevice.config.topics[name];
    if (!model){
        logger.warn('No topic model for '+name+' in config');
        return '';
    }
    
    model = model.replaceAll('%discovery_bridge_unique_id%',AbstractDevice.config.discovery_bridge_unique_id)
            .replaceAll('%device_unique_id%', unique_id)
            .replaceAll('%base_topic%',AbstractDevice.config.base_topic)
            .replaceAll('%commandtype%',commandtype);
    
    return model;
  }

 


  protected onNewComponent(componentName: string, component: any) {
    return component;
  }
 
  public publishDeleteDevice() {
    /**
     * en deux temps 
     * 1) suppress des sensors
     * 2) suppress de l'appareil 2 secondes après
     */
      this.publishDiscovery(this.json2delete)
      for( let functio of this.receiveEventForDelete) {
        evenements.removeListener(KONST.EVENT_DEVICE+this.unique_id,functio);
      }
      setTimeout(()=>{
        this.publishDiscovery(null)
      },2000)
  }


 
  protected publishDiscoveryAll(typeDevice:string, datanames: string [], model: string,suggested_area?: string) {
    const json = {
      availability: [
        {
          "topic": this.topics.will
        }
      ],
      origin: AbstractDevice.getDiscoveryOrigin(),
      availability_mode: "all",
      device: {
        identifiers: [ this.unique_id ],
        //object_id :  this.devicename || 'inconnu',
        name : this.devicename || 'Baromètre',
        manufacturer : "Arexx",
        model : model,
        sw: getArexx2HassVersion(),
        sn: this.unique_id,
        //hw: '1.0',
        suggested_area: suggested_area
      },
      state_topic : this.topics.state,
      components : {}
     }
     this.json2delete = JSON.parse(JSON.stringify(json));
     let components: {[key:string]:string} = {}
     for(const componentName of datanames) {
      let component = Components.get(typeDevice,componentName)
      if(component === undefined ) {
        continue;
      }
      component['unique_id']=this.unique_id+'_'+componentName

      component.value_template = component.value_template || `{{ value_json.${componentName} }}` 
      if(! component.name && component.name != '') {
         component.name = componentName
      }
      component.default_entity_id = /* component.entity_id = */ (component.name+"."+suggested_area+'_'/*+this.devicename*/
        +'_'+componentName+'_'+this.unique_id).toLocaleLowerCase()
      component.id = component.entity_id
      for(let dataname in component) {
       if(dataname.includes('topic')) {
         component[dataname] = AbstractDevice.getTopicCompleteName('command',this.unique_id,component[dataname]);
       }
      }
      component = this.onNewComponent(componentName, component);
      components[this.unique_id+'_'+componentName] = component;
      this.json2delete.components[this.unique_id+'_'+componentName]= {platform:component.platform}
     }
     json.components = components;
     if(this.isFirstTime) {
      this.receiveEventForDelete.push(onEvenement(KONST.EVENT_DEVICE+this.unique_id, this, 'onDeviceMessage'));
      this.receiveEventForDelete.push(onEvenement(KONST.EVENT_MQTT+this.unique_id, this,  'onMQTTMessage'));
     }
     this.isFirstTime= false;
     this.publishDiscovery(json)
  }  

  onDeviceMessage(evt: any) {
    this.lastStatus = evt;
    this.publishState();
  }
  onMQTTMessage(data: MQTTMessage) {
    throw new Error(`no treatment defined for mqtt message: ${JSON.stringify(data)}` );
    
  }

  publishAllDiscovery() {
    throw new Error('publishAllDiscovery: Implement this Medhod: publishAllDiscovery');
  }
  
  publishDiscovery( payload: any) {
    this.mqtt.publish(this.topics.discovery, payload,  (error: any) => {
      if(error)logger.error(`error from mqtt discovery: ${error}`)
      },{retain: true, qos: 1}); 
  }

  execute(commandName: string,parms  : any, callback: any) {
    throw new Error('Method not implemented.');
  }
  publishState(payload?: any) {
    if(!payload) payload = this.lastStatus;
     this.mqtt.publish(this.topics.state, payload,  (error: any) => {
      if(error)logger.error(`error from mqtt state: ${error}`)
     },{retain: true, qos: 1}); 
   }
}

