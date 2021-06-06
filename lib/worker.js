/*
 * This file is part of the mintunitish/Uptime Monitor.
 *
 * Copyright (c) 2018, Nitish Kumar <mintu.nitish@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 *
 * Created By: Nitish Kumar on 10/27/2018 11:28 PM
 */

const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const _logs =  require('./logs');
const util = require('util');
const debug = util.debuglog('workers');

let workers = {};

workers.init = () => {
    console.log('\x1b[33m%s\x1b[0m', 'Background Workers are Running!');
    workers.gatherAllChecks();
    workers.loop();
    workers.rotateLogs();
    workers.logsRotationLoop();
};

workers.gatherAllChecks = () => {
    _data.list('checks', (err, checks) => {
        if (!err && checks && checks.length > 0) {
            checks.forEach((check) => {
                _data.read('checks', check, (err, checkData) => {
                    if(!err && checkData) {
                        workers.validateCheckData(checkData);
                    }
                    else {
                        debug(`Error reading check : ${check}`);
                    }
                });
            });
        }
        else {
            debug('Can not find any checks to process!');
        }
    });
};

workers.rotateLogs = () => {
    _logs.list(false, (err, logs) => {
        if (!err && logs && logs.length > 0) {
            logs.forEach((log) => {
                let logId = log.replace('.log', '');
                let newFileId = logId+'_'+Date.now();
                _logs.compress(logId, newFileId, (err) => {
                    if (!err) {
                        _logs.truncate(logId, (err) => {
                            if (!err) {
                                debug('Successfully truncated log file');
                            }
                            else {
                                debug('Error in truncating log file', err);
                            }
                        });
                    }
                    else {
                        debug('Error compressing log file : ', err);
                    }
                });
            });
        }
        else {
            debug('Could not find logs to rotate!');
        }
    });
};

workers.log = (data, checkOutcome, state, alertWarrant, timeOfCheck) => {
    let logData = {
        'check' : data,
        'outcome' : checkOutcome,
        'state' : state,
        'alert' : alertWarrant,
        'time' : timeOfCheck
    };

    let logStr = JSON.stringify(logData);
    let logFileName = data.id;

    _logs.append(logFileName, logStr, (err) => {
        if (err) {
            debug('Error in creating logs in file!');
        }
    });

};

workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }, 1000 * 60);
};

workers.logsRotationLoop = () => {
    setInterval(() => {
        workers.rotateLogs();
    }, 1000 * 60 * 60 * 24);
};

workers.validateCheckData = (originalData) => {
    originalData = typeof(originalData) == 'object' && originalData != null ? originalData : {};
    originalData.id = typeof(originalData.id) == 'string' && originalData.id.trim().length == 20 ? originalData.id : false;
    originalData.userPhone = typeof(originalData.userPhone) == 'string' && originalData.userPhone.trim().length == 10 ? originalData.userPhone.trim() : false;
    originalData.protocol = typeof(originalData.protocol) == 'string' && ['http', 'https'].indexOf(originalData.protocol) > -1 ? originalData.protocol : false;
    originalData.url = typeof(originalData.url) == 'string' && originalData.url.trim().length > 0 ? originalData.url : false;
    originalData.method = typeof(originalData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalData.method) > -1 ? originalData.method : false;
    originalData.statusCode = typeof(originalData.statusCode) == 'object' && originalData.statusCode instanceof Array && originalData.statusCode.length > 0 ? originalData.statusCode : false;
    originalData.timeoutSec =  typeof(originalData.timeoutSec) == 'number' && originalData.timeoutSec % 1 === 0 && originalData.timeoutSec >= 1 && originalData.timeoutSec <= 5 ? originalData.timeoutSec : false;

    originalData.state = typeof(originalData.state) == 'string' && ['up', 'down'].indexOf(originalData.state) > -1 ? originalData.state : 'down';
    originalData.lastChecked =  typeof(originalData.lastChecked) == 'number' && originalData.lastChecked > 0 ? originalData.lastChecked : false;

    if (originalData.id && originalData.userPhone && originalData.protocol && originalData.url && originalData.method && originalData.statusCode && originalData.timeoutSec) {
        workers.performCheck(originalData);
    }
    else {
        debug('A Check have malformed data : ' + originalData.id);
    }
};

workers.performCheck = (data) => {
    let checkOutcome = {
        'error' : false,
        'responseCode' : false
    };

    let outcomeSent = false;

    let parsedUrl = url.parse(data.protocol+'://'+data.url, true);
    let hostname = parsedUrl.hostname;
    let path = parsedUrl.path;

    let requestDetails = {
        'protocol' : data.protocol+':',
        'hostname' : hostname,
        'method' : data.method.toUpperCase(),
        'path' : path,
        'timeout' : data.timeoutSec * 1000
    };

    let _moduleToUse = data.protocol == 'http' ? http : https;
    let req = _moduleToUse.request(requestDetails, (res) => {
        let status = res.statusCode;
        checkOutcome.responseCode = status;

        if (!outcomeSent) {
            workers.processCheckOutcome(data, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('error', (err) => {
        checkOutcome.error = {
            'error' : true,
            'value' : err
        };
        if (!outcomeSent) {
            workers.processCheckOutcome(data, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('timeout', (err) => {
        checkOutcome.error = {
            'error' : true,
            'value' : 'timeout'
        };
        if (!outcomeSent) {
            workers.processCheckOutcome(data, checkOutcome);
            outcomeSent = true;
        }
    });

    req.end();
};

workers.processCheckOutcome = (data, checkOutCome) => {
    let state = !checkOutCome.error && checkOutCome.responseCode && data.statusCode.indexOf(checkOutCome.responseCode) > -1 ? 'up' : 'down';
    let alertWarrant = !!(data.lastChecked && data.state !== state);
    let timeOfCheck = Date.now();

    workers.log(data, checkOutCome, state, alertWarrant, timeOfCheck);

    let newData = data;
    newData.state = state;
    newData.lastChecked = timeOfCheck;

    _data.update('checks', newData.id, newData, (err) => {
        if (!err) {
            if (alertWarrant) {
                workers.alertUserForStatusChange(newData);
            }
            else {
                debug('Check outcome not changed. No alert warrant issued!');
            }
        }
        else {
            debug('Error in updating checks!');
        }
    });
};

workers.alertUserForStatusChange = (data) => {
    let msg = 'Alert: Your check for ' + data.method.toUpperCase() + ' ' + data.protocol + '://' + data.url + ' is currently ' + data.state;
    helpers.sendSMS(data.userPhone, msg, (err) => {
        if (!err) {
            debug("User has been alerted according to warrant!", msg);
        }
        else {
            debug("Unable to resolve issued warrant!");
        }
    });
};

module.exports =  workers;