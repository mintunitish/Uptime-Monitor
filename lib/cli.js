const readLine = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');
const os = require('os');
const v8 = require('v8');
const _data = require('./data');

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
    const commands = {
        'exit' : 'Kill the CLI (and the rest of the application)',
        'man' : 'Show this help page',
        'help' : 'Alias of the "man" command',
        'stats' : 'Get statistics on the underlying operating system and resource utilization',
        'List users' : 'Show a list of all the registered (undeleted) users in the system',
        'More user info --{userId}' : 'Show details of a specified user',
        'List checks --up --down' : 'Show a list of all the active checks in the system, including their state. The "--up" and "--down flags are both optional."',
        'More check info --{checkId}' : 'Show details of a specified check',
        'List logs' : 'Show a list of all the log files available to be read (compressed and uncompressed)',
        'More log info --{logFileName}' : 'Show details of a specified log file',
    };

    cli.horizontalLine();
    cli.centered('CLI MANUAL');
    cli.horizontalLine();
    cli.verticalSpace(2);

    for (let i in commands) {
        if (commands.hasOwnProperty(i)) {
            let value = commands[i];
            let line = '\x1b[33m'+i+'\x1b[0m';
            let padding = 60 - line.length;
            for (let j = 0; j < padding; j++) {
                line+=' ';
            }
            line+=value;
            console.log(line);
            cli.verticalSpace();
        }
    }

    cli.verticalSpace(1);
    cli.horizontalLine();
};

cli.responders.exit = () => {
    process.exit(0);
};

cli.responders.stats = () => {
    let stats = {
        'Load Average' : os.loadavg().join(' '),
        'CPU Count' : os.cpus().length,
        'Free Memory' : os.freemem(),
        'Current Malloced Memory' : v8.getHeapStatistics().malloced_memory,
        'Peak Malloced Memory' : v8.getHeapStatistics().peak_malloced_memory,
        'Allocated Heap Used (%)' : Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
        'Available Heap Allocated (%)' : Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
        'Uptime' : os.uptime() + 'Seconds'
    };

    cli.horizontalLine();
    cli.centered('SYSTEM STATISTICS');
    cli.horizontalLine();
    cli.verticalSpace(2);

    for (let i in stats) {
        if (stats.hasOwnProperty(i)) {
            let value = stats[i];
            let line = '\x1b[33m'+i+'\x1b[0m';
            let padding = 60 - line.length;
            for (let j = 0; j < padding; j++) {
                line+=' ';
            }
            line+=value;
            console.log(line);
            cli.verticalSpace();
        }
    }

    cli.verticalSpace(1);
    cli.horizontalLine();
};

cli.responders.listUsers = () => {
    _data.list('users', (err, userIds) => {
        if(!err && userIds && userIds.length > 0) {
            cli.verticalSpace();
            userIds.forEach((userId) => {
                _data.read('users', userId, (err, userData) => {
                    if(!err && userData) {
                        let line = 'Name: ' + userData.firstName + ' ' + userData.lastName + ' Phone: ' +userData.phone + ' Checks: ';
                        line += typeof(userData.checks) == 'object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks.length : 0;
                        console.log(line);
                        cli.verticalSpace();
                    }
                });
            });
        }
    });
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

cli.verticalSpace = (lines) => {
    lines = typeof(lines) == 'number' && lines > 0 ? lines : 1;
    for (let i = 0; i < lines; i++) {
        console.log('');
    }
};

cli.horizontalLine = () => {
    let width = process.stdout.columns;
    let line = '';
    for (let i = 0; i < width; i++) {
        line += '-';
    }
    console.log(line);
};

cli.centered = (str) => {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : '';
    let width = process.stdout.columns;
    let leftPadding = Math.floor((width - str.length) / 2);
    let line = '';
    for (let i = 0; i < leftPadding; i++) {
        line+=' ';
    }
    line+= str;
    console.log(line);
};

module.exports = cli;