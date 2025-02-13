/* eslint-disable valid-jsdoc */
/**
 * module de gestion de l'accès a arexx par ethernet
 *
 */
// TODO la gestion de la date est a revoir enfonction de la date transmise
// et l'evenement ne doit etre traité que si la date transmise date de moins d'une heure

import http from 'http';
import { Logger } from './logger';
import { evenements, KONST } from './controller';
import { SettingArexx, SettingResult } from './settings';


const logger = new Logger(__filename)

export class FromHttp {
  periodique: any;  
  anom = 0;
  confarexx: SettingArexx;
  address: string;
  port: string;

  constructor(confarexx: SettingArexx) {
    this.confarexx = confarexx; 
    this.address =  confarexx.address;
    this.port    = ''+(confarexx.port_dist ?? 80);
  }
  /**
   * traitement de données recues au format html suite au wget
   * transforme les données html en un tableau de capteurs recus
   * pour chaque appel de la fonction d'émission du capteur
   *
   * si aucun capteur n'est détecté 5 fois de suite
   * envoi du signal que le module n'est plus actif
   *
   *
   * @param response objet contenant les données du bs1000
   *
   * @returns
   */
  traitReponse(response: any) {
    let body = '';
    response.on('data', (d: string) => {
      // logger.trace('traitReponse',d.toString());
      body += d;
    });
    response
        .on('end', () => {
          // var now = Date.now();
          let result: { [s: string]: SettingResult } = {};
          // if(logger.isdebug())if(logger.isDebug())logger.debug("body="+ body);
          if (body !== '') {
            while (body.indexOf('<tr>')>-1) {
              body = body
                  .replace('<tr>', '')
                  .replace('</tr>', ',')
                  .replace('<td>', '"')
                  .replace('</td>', '": {')
                  .replace('<td t="', '"valtime" :')
                  .replace('"></td>', ',')
                  .replace('<td>', '"value" :')
                  .replace('</td>', ',')
                  .replace('<td>', '"unit" :"')
                  .replace('</td>', '",')
                  .replace('<td title="', '"dbm" :')
                  .replace('dBm">', ',')
                  .replace('<div class="rssi" style="width:', '"rssi" :')
                  .replace('%;"></div></td>', '}')
                  .replace('&#176;', '°');
            }
            body= '{'+body+'}';
            body= body.replace(',}', '}');
            result  = JSON.parse(body) || {};
          }
          if ( Object.keys(result).length === 0 ) {
            this.anom += 1;
            if (this.anom > 5) {
              evenements.emit(KONST.EVENT_ANO, 
                  `5 anos: rien dans le corps du message  bs1000`);
              return;
            }
          }
          let num;
          for (num of Object.keys(result)) {
            result[num].date = new Date((result[num].valtime+946684800)*1000);
            result[num].unique_id = 'Arexx-'+num;
            //		if(logger.isDebug())logger.debug("body de ",num,result[num])
            evenements.emit(KONST.EVENT_RECEPTION, result[num]);
            this.anom = 0;
          }
        });
  }
  /**
   * recuperation par get des données du serveur html arexx
   * les données html sont transmises pour transformation et exploitation
   * mais si pas de reponse 5 fois de suite
   * 	le module est stoppé et
   * 	envoi du signal que le module n'est pas actif
   *
   * @returns
   */
  getArex() {
    // logger.warn("lecture temperatures", address, port);
    // eslint-disable-next-line max-len
    return http.get({host: this.address,	port: this.port, path: '/sdata_table.txt'}, 
        (response: any)=>{  this.traitReponse(response)})
        .on('error', (err) => {
          this.anom++;
          logger.warn(`this.anomalie sur le get , ${this.anom}, ${err}`);
          if (this.anom > 3) {
            // eslint-disable-next-line max-len
            evenements.emit(KONST.EVENT_ANO, `3 ano: on get ${this.address}:${this.port} to access http bs1000`);
          }
        });
  }

  /**
   * démarrage du module
   * verification que l'adresse du serveur arexx est servi dans les propriétés
   * arexx.temp.address arexx.temp.port
   * @returns
   */
  async start() {
    logger.info('start fromhttp');
    this.anom =0;
    this.periodique = setInterval(() => {
      this.getArex();
    }, (this.confarexx.scan_interval_seconds || 50)*1000);
    this.getArex();
  }

/**
 * arret du module
 * @returns
 */
  stop() {
    if (this.periodique) {
      clearInterval(this.periodique);
      this.periodique=undefined;
    }
  }
}

