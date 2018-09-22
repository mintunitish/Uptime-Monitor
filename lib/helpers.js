const config = require('./../config');
const crypto = require('crypto');

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

module.exports = helpers;