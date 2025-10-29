const winston = require('winston');
const path = require('path');

//* Levels of logging
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

//* Colors of different kinds of logging
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'magenta',
    debug: 'blue'
};

//* Applying colors
winston.addColors(colors);

//* Console logging format
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss DD-MM-YYYY' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `[${info.timestamp}] ${info.level}: ${info.message}`,
    ),
);

//* File logging format
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss DD-MM-YYYY' }),
    winston.format.uncolorize(),
    winston.format.printf(
        (info) => `[${info.timestamp}] ${info.level}: ${info.message}`,
    ),
);

//* Transports
const transports = [
    //* Console transport
    new winston.transports.Console({
        format: consoleFormat
    }),
    
    //* File transport for errors
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error',
        format: fileFormat
    }),
    
    //* File transport for all logs (exclude debug)
    new winston.transports.File({ 
        filename: path.join(__dirname, '../logs/info.log'),
        level: 'info',
        format: fileFormat
    }),

    //* File transport for debugging info
    new winston.transports.File({ 
        filename: path.join(__dirname, '../logs/all_plus_debug.log'),
        levels: 'debug',
        format: fileFormat
    }),
];

const logger = winston.createLogger({
    level: 'debug',
    levels,
    transports    
});

module.exports = logger;