const config = require('./../config');
const crypto = require('crypto');
const queryString = require('querystring');
const https = require('https');

let helpers = {};

helpers.hash = (str) => {
    if (typeof(str) == 'string' && str.length > 0) {
        return crypto.createHmac('sha256', config.secret).update(str).digest('hex');
    }
    else {
        return false;
    }
};

helpers.parseJsonToObject = (str) => {
    try{
        return JSON.parse(str);
    }
    catch(e) {
        return {};
    }
};

helpers.createRandomString = (strLength) => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength){
        let possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let str = '';

        for (let i = 1; i <= strLength; i++) {
            let randomChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
            str += randomChar;
        }

        return str;
    }
    else {
        return false;
    }
};

helpers.sendSMS = (phone, msg, callback) => {
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

    if(phone &&  msg) {
        let payload = {
            'From' : config.twilio.fromPhone,
            'To' : `+91${phone}`, // Currently only for India
            'Body' : msg
        };
        let strPayload =  queryString.stringify(payload);

        let requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method' : 'POST',
            'path' : `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
            'auth' : config.twilio.accountSid + ':' + config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(strPayload)
            }
        };

        let req = https.request(requestDetails, (res) => {
            let status = res.statusCode;
            if(status == 200 || status == 201) {
                callback(false);
            }
            else {
                callback('Status code returned is : ' + status);
            }
        });

        req.on('error', (e) => {
            callback(e);
        });

        req.write(strPayload);

        req.end();
    }
    else {
        callback('Parameters missing or Invalid!');
    }
}

module.exports = helpers;