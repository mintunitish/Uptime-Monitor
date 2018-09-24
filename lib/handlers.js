const _data = require('./data');
const helpers = require('./helpers');
const config = require('./../config');

const handlers = {};

let phone;
let firstName;
let lastName;
let password;

let id;

/*HTML Handlers*/
handlers.index = (data, callback) => {
    if(data.method == 'get') {
        let templateData = {
            'head.title' : 'UpTime Monitoring',
            'head.description' : 'Free uptime monitoring for HTTP/HTTPS with alerts.',
            'body.class' : 'index'
        };
        helpers.getTemplate('index', templateData, (err, str) => {
            if (!err && str) {
                helpers.addUniversalTemplates(str, templateData, (err, fullStr) => {
                    if (!err && fullStr) {
                        callback(200, fullStr, 'html');
                    }
                    else {
                        callback(500, undefined, 'html');
                    }
                });
            }
            else {
                callback(500, undefined, 'html');
            }
        });
    }
    else {
        callback(405, undefined, 'html');
    }
};

handlers.favicon = (data, callback) => {
    if (data.method == 'get') {
        helpers.getStaticAsset('favicon.png', (err, data) => {
            if (!err && data) {
                callback(200, data, 'favicon');
            }
            else {
                callback(500);
            }
        });
    }
    else {
        callback(405);
    }
};

handlers.public = (data, callback) => {
    if (data.method == 'get') {
        let assetName = data.trimmedPath.replace('public/', '').trim();
        if (assetName.length > 0) {
            helpers.getStaticAsset(assetName, (err, data) => {
                if (!err && data) {
                    let contentType = 'plain';
                    if (assetName.indexOf('.css') > -1) {
                        contentType = 'css';
                    }
                    if (assetName.indexOf('.png') > -1) {
                        contentType = 'png';
                    }
                    if (assetName.indexOf('.jpg') > -1) {
                        contentType = 'jpg';
                    }
                    if (assetName.indexOf('.ico') > -1) {
                        contentType = 'favicon';
                    }
                    if (assetName.indexOf('.js') > -1) {
                        contentType = 'js';
                    }
                    callback(200, data, contentType);
                }
                else {
                    callback(404);
                }
            });
        }
        else {
            callback(404);
        }
    }
    else {
        callback(405);
    }
};

/*JSON API Handlers*/
handlers.ping = (data, callback) => {
    callback(200);
};

handlers.users = (data, callback) => {
    const methods = ['post', 'get', 'put', 'delete'];
    if (methods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    }
    else {
        callback(405);
    }
};

handlers._users = {};

handlers._users.post = (data, callback) => {
    firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    let tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        _data.read('users', phone, (err, data) => {
            if (err) {
                let hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    let userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'password': hashedPassword,
                        'tosAgreement': tosAgreement
                    };

                    _data.create('users', phone, userObject, (err) => {
                        if (!err) {
                            callback(200);
                        }
                        else {
                            console.log(err);
                            callback(500, {
                                'Error': 'Could not create the new user!'
                            });
                        }
                    });
                }
                else {
                    callback('500', {
                        'Error': 'Couldn\'t hash the password!'
                    });
                }
            }
            else {
                callback('400', {
                    'Error': 'A user with that phone number already exists!'
                });
            }
        })
    }
    else {
        callback('400', {
            'Error': 'Missing Required Payloads!'
        });
    }
};

handlers._users.get = (data, callback) => {
    phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, (isValid) => {
            if (isValid) {
                _data.read('users', phone, (err, userData) => {
                    if (!err && userData) {
                        delete userData.password;
                        callback(200, userData);
                    }
                    else {
                        callback(404);
                    }
                });
            }
            else {
                callback(403, {
                    'Error' : 'Unauthenticated'
                });
            }
        });
    }
    else {
        callback(400, {
            'Error': 'Missing Required Payloads!'
        });
    }
};

handlers._users.put = (data, callback) => {
    phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone) {
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, (isValid) => {
            if (isValid) {
                if (firstName || lastName || password) {
                    _data.read('users', phone, (err, userData) => {
                        if (!err && userData) {
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.password = helpers.hash(password);
                            }

                            _data.update('users', phone, userData, (err) => {
                                if (!err) {
                                    callback(200);
                                }
                                else {
                                    callback(500, {
                                        'Error': 'Could\'t update the user!'
                                    });
                                }
                            });
                        }
                        else {
                            callback(404);
                        }
                    });
                }
                else {
                    callback(400, {
                        'Errors': 'Missing Fields to update'
                    });
                }
            }
            else {
                callback(403, {
                    'Error' : 'Unauthenticated'
                });
            }
        });
    }
    else {
        callback(400, {
            'Error': 'Missing Required Field'
        });
    }
};

handlers._users.delete = (data, callback) => {
    phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, (isValid) => {
            if (isValid) {
                _data.read('users', phone, (err, userData) => {
                    if (!err && userData) {
                        _data.delete('users', phone, (err) => {
                            if (!err) {
                                let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                let checksToDelete = userChecks.length;

                                if(checksToDelete > 0) {
                                    let checksDeleted = 0;
                                    let deletionErrors = false;
                                    userChecks.forEach((checkId) => {
                                        _data.delete('checks', checkId, (err) => {
                                            if(err) {
                                                deletionErrors = true;
                                            }
                                            checksDeleted++;
                                            if(checksDeleted == checksToDelete) {
                                                if(!deletionErrors) {
                                                    callback(200);
                                                }
                                                else {
                                                    callback(500, {
                                                        'Error' : 'Errors encountered while deleting checks associated with the user! All checks associated with this user may not be deleted from the system.'
                                                    });
                                                }
                                            }
                                        });
                                    });
                                }
                                else {
                                    callback(200);
                                }
                            }
                            else {
                                callback(500, {
                                    'Error': 'Could not delete the user!'
                                });
                            }
                        })
                    }
                    else {
                        callback(400, {
                            'Error': 'No User Found!'
                        });
                    }
                });
            }
            else {
                callback(403, {
                    'Error' : 'Unauthenticated'
                });
            }
        });
    }
    else {
        callback(400, {
            'Error': 'Missing Required Payloads!'
        });
    }
};

handlers.tokens = (data, callback) => {
    const methods = ['post', 'get', 'put', 'delete'];
    if (methods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    }
    else {
        callback(405);
    }
};

handlers._tokens = {};

handlers._tokens.post = (data, callback) => {
    phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if (phone && password) {
        _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
                let hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.password) {
                    let tokenId = helpers.createRandomString(20);
                    let expires = Date.now() + 1000 * 60 * 60;
                    let tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    _data.create('tokens', tokenId, tokenObject, (err) => {
                        if (!err) {
                            callback(200, tokenObject);
                        }
                        else {
                            callback(500, {
                                'Error': 'Unable to create token!'
                            });
                        }
                    });
                }
                else {
                    callback(400, {
                        'Error': 'Password is invalid!'
                    });
                }
            }
            else {
                callback(400, {
                    'Error': 'Cannot Find User'
                });
            }
        });
    }
    else {
        callback(400, {
            'Error': 'Missing Required Fields'
        });
    }
};

handlers._tokens.get = (data, callback) => {
    id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData);
            }
            else {
                callback(404);
            }
        });
    }
    else {
        callback(400, {
            'Error': 'Missing Required Field!'
        });
    }
};

handlers._tokens.put = (data, callback) => {
    id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if (id && extend) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                if (tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() * 1000 * 60 * 60;
                    _data.update('tokens', id, tokenData, (err) => {
                        if (!err) {
                            callback(200);
                        }
                        else {
                            callback(500, {
                                'Error': 'Error in extending the token!'
                            });
                        }
                    });
                }
                else {
                    callback(400, {
                        'Error': 'Token already expired!'
                    });
                }
            }
            else {
                callback(400, {
                    'Error': 'Specified token does not exist!'
                })
            }
        });
    }
    else {
        callback(400, {
            'Error': 'Missing required fields or invalid values received!'
        });
    }
};

handlers._tokens.delete = (data, callback) => {
    id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                _data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200);
                    }
                    else {
                        callback(500, {
                            'Error': 'Could not delete the user!'
                        });
                    }
                })
            }
            else {
                callback(400, {
                    'Error': 'No User Found!'
                });
            }
        });
    }
    else {
        callback(400, {
            'Error': 'Missing Required Payloads!'
        });
    }
};

handlers._tokens.verifyToken = (id, phone, callback) => {
    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            }
            else {
                callback(false);
            }
        }
        else {
            callback(false);
        }
    });
};

handlers.checks = (data, callback) => {
    const methods = ['post', 'get', 'put', 'delete'];
    if (methods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    }
    else {
        callback(405);
    }
};

handlers._checks = {};

handlers._checks.post = (data, callback) => {
    const protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.protocol) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const statusCode = typeof(data.payload.statusCode) == 'object' && data.payload.statusCode instanceof Array && data.payload.statusCode.length > 0 ? data.payload.statusCode : false;
    const timeOutSec =  typeof(data.payload.timeOutSec) == 'number' && data.payload.timeOutSec % 1 === 0 && data.payload.timeOutSec >= 1 && data.payload.timeOutSec <= 5 ? data.payload.timeOutSec : false;

    if(protocol && url && method && statusCode && timeOutSec) {
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        if(token) {
            _data.read('tokens', token, (err, tokenData) => {
                if(!err && tokenData) {
                    let userPhone = tokenData.phone;
                    _data.read('users', phone, (err, userData) => {
                        if(!err && userData) {
                            let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                            if(userChecks.length < config.maxChecks) {
                                let checkId = helpers.createRandomString(20);
                                let checkObject = {
                                    'id' : checkId,
                                    'userPhone' : userPhone,
                                    'protocol' : protocol,
                                    'url' : url,
                                    'method' : method,
                                    'statusCode' : statusCode,
                                    'timeoutSec' : timeOutSec
                                };

                                _data.create('checks', checkId, checkObject, (err) => {
                                    if(!err) {
                                        userData.checks = userChecks;
                                        userData.checks.push(checkId);
                                        _data.update('users', userPhone, userData, (err) => {
                                            if(!err) {
                                                callback(200, checkObject);
                                            }
                                            else {
                                                callback(500, {
                                                    'Error' : 'Unable to associate the check with the user!'
                                                });
                                            }
                                        });
                                    }
                                    else {
                                        callback(500 ,{
                                            'Error' : 'Could not create the new check!'
                                        });
                                    }
                                });
                            }
                            else {
                                callback(400, {
                                    'Error' : `Already have maximum number of checks associated with this user!`
                                });
                            }
                        }
                        else{
                            callback(403);
                        }
                    });
                }
                else {
                    callback(403);
                }
            });
        }
        else {
            callback(401);
        }
    }
    else {
        callback(400, {
            'Error' : 'Missing or Invalid Parameters!'
        });
    }
};

handlers._checks.get = (data, callback) => {
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (phone) {
        _data.read('checks', id, (err, checkData) => {
            if(!err && checkData) {
                let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                handlers._tokens.verifyToken(token, checkData.userPhone, (isValid) => {
                    if (isValid) {
                        callback(200, checkData);
                    }
                    else {
                        callback(403);
                    }
                });
            }
            else {
                callback(404);
            }
        });
    }
    else {
        callback(400, {
            'Error': 'Missing Required Payloads!'
        });
    }
};

handlers._checks.put = (data, callback) => {
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

    const protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.protocol) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const statusCode = typeof(data.payload.statusCode) == 'object' && data.payload.statusCode instanceof Array && data.payload.statusCode.length > 0 ? data.payload.statusCode : false;
    const timeOutSec =  typeof(data.payload.timeOutSec) == 'number' && data.payload.timeOutSec % 1 === 0 && data.payload.timeOutSec >= 1 && data.payload.timeOutSec <= 5 ? data.payload.timeOutSec : false;

    if(id) {
        if(protocol || url || method || statusCode || timeOutSec) {
            _data.read('checks', id, (err, checkData) => {
                if(!err && checkData) {
                    let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                    handlers._tokens.verifyToken(token, checkData.userPhone, (isValid) => {
                        if (isValid) {
                            if(protocol) {
                                checkData.protocol = protocol;
                            }
                            if(url) {
                                checkData.url =  url;
                            }
                            if(method) {
                                checkData.method = method;
                            }
                            if(statusCode) {
                                checkData.statusCode = statusCode;
                            }
                            if(timeOutSec) {
                                checkData.timeoutSec = timeOutSec;
                            }

                            _data.update('checks', id, checkData, (err) => {
                                if(!err) {
                                    callback(200);
                                }
                                else {
                                    callback(500, {
                                        'Error' : 'Could not update the check!'
                                    });
                                }
                            });
                        }
                        else {
                            callback(403);
                        }
                    });
                }
                else {
                    callback(400, {
                        'Error' : 'Invalid ID received!'
                    });
                }
            });
        }
        else {
            callback(400, {
                'Error' : 'Missing Fields to Update!'
            });
        }
    }
    else {
        callback(400, {
            'Error' : 'Missing Required Fields'
        });
    }
};

handlers._checks.delete = (data, callback) => {
    id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('checks', id, (err, checkData) => {
            if(!err && checkData) {
                let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                handlers._tokens.verifyToken(token, checkData.userPhone, (isValid) => {
                    if (isValid) {
                        _data.delete('checks', id, (err) => {
                            if(!err) {
                                _data.read('users', checkData.userPhone, (err, userData) => {
                                    if (!err && userData) {
                                        let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                        let checkPosition =  userChecks.indexOf(id);
                                        if(checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            _data.update('users', checkData.userPhone, userData, (err) => {
                                                if (!err) {
                                                    callback(200);
                                                }
                                                else {
                                                    callback(500, {
                                                        'Error': 'Could not update the user!'
                                                    });
                                                }
                                            });
                                        }
                                        else {
                                            callback(500, {
                                                'Error' : 'This check is not associated with this user!'
                                            });
                                        }
                                    }
                                    else {
                                        callback(500, {
                                            'Error': 'Could not find the user associated with the check!'
                                        });
                                    }
                                });
                            }
                            else {
                                callback(500, {
                                    'Error': 'Could not delete the check!'
                                });
                            }
                        });
                    }
                    else {
                        callback(403, {
                            'Error' : 'Unauthenticated'
                        });
                    }
                });
            }
            else {
                callback(404);
            }    
        });
    }
    else {
        callback(400, {
            'Error': 'Missing Required Payloads!'
        });
    } 
};

handlers.notFound = (data, callback) => {
    callback(404);
};

module.exports = handlers;