import { readFileSync } from 'fs';
const dbg = require('debug')('mailer');
import { render } from 'mustache';
import { createTransport } from 'nodemailer';

import { mailer } from './../config';

let smtptransport = createTransport({
    host: mailer.smtp.host,
    port: mailer.smtp.port,
    secure: true,
    auth: {
        user: mailer.smtp.login,
        pass: mailer.smtp.password
    }
});

export function sendMail(mail, event) {
    dbg(`sending mail alert`);
    let template = readFileSync(__dirname + '/' + mail.template, {encoding: 'utf-8'});
    let message = render(template, event);
    dbg(message);

    smtptransport.sendMail({
        from: mail.from,
        to: mail.to,
        subject: mail.subject,
        html: message
    }, (e, i) => {
        if (e) {
            dbg('mail delivery failed');
            dbg(e);
            dbg(i);
        }
    });
}