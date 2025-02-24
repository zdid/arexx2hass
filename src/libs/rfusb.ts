/**
* gere le fichier rf_usb_http_rpi_0_6
* TODO faut voir si il faut positionner 
* faut il changer la valeur dans le fichier rulefile.txt de localhost 
* et faut il le positionner a coté de l'exécutable
**/


import { ChildProcessWithoutNullStreams, exec, spawn } from "child_process";
import path from "path";
import {Logger} from "./logger";
import { SettingArexx } from "./settings";
const logger = new Logger(__filename)
const log = logger;

export class RfUsb {
  pathRfusb = path.join(__dirname,"..","rf_usb_http_rpi_0_6","rf_usb_http.elf");
  pathcwd = path.join(__dirname,"..","rf_usb_http_rpi_0_6");
  rulesfile = path.join(__dirname,"..","rf_usb_http_rpi_0_6","rulefile.txt");
  command: ChildProcessWithoutNullStreams | undefined;
  constructor(confarexx: SettingArexx) {
    exec("chmod +x "+this.pathRfusb)
  }
  runRfusb() {
    this.command = spawn(this.pathRfusb,[ "-v", this.rulesfile],{cwd:this.pathcwd})
    this.command.stderr.on('data', (data) => {
      log.error(`stderr: ${data}`);
    });
    this.command.stdout.on('data', (data) => {
      log.debug(`stdout: ${data}`);
    });

    this.command.on('close', (code) => {
      log.info(`Rf_usb close, code ${code}`);
      this.command = undefined;
    });
    this.command.on('error', (err) => {
        log.error(`'Failed to start rf_usb.', ${err}`);
      });
  }
  start() {
    log.info('rfusb started')
    this.runRfusb();
  }
  stop(){
    log.info('rf_usb stop required')
    if(this.command) {
      this.command.kill('SIGKILL');
    }
  }
}


