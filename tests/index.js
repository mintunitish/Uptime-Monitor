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

_app = {};

_app.tests = {};

_app.tests.unit = require('./unit');

_app.countTests = () => {
    let counter = 0;
    for (let key in _app.tests) {
        if (_app.tests.hasOwnProperty(key)) {
            const subTests =  _app.tests[key];
            for (let testName in subTests) {
                if (subTests.hasOwnProperty(testName)) {
                    counter++;
                }
            }
        }
    }

    return counter;
};

_app.runTests = () => {
    let error = [];
    let success = 0;
    const limit = _app.countTests();
    let counter = 0;
    for (let key in _app.tests){
        if (_app.tests.hasOwnProperty(key)) {
            const subTests = _app.tests[key];
            for (let testName in subTests) {
                if (subTests.hasOwnProperty(testName)) {
                    (() => {
                        let tmpTestName = testName;
                        let testValue = subTests[testName];
                        try{
                            testValue(() => {
                                console.log('\x1b[32m%s\x1b[0m', tmpTestName);
                                counter++;
                                success++;
                                if (counter == limit) {
                                    _app.produceTestReport(limit, success, error);
                                }
                            });
                        }
                        catch(err){
                            error.push({
                                'name' : testName,
                                'error' : err
                            });
                            console.log('\x1b[31m%s\x1b[0m', tmpTestName);
                            counter++;
                            if (counter == limit) {
                                _app.produceTestReport(limit, success, error);
                            }
                        }
                    })();
                }
            }
        }
    }
};

_app.produceTestReport = (limit, successes, errors) => {
    console.log('');
    console.log('---------------TEST REPORT------------------');
    console.log('');
    console.log('Total Tests: ', limit);
    console.log('Pass: ', successes);
    console.log('Fail: ', errors.length);
    console.log('');

    if (errors.length > 0) {
        console.log('-----------ERROR DETAILS-----------------');
        console.log('');
        errors.forEach((testError) => {
            console.log('\x1b[31m%s\x1b[0m', testError.name);
            console.log(testError.error);
            console.log('');
        });

        console.log('');
        console.log('-----------------------------------------');
    }

    console.log('');
    console.log('---------------------------------------------');
};

_app.runTests();