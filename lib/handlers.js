const _data = require('./data');
const helpers = require('./helpers');

const handlers = {};

let phone;
let firstName;
let lastName;
let password;

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
    let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    let extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
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
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
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

handlers.notFound = (data, callback) => {
    callback(404);
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

module.exports = handlers;