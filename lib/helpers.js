const config = require('./../config');
const crypto = require('crypto');
const queryString = require('querystring');
const https = require('https');
const path = require('path');
const fs = require('fs');

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
};

helpers.getTemplate = (templateName, data, callback) => {
    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
    data = typeof(data) == 'object' && data != null ? data : {};
    if (templateName) {
        let templatesDir = path.join(__dirname, '/../templates/');
        fs.readFile(templatesDir+templateName+'.html', 'utf8', (err, str) => {
            if (!err && str && str.length > 0) {
                let finalStr = helpers.interpolate(str, data);
                callback(false, finalStr);
            }
            else {
                callback('No Templates can be Found!');
            }
        });
    }
    else {
        callback('A valid template name was not specified!');
    }
};

helpers.addUniversalTemplates = (str, data, callback) => {
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data != null ? data : {};
    helpers.getTemplate('_header', data, (err, headerStr) => {
        if (!err && headerStr) {
            helpers.getTemplate('_footer', data, (err, footerStr) => {
                if (!err && footerStr) {
                    let fullString = headerStr + str + footerStr;
                    callback(false, fullString);
                }
                else {
                    callback('Footer Template Missing');
                }
            });
        }
        else {
            callback('Header Template Missing!');
        }
    });
};

helpers.interpolate = (str, data) => {
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data != null ? data : {};

    for(let keyName in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(keyName)) {
            data['global.'+keyName] =config.templateGlobals[keyName];
        }
    }

    for (let key in data) {
        if (data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
            let replace = data[key];
            let find = `{${key}}`;
            str = str.replace(find, replace);
        }
    }

    return str;
};

helpers.getStaticAsset = (asset, callback) => {
    asset = typeof(asset) == 'string' && asset.length > 0 ? asset : false;
    if (asset) {
        let publicDir = path.join(__dirname, '/../public/');
        fs.readFile(publicDir+asset, (err, data) => {
            if (!err && data) {
                callback(false, data);
            }
            else {
                callback('No Asset file found');
            }
        });
    }
    else {
        callback('A valid asset was not specified!');
    }
};

module.exports = helpers;