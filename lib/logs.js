const fs =  require('fs');
const path = require('path');
const zlib = require('zlib');

let lib = {};

lib.baseDir = path.join(__dirname, '/../.logs/');

lib.append = (fileName, str, callback) => {
    fs.open(lib.baseDir+fileName+'.log', 'a', (err, fDescriptor) => {
        if (!err && fDescriptor) {
            fs.appendFile(fDescriptor, str+'\n', (err) => {
                if (!err) {
                    fs.close(fDescriptor, (err) => {
                        if (!err) {
                            callback(false);
                        }
                        else {
                            callback('Error closing file!');
                        }
                    });
                }
                else {
                    callback('Error appending to the file');
                }
            });
        }
        else {
            callback('Could not open file for appending');
        }
    });
};

lib.list = (includeCompressedFiles, callback) => {
    fs.readdir(lib.baseDir, (err, data) => {
        if (!err && data) {
            let trimmedFileNames = [];
            data.forEach((fileName) => {
                if (fileName.indexOf('.log') > -1) {
                    trimmedFileNames.push(fileName.replace('.log', ''));
                }
                
                if (fileName.indexOf('.gz.b64') > -1 && includeCompressedFiles) {
                    trimmedFileNames.push(fileName.replace('.gz.b64', ''));
                }
            });
            callback(false, trimmedFileNames);
        }
        else {
            callback(err, data);
        }
    });
};

lib.compress = (logId, newFileId, callback) => {
    let sourceFile = logId+'.log';
    let destFile = newFileId+'.gz.b64';
    fs.readFile(lib.baseDir+sourceFile, 'utf8', (err, inputStr) => {
        if (!err && inputStr) {
            zlib.gzip(inputStr, (err, buffer) => {
                if (!err && buffer) {
                    fs.open(lib.baseDir+destFile, 'wx', (err, fDesc) => {
                        if (!err && fDesc) {
                            fs.writeFile(fDesc, buffer.toString('base64'), (err) => {
                                if (!err) {
                                    fs.close(fDesc, (err) => {
                                        if (err) {
                                            callback(err);
                                        }
                                        else{
                                            callback(false);
                                        }
                                    });
                                }
                                else {
                                    callback(err);
                                }
                            });
                        }
                        else {
                            callback(err);
                        }
                    });
                }
                else {
                    callback(err);
                }
            })
        }
        else {
            callback(err);
        }
    });
};

lib.decompress = (fileId, callback) => {
    let fileName = fileId+'.gz.b64';
    fs.readFile(lib.baseDir+fileName, 'utf8', (err, str) => {
        if (!err && str) {
            let ipBuffer = Buffer.from(str, 'base64');
            zlib.unzip(ipBuffer, (err, opBuffer) => {
                if (!err && opBuffer) {
                    let str = opBuffer.toString();
                    callback(false, str);
                }
                else {
                    callback(err);
                }
            });
        }
        else {
            callback(false);
        }
    });
};

lib.truncate = (logId, callback) => {
    fs.truncate(lib.baseDir+logId+'.log', 0, (err) => {
        if (!err) {
            callback(false);
        }
        else {
            callback(err);
        }
    });
};

module.exports = lib;