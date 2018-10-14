const http = require('http');
const https = require('https');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
const config = require('./../config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');
const util = require('util');
const debug = util.debuglog('server');

let server = {};

server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res);
});

server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
    server.unifiedServer(req, res);
});

server.unifiedServer = (req, res) => {
    let parsedUrl = url.parse(req.url, true);
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, '');
    let method = req.method.toLowerCase();
    let queryStringObject = parsedUrl.query;
    let headersObject = req.headers;

    let decoder = new stringDecoder('utf-8');
    let buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data);
    });
    req.on('end', function () {
        buffer += decoder.end();
        let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

        let data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headersObject,
            'payload': helpers.parseJsonToObject(buffer)
        };

        try {
            chosenHandler(data, (statusCode, payload, contentType) => {
                server.processHandlerResponse(res, method, trimmedPath, statusCode, payload, contentType);
            });
        }
        catch (e) {
            debug(e);
            server.processHandlerResponse(res, method, trimmedPath, 500, {'Error' : 'An Unknown Has Occurred'}, 'json');
        }
    });
};

server.processHandlerResponse = (res, method, trimmedPath, statusCode, payload, contentType) => {
    contentType = typeof(contentType) == 'string' ? contentType : 'json';
    statusCode = typeof(statusCode) == "number" ? statusCode : 200;

    let payloadString = '';
    if (contentType === 'json') {
        res.setHeader('Content-Type', 'application/json');
        payload = typeof(payload) == 'object' ? payload : {};
        payloadString = JSON.stringify(payload);
    }
    if (contentType === 'html') {
        res.setHeader('Content-Type', 'text/html');
        payloadString = typeof(payload) == 'string' ? payload : '';
    }
    if (contentType === 'favicon') {
        res.setHeader('Content-Type', 'image/x-icon');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
    }
    if (contentType === 'css') {
        res.setHeader('Content-Type', 'text/css');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
    }
    if (contentType === 'png') {
        res.setHeader('Content-Type', 'image/png');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
    }
    if (contentType === 'jpg') {
        res.setHeader('Content-Type', 'image/jpeg');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
    }
    if (contentType === 'js') {
        res.setHeader('Content-Type', 'text/javascript');
        payloadString = typeof(payload) !== 'undefined' ? payload : '';
    }
    if (contentType === 'plain') {
        res.setHeader('Content-Type', 'text/plain');
        payloadString = typeof(payload) == 'string' ? payload : '';
    }

    res.writeHead(statusCode);
    res.end(payloadString);

    if (statusCode == 200) {
        debug('\x1b[32m%s\x1b[0m', method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
    }
    else {
        debug('\x1b[31m%s\x1b[0m', method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
    }
};

server.router = {
    '' : handlers.index,
    'account/create' : handlers.accountCreate,
    'account/edit' : handlers.accountEdit,
    'account/deleted' : handlers.accountDeleted,
    'session/create' : handlers.sessionCreate,
    'session/deleted' : handlers.sessionDeleted,
    'checks/all' : handlers.checkList,
    'checks/create' : handlers.checkCreate,
    'checks/edit' : handlers.checkEdit,
    'favicon.png' : handlers.favicon,
    'public' : handlers.public,
    'ping': handlers.ping,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/checks': handlers.checks
};

server.init = () => {
    server.httpServer.listen(config.httpPort, function () {
        console.log('\x1b[36m%s\x1b[0m', `Listening on port ${config.httpPort}`);
    });

    server.httpsServer.listen(config.httpsPort, function () {
        console.log('\x1b[35m%s\x1b[0m', `Listening on port ${config.httpsPort}`);
    });
};

module.exports = server;