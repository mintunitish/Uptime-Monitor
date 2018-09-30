const readLine = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');

class _events extends events{}
let e  = new _events();

let cli = {};

cli.init = () => {
    console.log('\x1b[34m%s\x1b[0m', "The CLI Panel is Running!");

    let _interface = readLine.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '~'
    });

    _interface.prompt();

    _interface.on('line', (str) => {
        cli.processInput(str);

        _interface.prompt();
    });

    _interface.on('close', () => {
        process.exit(0);
    });
};

cli.processInput = (str) => {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false;

    if (str) {
        let uniqueInputs = [
            'man',
            'help',
            'exit',
            'stats',
            'list users',
            'more user info',
            'list checks',
            'more checks info',
            'list logs',
            'more log info'
        ];

        let matchFound = false, count = 0;

        uniqueInputs.some((input)  => {
            if (str.toLowerCase().indexOf(input) > -1) {
                matchFound = true;
                e.emit(input, str);
                return true;
            }
        });

        if (!matchFound) {
            console.log('Unknown Command!');
        }
    }
};

module.exports = cli;