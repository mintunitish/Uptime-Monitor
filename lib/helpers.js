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

module.exports = helpers;