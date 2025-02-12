import { AbstractDevice } from "./abstractdevice";
import Mqtt from "./Mqtt";
import { SettingDevice, SettingHass } from "./settings";

export class ArexxDevice extends AbstractDevice {
    
    lastValues: any;
    datanames: string[];
    device: SettingDevice;
    
    constructor( mqtt : Mqtt, confHass: SettingHass,device: SettingDevice) {
        super(mqtt, confHass, device.unique_id, device.name);
        this.device = device;
        this.datanames=['date','dbm'];
        if(device.except.humidity) {
            this.datanames.push('temperature');
        } else {
            this.datanames.push('humidity');
        }     
    }
    publishAllDiscovery(): void {
         this.publishDiscoveryAll('device', this.datanames,'Arexx',this.device.suggested_area)
    }

}