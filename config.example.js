'use strict';

exports.datetime = {
    timezone: 'Europe/Kiev'
};

exports.scanner = {
        url: "https://www.waze.com/row-rtserver/web/TGeoRSS?tk=community&atf=SOS&types=alerts&format=JSON&ma=600&mj=100&mu=100&left=23.910453&right=39.880017&bottom=46.053247&top=51.477441&_=1510071267374",
        interval: 5000, // waze polling interval
        expire: 86400,  // seconds to expire reported uuids
        sostypes:{
            "SOS_NO_FUEL": "нет топлива",
            "SOS_FLAT_TIRE": "спущено колесо",
            "SOS_BATTERY_ISSUE": "разрядился аккумулятор",
            "SOS_MEDICAL_HELP": "медицинская помощь",
            "SOS_OTHER": "другое"
        }
};

exports.mailer = {
        smtp: {
            login: "user",
            password: "password",
            host: "smtp.gmail.com",
            port: 465
        },
        message: {
            from: "example@gmail.com",
            to: "sos@sos-service.com",
            subject: "Waze SOS",
            template: "message.tpl",
        }
};
