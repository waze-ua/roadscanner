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

    dbg(`region: ${region.name}`);

    const h = isHttp ? http : https;
    h.get(region.url, (resp) => {
        dbg(` - response`);

        if (resp.statusCode !== 200) {
            console.error(`HTTP status: ${resp.statusCode}`);
            resp.resume();
            nextRegion(i);
            return;
        }

        let rawJSON = '';
        resp.on('data', (chunk) => rawJSON += chunk);
        resp.on('end', () => {
            dbg(' - data recieved');
            let mapdata;
            try {
                mapdata = JSON.parse(rawJSON);
            } catch (e) {
                console.error(`EXCEPTION: ${e.message}`);
            }

            if (mapdata.alerts === undefined) {
                dbg('- no alerts in reponse')
                nextRegion(i);
                return;
            }

            // Perform all region checks here
            region.checks.forEach((check, index) => {
                dbg(` - region check ${index}`);

                const events = mapdata.alerts.filter(filterByMatch, check).filter(filterByCache, region);

                dbg(` - - ${events.length} matched events`);

                events.forEach((event) => {
                    dbg(' - - processing event: ' + event.uuid);
                    
                    if(!uuidCache.hasOwnProperty(region.name))
                        uuidCache[region.name] = {};

                    uuidCache[region.name][event.uuid] = 1;
                    //sendMail(region.mail, event);
                });
            });

            nextRegion(i);
        });
    });
}

function nextRegion(i) {
    if (i == config.scanner.regions.length - 1) {
        dbg('all regions processed');
        dbg('uuid cache: ' + JSON.stringify(uuidCache));
        // Schedule next scan
        setTimeout(scan, config.scanner.interval * 1000);
    } else {
        scan(i + 1); // next region
    }
};

// Filters events which do match region checks.
// "this" points to "checks" entry from regions array
function filterByMatch(event) {
    const m = this.match;
    return Object.keys(m).every((key) => event.hasOwnProperty(key) && match(event[key], m[key]));
}

// Filter event which not in uuid cache
// `this` points on `region` entry
function filterByCache(event) {
    return !(uuidCache.hasOwnProperty(this.name) && uuidCache[this.name].hasOwnProperty(event.uuid));
}

// Check wether value passes match string
function match(value, rule) {
    if (rule.length < 2)
        throw (`Matching rule '${rule}' has incorrect format`);

    const m = rule.substring(1).trim();

    switch (rule.charAt(0)) {
        case '=': return value === m;
        case '!': return value !== m;
        case '>': return value > m;
        case '<': return value < m;
        case '~': return value.indexOf(m) !== -1;
        default: throw (`Matching rule '${rule}' has incorrect comaprison`);
    }

    return false;
}
