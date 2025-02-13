import { AbstractDevice } from "./abstractdevice";
import { ArexxDevice } from "./arexxdevice";
import Devices from "./devices";
import { Logger } from "./logger";
import Mqtt, { MQTTMessage } from "./Mqtt";
import { SettingDevice, SettingHass } from "./settings";

const logger = new Logger(__filename)
interface iNad  {
    exists_choice:  string;
    unique_id:      string;
    name:           string;
    suggested_area: string;
    type:           string;
    message:        string;
}
const NEWAREXX = 'NEWAREXX'
export class NewArexxDevice extends AbstractDevice {
    private devices: Devices;
    private datanames: string[];
    private choiceDevice: iNad;
    private deviceChoisi: SettingDevice;

    constructor(mqtt: Mqtt, confHass: SettingHass, devices: Devices) {
        super(mqtt,confHass,NEWAREXX,'New Arexx');
        this.devices = devices;
        this.datanames = ['exists_choice','name', 'suggested_area', 
            'clicvalid', 'clicdelete','clicclear', 'unique_id','message'] ;
        this.choiceDevice = { 
            exists_choice:  '',
            unique_id:      '',      
            name:           '',
            suggested_area: '',
            type:           '',
            message:        ''
        }
        this.deviceChoisi = {
            unique_id : '',
            except: {temperature: true, humidity: true},
            name:'',
            transmit:false,
            suggested_area:''
        }
    }
    protected onNewComponent(componentName: string, component: any) : any{
        if(componentName === 'exists_choice') {
            let list= this.devices.getKeysDevices()
            component.options = list;
        } 
        return component;
    }
    private clearDevice() {
        this.choiceDevice = { 
            exists_choice:  '',
            unique_id:      '',
            name:           '',
            suggested_area: '',
            type:           '',
            message:        ''
        }
    }
    private setChoiceDevice(unique_id: string) {
        let device : SettingDevice = this.devices.getDeviceParm(unique_id);
        this.deviceChoisi = device;
        if(device === undefined) {
            this.clearDevice();
        } else {
            this.choiceDevice = {
                exists_choice:  device.unique_id,
                unique_id:      device.unique_id,
                name:           device.name,
                suggested_area: device.suggested_area || '',
                type:           device.except.humidity?'Temperature': 'Humidity',
                message:        ''
            }
        }
    }



    onMQTTMessage(data: MQTTMessage): void {
        if(logger.isDebug())logger.debug(`reception mqtt: ${JSON.stringify(data)}`)
        let  fSendDiscovery = false;
        switch (data.command) {
            case 'set_exists_choice': 
                if(data.message) {
                    this.setChoiceDevice(data.message)
                    fSendDiscovery = true;
                }
            break;
            case 'setname' :
                this.choiceDevice.name = data.message;
            break;
            case 'setsuggested_area' :
                this.choiceDevice.suggested_area = data.message;
            break;
            case 'setclicvalid' :
                this.validateDevice();
            break;
            case 'setclicdelete' :
                if(this.choiceDevice.exists_choice ) {
                    this.devices.deleteDevice(this.choiceDevice.unique_id);
                }
            break;
            default:
                logger.error(`recept message from mqtt not handled by command ${JSON.stringify(data)}`)
        }
        this.lastStatus = this.choiceDevice;

        if(fSendDiscovery=== true) {
            this.publishAllDiscovery();
        }
        this.publishState();
    }
    private verifDevice() {
        let ano = '';
        if(logger.isDebug())logger.debug(`device en saisie ${JSON.stringify(this.choiceDevice)}`)
        this.choiceDevice.name =(this.choiceDevice.name??'').trim() 
        this.choiceDevice.suggested_area =(this.choiceDevice.suggested_area??'').trim() 
        if( ! this.choiceDevice.suggested_area) {
            ano = "suggested area is mandatory"
        }
        if( ! this.choiceDevice.name) {
            ano = "name is mandatory"
        }
        if(!this.choiceDevice.unique_id) {
            ano = 'Select a choice'
        }
        return ano;
    }
    private validateDevice() {
        let ano = this.verifDevice();
        
        if(ano ) {
            this.choiceDevice.message = ano;
        } else {
            let temp : SettingDevice = {
                name: this.choiceDevice.name,
                suggested_area: this.choiceDevice.suggested_area,
                transmit:true,
                except: this.deviceChoisi.except ,
                unique_id : this.deviceChoisi.unique_id
            }

            this.devices.setNewDevice(temp);
            this.clearDevice();
        }
    }
    publishAllDiscovery() {
        this.publishDiscoveryAll('newarexx',this.datanames,'Arexx','')
    }
}