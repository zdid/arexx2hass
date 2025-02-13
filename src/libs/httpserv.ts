
/**
 * Module dependencies.
 */

import express from 'express'
import http    from 'http'
import path    from 'path'
import { Logger } from './logger';
import { Request, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { evenements, KONST } from './controller';
import { SettingArexx, SettingResult } from './settings';
const logger = new Logger(__filename)

const log = logger;
const diff1970to2000 = 946684800;

export class HttpServ {
   app: any; 
   lastreceive: number;
   confarexx: SettingArexx;
   constructor(confarexx: SettingArexx) {
      this.confarexx = confarexx;
      this.app = express();
      this.lastreceive = Date.now();
      this.app.use(express.urlencoded({ extended: false }));
      this.app.use(express.static(path.join(__dirname, 'public')));
   }

   traitReceptionTemp(req:any ) {
    log.debug(`"params", ${req.body}`)
    let typecapt = req.body.type
    let value = parseFloat(req.body.v).toFixed(1);
    let dbm = parseFloat(req.body.rssi);
    let valtime = req.body.time
    let date = new Date((parseFloat(req.body.time)+diff1970to2000)*1000);
    let id = req.body.id
    let unit = "C"
    if(typecapt==='3') {
      id+='rh';
      unit = "%RH"
    }

    let parms: SettingResult = {
           typecapt : typecapt,
           unique_id : 'Arexx-'+id,
           value : value,
           date : date,
           dbm : dbm,
           unit: unit,
           valtime : valtime
   };
   log.debug(`'traitReceptionTemp', ${parms}`);
   return parms;
   }
   traitAll(req: Request<{}, any, any, ParsedQs, Record<string, any>>,res: Response<any, Record<string, any>, number>) {
      this.lastreceive=Date.now()
      let parms: any = this.traitReceptionTemp(req);
      log.debug(`"envoi app / de reception ",${parms}`)
      parms.date = 
      setImmediate(()=>{evenements.emit(KONST.EVENT_RECEPTION,parms)})
      res.send("ok");
   }


//type=1&id=8962&time=501092328&v=20%2E3&rssi=-101&missing=501092328&x=
   async start() {
      this.app.set('port',  this.confarexx.httpserv_port || 49161);
      http.createServer(this.app).listen(this.app.get('port'), () => {
         log.info('Express server listening on port ' + this.app.get('port'));
      });
      this.app.all('/', (req: any, res: any) => {
         this.traitAll(req,res);
      });
      this.app.all('/rules', (req: any, res: any) => {
         this.traitAll(req,res)
      });

   }

   stop() {
      log.info('Express server stop required ');
   }
}
