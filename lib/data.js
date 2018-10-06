const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

let lib = {};

lib.baseDir = path.join(__dirname, '/../.data/');

lib.create = (dir, file, data, callback) => {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            let stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false);
                        }
                        else {
                            callback('Error closing new file!');
                        }
                    });
                }
                else {
                    callback('Error writing to new file');
                }
            });
        }
        else {
            callback('Could Not Create New File, It may already exist!');
        }
    });
};

lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', (err, data) => {
        if (!err && data) {
            callback(false, helpers.parseJsonToObject(data));
        } else {
            callback(err, data);
        }
    });
};

lib.update = (dir, file, data, callback) => {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            let stringData = JSON.stringify(data);
            fs.truncate(fileDescriptor, (err) => {
                if (!err) {
                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if (!err) {
                            fs.close(fileDescriptor, (err) => {
                                if (!err) {
                                    callback(false);
                                }
                                else {
                                    callback('Error closing file!');
                                }
                            });
                        }
                        else {
                            callback('Error writing to file');
                        }
                    });
                }
                else {
                    callback('Error truncating file!');
                }
            });
        }
        else {
            callback('The file may not exist yet!');
        }
    });
};

lib.delete = (dir, file, callback) => {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
        if (!err) {
            callback(false);
        }
        else {
            callback('Error deleting file!');
        }
    });
};

lib.list = (dir, callback) => {
    fs.readdir(lib.baseDir+dir+'/', (err, data) => {
        if(!err && data && data.length > 0) {
            let trimmedFileNames = [];
            data.forEach((fileName) => {
                if (fileName != '.gitignore') {
                    trimmedFileNames.push(fileName.replace('.json', ''));
                }
            });
            callback(false, trimmedFileNames);
        }
        else {
            callback(err, data);
        }
    });
};

module.exports = lib;