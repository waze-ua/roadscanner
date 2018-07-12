const fs = require('fs');
const dbg = require('debug')('mailer');
const mustache = require('mustache');
const nodemailer = require ('nodemailer');

const config = require('./../config');

let smtptransport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: true,
    auth: {
        user: config.smtp.login,
        pass: config.smtp.password
    }
});

exports.sendMail = (mail, event) => {
    let template = fs.readFileSync(__appdir + '/' + mail.template, {encoding: 'utf-8'});
    let message = mustache.render(template, event);

    if (typeof mail.to === 'string') {
        dbg(`sending to ${mail.to}`);
        smtptransport.sendMail({
            from: mail.from,
            to: mail.to,
            subject: mail.subject,
            html: message
        }, (e, i) => {
            if (e) {
                dbg(`mail delivery failed to ${mail.to}`);
                dbg(e);
                dbg(i);
            }
        });
        return;
    }

    // mail.to has several recipients, send message to each one
    mail.to.forEach(to => {
        dbg(`sending to ${to}`);
        smtptransport.sendMail({
            from: mail.from,
            to: to,
            subject: mail.subject,
            html: message
        }, (e, i) => {
            if (e) {
                dbg(`mail delivery failed to ${to}`);
                dbg(e);
                dbg(i);
            }
        });
    });
}