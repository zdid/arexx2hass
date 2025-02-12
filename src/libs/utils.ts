import path from "path";
import { Logger } from './logger';
import { constants, copyFileSync, existsSync, readFileSync, writeFileSync } from "fs";
import YAML from 'yaml';
import { evenements } from "./controller";

const logger = new Logger(__filename)

export function getArexx2HassVersion(): string {
  const packageJSON = require('../../package.json');
  return packageJSON.version;
}  

export function capitalize(str : string) {
  let lstr = str.split("");
  if(lstr[0]) { 
    lstr[0] = lstr[0].toUpperCase();
  }
  return lstr.join('');
}


export function onEvenement(eventname: string, instance: any, method:string){
  let receive =  (data: any) => {
    instance[method](data);
  }
  evenements.on(eventname, receive)
  return receive;
}

export function getFileFromConfig(fileName:string) : any {
  let from = "";
  let cible = (process.env.AREXX2HASS_DATA_PATH ?? "/app/data")+'/'+fileName;
  let temp = path.resolve(__dirname+'/../config_default/'+fileName)
  if(existsSync(temp)) { 
      from = temp;
  } 
  temp = path.resolve(__dirname+'/../../config_default/'+fileName)
  if(existsSync(temp)) {
      from = temp
  }
  // ne copie pas si existe déjà
  logger.debug(`getFileFromConfig copy de : '${from}' sur '${cible}'` )
  try {
      copyFileSync(from,cible, constants.COPYFILE_EXCL);
  } catch (error) {
     // logger.info(` fichier ${cible} existe déjà ${error} `)   
  }
  //logger.info(`load file ${cible}`)
  return YAML.parse(readFileSync(cible, 'utf-8').toString());
}

export function writeFileToConfig(fileName: string, data: Object) {
  let cible  = (process.env.AREXX2HASS_DATA_PATH ?? "/app/data")+'/'+fileName
  try {
      const valyaml = YAML.stringify(data);
      writeFileSync(cible , valyaml, 'utf8');
  } catch (error) {
      logger.error(`write  file ${cible} failed , ${error}`)            
  }
}

/**
 * return topicname completed
 * @param {String} topicName topic name is in config
 * @param {Object} sensorDesc sensor description (in config)
 * @param {Object} deviceConf the sensor in config
 * @return {string} topicname completed
 */
// export function getTopicFrom_desuet(topicName:string , sensorDesc: any, deviceConf?:any) {
//   let conf ='';
//   logger.debug(`topicName', ${topicName}`);
//   if (config.mqtt.topics[topicName].startsWith('/') ) {
//     conf = config.mqtt.base_topic;
//   }
//   conf += config.mqtt.topics[topicName];
//   if (sensorDesc) {
//     Object.keys(sensorDesc).forEach((name: string)=>{  
//       conf = conf.replace('%'+name+'%', sensorDesc[name]);
//     });
//   }
//   if (deviceConf) {
//     Object.keys(deviceConf).forEach((name)=>{
//       conf = conf.replace('%'+name+'%', deviceConf[name]);
//     });
//   }
//   return conf;
// }
