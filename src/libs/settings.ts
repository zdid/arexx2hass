export interface SettingDevice {
    name: string;
    unique_id: string;
    except:  { 
        humidity : boolean ; 
        temperature : boolean;
    }
    suggested_area: string | undefined;
    transmit: boolean
}
export interface SettingResult {
        typecapt : string,
        unique_id : string,
        value : string,
        date : number | Date,
        dbm : number,
        unit: string,
        valtime : number
}

export interface SettingHass{
    discovery: boolean,
    discovery_permanent: boolean
    discovery_bridge_unique_id: string,
    base_topic: string,
    topics:  { [key:string] : string } ;
    enable_discovery: boolean;
}

export interface SettingArexx {
  address: string;
  port_dist: number
  httpserv_port: number
  isusb: boolean
  scan_interval_seconds?: number
}

export interface SettingMqtt{
    base_topic: string,
    include_device_information: boolean,
    retain: boolean
    qos: 0 | 1 | 2,
    version?: 3 | 4 | 5,
    username?: string,
    password?: string,
    port?: string,
    server: string,
    key?: string,
    ca?: string,
    cert?: string,
    keepalive?: number,
    client_id?: string,
    reject_unauthorized?: boolean,
    format_json?: boolean
}
export interface SettingConfig {
    loglevel: 'warn' | 'debug' | 'info' | 'error';
    homeassistant: SettingHass;
    mqtt : SettingMqtt;
    arexx: SettingArexx;
}
export function applyEnvironmentVariables(settings: SettingConfig): void {
    const mqttEnvVars = [
        {env: "AREXX2HASS_MQTT_SERVER", props: "server"},
        {env: "AREXX2HASS_MQTT_USERNAME", props: "username"},
        {env: "AREXX2HASS_MQTT_PASSWORD", props: "password"},
        {env: "AREXX2HASS_MQTT_CLIENT_ID", props: "client_id"}];

        

    mqttEnvVars.forEach( envEntry => {
        if (process.env[envEntry.env]) {
            if(settings.mqtt !== undefined){
                // @ts-ignore
                settings.mqtt[envEntry.props] = process.env[envEntry.env];
            }
        }
    });

    
}