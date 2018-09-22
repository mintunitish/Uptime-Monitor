const http = require('http');
const https = require('https');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

httpServer.listen(config.httpPort, function () {
    console.log(`Listening on port ${config.httpPort}`);
});

const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
});

httpsServer.listen(config.httpsPort, function () {
    console.log(`Listening on port ${config.httpsPort}`);
});

let unifiedServer = (req, res) => {
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
        let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
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

const router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens
};