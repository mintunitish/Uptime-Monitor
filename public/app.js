/*
* Frontend Javascript File
* */

let app = {};

app.config = {
    'sessionToken' : false
};

app.client = {};

app.client.request = (headers, path, method, queryStringObject, payload, callback) => {
    headers = typeof(headers) == 'object' && headers !== null ? headers : {};
    path = typeof(path) == 'string' ? path : '/';
    method = typeof(method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method) ? method.toUpperCase() : 'GET';
    queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
    payload = typeof(payload) == 'object' && payload !== null ? payload : {};
    callback = typeof(callback) == 'function' ? callback : false;

    let requestUrl = path+'?';
    let counter = 0;

    for (let key in queryStringObject) {
        if (queryStringObject.hasOwnProperty(key)) {
            counter++;
            if (counter > 1) {
                requestUrl += '&';
            }
            requestUrl += key + '=' + queryStringObject[key];
        }
    }

    let xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    for (let key in headers) {
        if (headers.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, headers[key]);
        }
    }

    if (app.config.sessionToken) {
        xhr.setRequestHeader("token", app.config.sessionToken.id);
    }

    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            let statusCode = xhr.status;
            let response = xhr.responseText;
            if (callback) {
                try {
                    let parseResponse = JSON.parse(response);
                    callback(statusCode, parseResponse);
                }
                catch (e) {
                    callback(statusCode, false);
                }
            }
        }
    };

    let payloadStr = JSON.stringify(payload);
    xhr.send(payloadStr);
};

