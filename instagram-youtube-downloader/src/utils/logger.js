const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'app.log');

const logger = {
    info: (message) => {
        const logMessage = `[INFO] ${new Date().toISOString()}: ${message}\n`;
        fs.appendFileSync(logFilePath, logMessage);
        console.log(logMessage);
    },
    error: (message) => {
        const logMessage = `[ERROR] ${new Date().toISOString()}: ${message}\n`;
        fs.appendFileSync(logFilePath, logMessage);
        console.error(logMessage);
    },
    warn: (message) => {
        const logMessage = `[WARN] ${new Date().toISOString()}: ${message}\n`;
        fs.appendFileSync(logFilePath, logMessage);
        console.warn(logMessage);
    }
};

module.exports = logger;