const http = require('http');
const https = require('https');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
const config = require('./../config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');

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
        let data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headersObject,
            'payload': helpers.parseJsonToObject(buffer)
        };

        chosenHandler(data, (statusCode, payload) => {
            statusCode = typeof(statusCode) == "number" ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {};
            res.setHeader('Content-Type', 'application/json');
            let payloadString = JSON.stringify(payload);
            res.writeHead(statusCode);
            res.end(payloadString);
        });

        console.log(buffer);
    });
};

server.router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
};

server.init = () => {
    server.httpServer.listen(config.httpPort, function () {
        console.log(`Listening on port ${config.httpPort}`);
    });

    server.httpsServer.listen(config.httpsPort, function () {
        console.log(`Listening on port ${config.httpsPort}`);
    });
};

module.exports = server;