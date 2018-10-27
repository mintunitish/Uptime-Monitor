/*
 * This file is part of the mintunitish/Uptime Monitor.
 *
 * Copyright (c) 2018, Nitish Kumar <mintu.nitish@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 *
 * Created By: Nitish Kumar on 10/27/2018 11:28 PM
 */

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