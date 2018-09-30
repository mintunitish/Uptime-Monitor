/*
* Export Configurations variables
*/

let environments ={};

environments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'secret' : 'thisIsASecret',
    'maxChecks' : 5,
    'twilio' : {
        'accountSid' : '',
        'authToken' : '',
        'fromPhone' : ''
    },
    'templateGlobals' : {
        'appName' : 'Uptime Monitor',
        'companyName' : 'Awesome People Inc.',
        'yearCreated' : '2018',
        'baseUrl' : 'http://localhost:3000/'
    }
};

environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'secret' : 'someSecret',
    'maxChecks' : 10,
    'twilio' : {
        'accountSid' : '',
        'authToken' : '',
        'fromPhone' : ''
    },
    'templateGlobals' : {
        'appName' : 'Uptime Monitor',
        'companyName' : 'Awesome People Inc.',
        'yearCreated' : '2018',
        'baseUrl' : 'http://localhost:5000/'
    }
};

const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// defaults to staging
let environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;

