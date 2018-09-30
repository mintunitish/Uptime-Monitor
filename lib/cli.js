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
            'more check info',
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

e.on('man', (str) => {
    cli.responders.help();
});

e.on('help', (str) => {
    cli.responders.help();
});

e.on('exit', (str) => {
    cli.responders.exit();
});

e.on('stats', (str) => {
    cli.responders.stats();
});

e.on('list users', (str) => {
    cli.responders.listUsers();
});

e.on('more user info', (str) => {
    cli.responders.moreUserInfo(str);
});

e.on('list checks', (str) => {
    cli.responders.listChecks(str);
});

e.on('more check info', (str) => {
    cli.responders.moreCheckInfo(str);
});

e.on('list logs', (str) => {
    cli.responders.listLogs();
});

e.on('more log info', (str) => {
    cli.responders.moreLogInfo(str);
});

cli.responders = {};

cli.responders.help = () => {
    console.log('Seems like you need some help!');
};

cli.responders.exit = () => {
    process.exit(0);
};

cli.responders.stats = () => {
    console.log('Stats');
};

cli.responders.listUsers = () => {
    console.log('List Users');
};

cli.responders.moreUserInfo = (str) => {
    console.log('More User Info', str);
};

cli.responders.listChecks = (str) => {
    console.log('List Checks', str);
};

cli.responders.moreCheckInfo = (str) => {
    console.log('More Check Info', str);
};

cli.responders.listLogs = () => {
    console.log('List Logs');
};

cli.responders.moreLogInfo = (str) => {
    console.log('More Log Info', str);
};

module.exports = cli;