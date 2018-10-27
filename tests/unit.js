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

const assert = require('assert');
const helpers = require('./../lib/helpers');
const logs = require('./../lib/logs');

let unit = {};

unit['logs.truncate should not throw if the log id does not exist. It should callback err instead'] =  (done) =>  {
    assert.doesNotThrow(() => {
        logs.truncate('does not exists', (err) => {
            assert.ok(err);
            done();
        });
    }, TypeError);
};

unit['logs.list should callback a false error and an array of log names'] = (done) => {
    logs.list(true, (err, logFileNames) => {
        assert.equal(err, false);
        assert.ok(logFileNames instanceof Array);
        assert.ok(logFileNames.length > 1);
        done();
    });
};

module.exports = unit;

