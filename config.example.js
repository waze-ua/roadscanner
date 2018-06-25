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
        filters: Set of filters to select reports. Only events that are matching
                all filters will pass. Filter syntax described below.
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
    interval: 60,
    regions: [
        {
            name: "dnepr",
            url: "https://www.waze.com/row-rtserver/web/TGeoRSS?tk=community&format=JSON&left=34.67769241333008&right=35.38246536254883&bottom=48.27451331301162&top=48.64715978672313",
            filters: {
                country: "=UP",
                city: "=Днепр",
                subtype: "=HAZARD_ON_ROAD_TRAFFIC_LIGHT_FAULT",
                nThumbsUp: ">-1"
            },
            mail: {
                from: "example@gmail.com",
                to: "sos@sos-service.com",
                subject: "Waze users report",
                template: "message.tpl",
            }
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
