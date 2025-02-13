import { KONST } from "./controller";
import { getFileFromConfig } from "./utils";




export class Components {
    static components : any;
    constructor() {
        Components.components = getFileFromConfig(KONST.COMPONENTS_YAML);
    }
    
    static get(typeDevice: string, componentName: string) {
        let comp: any;
         if(Components.components[typeDevice]) {
            if(Components.components[typeDevice][componentName]) {
               comp =  Components.components[typeDevice][componentName]
            } else if(Components.components[typeDevice]["__default"]) {
               comp = Components.components[typeDevice]["__default"]
            }
            if(comp) {
                return JSON.parse(JSON.stringify(comp))
            }
        }
        return undefined;
    }
}
