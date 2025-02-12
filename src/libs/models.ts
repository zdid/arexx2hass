export interface KeyValue {[s: string]: any}


export class ArexxInfo {
    unique_id: any;
    receiverType:     string = '';
    discovery: boolean = false;
    version? : string;
    logLevel?: string;
    commands: string[] = ["setloglevel"]
}

export class DeviceEntity {
  public manufacturer: string = "AREXX";
  public via_device: string = 'arexx_bridge';

  constructor(
    public identifiers: string[] = ["Arexx"],
    public model: string = 'Arexx',
    public name:  string = 'Arexx',
    public suggested_area = ''
  ) {}
  
}

export class DeviceBridge {
  public model: string = 'Bridge';
  public name:  string = 'Arexx2Hass Bridge';
  public manufacturer: string = 'Arexx2Hass';

  constructor(
    public identifiers: string[] = [],
  ) {}
  
}
