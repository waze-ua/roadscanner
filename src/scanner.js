'use strict';

const dbg = require('debug')('scanner');
const https = require('https');
const http = require('http');
const luxon = require('luxon');

const uniqstore = require('./uniqstore');
const config = require('./../config');
const mailer = require('./mailer');

// Configure default time zone
luxon.Settings.defaultZoneName = config.timezone;

// Here we store processed uuids by region
const uuids = {};

scan();

function scan(i) {
    i = i || 0;

    const region = config.scanner.regions[i];
    const regname = region.name;
    const isHttp = region.url.startsWith('http:');
    const isHttps = region.url.startsWith('https:');

    if (!isHttp && !isHttps)
        throw { name: 'Wrong protocol', message: 'Protocol must be http or https' };

    dbg(`region: ${regname}`);

    if (uuids[regname] === undefined) {
        uuids[regname] = uniqstore.create({file: __appdir + '/' + regname + '.cache'});
        uuids[regname].load();
    }

    const h = isHttp ? http : https;
    h.get(region.url, (resp) => {
        dbg(` - waze responded`);

        if (resp.statusCode !== 200) {
            console.error(`HTTP status: ${resp.statusCode}`);
            resp.resume();
            nextRegion(i);
            return;
        }

        let rawJSON = '';
        resp.on('data', (chunk) => rawJSON += chunk);
        resp.on('end', () => {
            dbg(' - waze data recieved');
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

            // Go through all region checks
            region.checks.forEach((check, index) => {
                dbg(' - region check ' + index);

                // Get only events that do match region's check and not cached
                const events = mapdata.alerts.reduce( (acc, ev) => {
                        // Check if event matches conditions
                        if (Object.keys(check.match).every(k => ev[k] !== undefined && match(ev[k], check.match[k]))) {
                            ev.uuid = ev.uuid.replace(/-/g, ''); // we use uuid without dashes
                            // Check that event not in cache
                            if (uuids[regname].miss(ev.uuid)) {
                                acc.push(ev);
                            }
                        }
                        return acc;
                    }, []);

                dbg(` - - ${events.length} matched events`);

                // Now email new events and put them in cache
                events.forEach((event) => {
                    uuids[regname].put(event.uuid);
                    event.datetime = luxon.DateTime.fromMillis(event.pubMillis).toLocaleString(luxon.DateTime.DATETIME_MED); // add date&time for message
                    mailer.sendMail(check.mail, event);
                });
            });

            uuids[regname].save();
            nextRegion(i);
        });
    });
}

function nextRegion(i) {
    if (i == config.scanner.regions.length - 1) {
        dbg('all regions processed');

        // Schedule next scan
        setTimeout(scan, config.scanner.interval * 1000);
    } else {
        scan(i + 1); // next region
    }
};

// Filters events that don't match region checks.
// Function's context is "check" entry from regions.
function filterByMatch(event) {
    return ;
}

// Check whether value passes match string
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

