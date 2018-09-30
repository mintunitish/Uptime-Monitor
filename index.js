const server = require('./lib/server');
const worker = require('./lib/worker');
const cli = require('./lib/cli');

let app = {};

app.init = () => {
    server.init();
    worker.init();
    setTimeout(() => {
        cli.init();
    }, 50);
};

app.init();

module.exports = app;