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
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'password' : hashedPassword,
                        'tosAgreement' : tosAgreement
                    };

                    _data.create('users', phone, userObject, (err) => {
                        if (!err) {
                            callback(200);
                        }
                        else {
                            console.log(err);
                            callback(500,{
                                'Error' : 'Could not create the new user!'
                            });
                        }
                    });
                }
                else {
                    callback('500', {
                        'Error' : 'Couldn\'t hash the password!'
                    });
                }
            }
            else {
                callback('400', {
                    'Error' : 'A user with that phone number already exists!'
                });
            }
        })
    }
    else {
        callback('400', {
            'Error' : 'Missing Required Payloads!'
        });
    }
};

handlers._users.get = (data, callback) => {
    phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                delete data.password;
                callback(200, data);
            }
            else {
                callback(404);
            }
        });
    }
    else{
        callback(400, {
            'Error' : 'Missing Required Payloads!'
        });
    }
};

handlers._users.put = (data, callback) => {
    phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone) {
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
                                'Error' : 'Could\'t update the user!'
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
                'Errors' : 'Missing Fields to update'
            });
        }
    }
    else {
        callback(400, {
            'Error' : 'Missing Required Field'
        });
    }
};

handlers._users.delete = (data, callback) => {
    phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                _data.delete('users', phone, (err) => {
                    if (!err) {
                        callback(200);
                    }
                    else {
                        callback(500, {
                            'Error' : 'Could not delete the user!'
                        });
                    }
                })
            }
            else {
                callback(400, {
                    'Error' : 'No User Found!'
                });
            }
        });
    }
    else{
        callback(400, {
            'Error' : 'Missing Required Payloads!'
        });
    }
};

handlers.notFound = (data, callback) => {
    callback(404);
};

module.exports =  handlers;