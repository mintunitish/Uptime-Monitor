const http = require('http');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;

const server = http.createServer(function (req, res) {

    let parsedUrl = url.parse(req.url, true);
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g,'');
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
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headersObject,
            'payload' : buffer
        };

        chosenHandler(data, (statusCode, payload) => {
            statusCode = typeof(statusCode) == "number" ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {};

            let payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log(buffer);
        });
    });
});

server.listen(3000, function () {
    console.log("Listening...");
});

const handlers = {};

handlers.sample = (data, callback) => {
    callback(406, {
        'name' : 'sample handler'
    });
};

handlers.notFound = (data, callback) => {
    callback(404);
};

const router = {
    'sample' : handlers.sample
};