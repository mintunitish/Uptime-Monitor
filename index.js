const server = require('./lib/server');
const worker = require('./lib/worker');

let app = {};

app.init = () => {
    server.init();
    worker.init();
};

app.init();

module.exports = app;