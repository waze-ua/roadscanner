'use strict';

exports.timezone = 'Europe/Kiev';
exports.smtp = {
    login: "user",
    password: "password",
    host: "smtp.gmail.com",
    port: 465
};

/***
SCANNER
Scanner provides following configuration:
   interval: Time in seconds between scanning regions.
   regions: Array of regions to scan. Each region described with:
        name: Region's name. Used to identify region in cache and other
                places. Must be unique and english.
        url: URL to get user reports.
        checks: array of event checks
            match: Set of matching rules to select reports. Only events whitch
                    matching all rules will pass. Filter syntax described below.
            mail: Email message parameters. Message template has access to all fields of each report.

MATCHES
Matches are comparing alert fields with a "match" string that starts with one of operators:

    "=" equals
    "!" not equals
    ">" greater than (for numbers)
    "<" less than (for numbers)
    "~" contains
***/

exports.scanner = {
    locale: 'ua_UA',
    interval: 15,
    regions: [
        {
            name: "kamyanske_dnepr",
            url: "https://www.waze.com/row-rtserver/web/TGeoRSS?tk=community&format=JSON&left=34.368324279785156&right=34.763832092285156&bottom=48.44984193604505&top=48.58810557422965",
            checks: [
                {   // check for road holes
                    match: {
                        country: "=UP",
                        city: "=Кам'янське (Дніпропетровська)",
                        subtype: "=HAZARD_ON_ROAD_POT_HOLE",
                        nThumbsUp: ">-1"
                    },
                    mail: {
                        from: "info@waze.com.ua",
                        to: "info@lightservice.ua",
                        subject: "[Waze] Повідомлення про яму",
                        template: "road-hole-event.tpl",
                    }        
                }
            ],
        },
        {
            name: 'elizavetivka_petrinsky',
            url: 'https://www.waze.com/row-rtserver/web/TGeoRSS?tk=community&format=JSON&left=34.547882080078125&right=34.745635986328125&bottom=48.58728916938317&top=48.65628058850716',
            checks: [
                {   // check for broken traffic lights
                    match: {
                        country: "=UP",
                        city: "~Єлизаветівка",
                        subtype: "=HAZARD_ON_ROAD_TRAFFIC_LIGHT_FAULT",
                        nThumbsUp: ">-1"
                    },
                    mail: {
                        from: "info@waze.com.ua",
                        to: "info@holeservice.us",
                        subject: "[Waze] Повідомлення про світлофор",
                        template: "traffic-light-event.tpl",
                    }        
                }
            ]
        }
    ]
};
