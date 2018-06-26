'use strict';

exports.timezone = 'Europe/Kiev';

/***
SCNNER
Scanner provides folloving configuration:
   interval: Time in seconds between scanning regions.
   regions: Array of regions to scan. Each region described with:
        name: Region's name. Used to identify region in cache and other
                places. Must be unique and english.
        url: URL to get user reports.
        checks: array of event checks
            match: Set of matching rules to select reports. Only events whitch
                    matching all rules will pass. Filter syntax described below.
            mail: Email message parameters. Message template has access to all fields of each report.

FILTERS
Filters are pairs "name" and "match" where match starts with comparison operator and value.

Operators:
    "=" equals
    "!" not equals
    ">" greater than (for numbers)
    "<" less than (for numbers)
    "~" contains
***/

exports.scanner = {
    interval: 15,
    regions: [
        {
            name: "dnepr",
            url: "https://www.waze.com/row-rtserver/web/TGeoRSS?tk=community&format=JSON&left=34.67769241333008&right=35.38246536254883&bottom=48.27451331301162&top=48.64715978672313",
            checks: [
                {   // check for broken traffic lights
                    match: {
                        country: "=UP",
                        city: "=Дніпро",
                        subtype: "=HAZARD_ON_ROAD_TRAFFIC_LIGHT_FAULT",
                        nThumbsUp: ">-1"
                    },
                    mail: {
                        from: "example@gmail.com",
                        to: "info@lightservice.ua",
                        subject: "Waze users traffic light report",
                        template: "message.tpl",
                    }        
                },
                {   // check for road holes
                    match: {
                        country: "=UP",
                        city: "=Дніпро",
                        subtype: "=HAZARD_ON_ROAD_POT_HOLE",
                        nThumbsUp: ">-1"
                    },
                    mail: {
                        from: "example@gmail.com",
                        to: "info@holeservice.us",
                        subject: "Waze users road hole report",
                        template: "message.tpl",
                    }        
                }
            ],
        }
    ]
};

exports.mailer = {
    smtp: {
        login: "user",
        password: "password",
        host: "smtp.gmail.com",
        port: 465
    }
};
