process.env['AREXX2HASS_DATA_PATH'] = '/home/didier/Developpements/workspace6/arexx2hass_config';
process.env['AREXX2HASS_LOG_LEVEL'] = 'debug';
process.env['AREXX2HASS_MQTT_SERVER'] =  'ftp://localhost:1883'
process.env['AREXX2HASS_MQTT_USERNAME'] = 'didier'
process.env['AREXX2HASS_MQTT_PASSWORD'] = 'G2filles'
console.log('fin process')

let args = process.argv;
let args0 = args[0].split('/');
console.log(args0[args0.length-1 ]) 

//if(args0[args0.length-1 ]==='node') {
import { dev } from './index'
dev();