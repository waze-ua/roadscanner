'use strict';

const dbg = require('debug')('scanner');
const https = require('https');
const http = require('http');
const luxon = require('luxon');

const config = require('./../config');
//import { sendMail } from './mailer';

// Configure default time zone
luxon.Settings.defaultZoneName = config.timezone;

let uuidCache = {};
scan();

function scan(i) {
    i = i || 0;

    const region = config.scanner.regions[i];
    const isHttp = region.url.startsWith('http:');
    const isHttps = region.url.startsWith('https:');

    if (!isHttp && !isHttps)
        throw { name: 'Wrong protocol', message: 'Protocol must be http or https' };

    dbg(`scanning region ${region.name}`);

    const h = isHttp ? http : https;
    h.get(region.url, (resp) => {
        dbg(`got response for ${region.name}`);

        if (resp.statusCode !== 200) {
            console.error(`HTTP status: ${resp.statusCode}`);
            resp.resume();
            nextRegion(i);
            return;
        }

        let rawJSON = '';
        resp.on('data', (chunk) => rawJSON += chunk);
        resp.on('end', () => {
            dbg('got all data')
            try {
                const mapdata = JSON.parse(rawJSON);

                if (mapdata.alerts === undefined)
                    nextRegion(i);

                const events = mapdata.alerts.filter(eventFilter, region);

                for (event in events) {
                    dbg('processing event: ' + event.toString());
                    //sendMail(region.mail, event);
                    uuidCache[region.name][event.uuid] = 1;
                }
            } catch (e) {
                console.error(`EXCEPTION: ${e.message}`);
            }

            nextRegion(i);
        });
    });
}

function nextRegion(i) {
    if (i == config.scanner.regions.length) {
        dbg('all regions processed');

        // Schedule next scan
        setTimeout(scan, config.scanner.interval * 1000);
    } else {
        scan(i + 1); // next region
    }
};

// Filters events which not pass creterias
// "this" is entry from regions array
function eventFilter(event) {
    dbg(`filtering event: ` + JSON.stringify(event));
    const f = this.filters;

    Object.keys(f).forEach((key) => {
        if (!event.hasOwnProperty(key) || !checkMatch(event[key], f[key]))
            return false;
    });

    // Last check that uuid not in cache, which means we didn't processed it earlier
    return !(uuidCache.hasOwnProperty(this.name) && uuidCache[this.name].hasOwnProperty(event.uuid));
}

// Check wether value passes match string
function checkMatch(value, match) {
    if (match.length < 2)
        throw (`Matching rule '${match}' has incorrect format`);

    const m = match.substring(1).trim();

    switch (match.charAt(0)) {
        case '=': return value === m;
        case '!': return value !== m;
        case '>': return value > m;
        case '<': return value < m;
        case '~': return value.indexOf(m) !== -1;
        default: throw (`Matching rule '${match}' has incorrect comaprison`);
    }

    return false;
}
