
const winston = require('winston');

const config = require('./config.js');

const debugTransports = [];
if (config.logger.commandLine) {
  debugTransports.push(new (winston.transports.Console)({ json: false, timestamp: true }));
}
debugTransports.push(new winston.transports.File({ filename: __dirname + '/debug.log', json: false }));

const exceptionTransports = [];
if (config.logger.commandLine) {
  exceptionTransports.push(new (winston.transports.Console)({ json: false, timestamp: true }));
}
exceptionTransports.push(new winston.transports.File({ filename: __dirname + '/debug.log', json: false }));

const logger = new (winston.Logger)({
  transports: debugTransports,
  exceptionHandlers: exceptionTransports,
  exitOnError: false
});

/*
// pass in function arguments object and returns string with whitespaces
function argumentsToString(v){
    // convert arguments object to real array
    var args = Array.prototype.slice.call(v);
    for(var k in args){
        if (typeof args[k] === "object"){
            // args[k] = JSON.stringify(args[k]);
            args[k] = util.inspect(args[k], false, null, true);
        }
    }
    var str = args.join(" ");
    return str;
}

// wrapping the winston function to allow for multiple arguments
var wrap = {};
wrap.info = function () {
	logger.log.apply(logger, ["info", argumentsToString(arguments)]);
};

wrap.error = function () {
	logger.log.apply(logger, ["error", argumentsToString(arguments)]);
};

wrap.warn = function () {
	logger.log.apply(logger, ["warn", argumentsToString(arguments)]);
};

wrap.debug = function () {
	logger.log.apply(logger, ["debug", argumentsToString(arguments)]);
};
*/

module.exports = logger;
