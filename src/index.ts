'use strict';

import { Controller } from './libs/controller';

let controller: Controller| undefined;
let stopping = false;
let restart = false;

function exit(code: number, frestart: boolean = false) {
  if(restart) {
    return;
  }
  restart = frestart;
  if (!restart) {
      process.exit(code);
  } 
  if(restart) {
    controller?.stop();
    controller = undefined;
    setTimeout(start, 2000);
  }
}

async function start() {
  restart = false;
  controller = new Controller(exit)
  await controller.start()
}


function handleQuit() {
  if (!stopping && controller) {
      stopping = true;
      controller.stop(false);
  }
}
export function dev() {
  console.log('Developpement')
}
process.on('SIGINT', handleQuit);
process.on('SIGTERM', handleQuit);
start();
