// Set the current environment to true in the env object
var currentEnv = process.env.NODE_ENV || 'development';

// Import local environment variables from config/local.js
var local = require('./config/local');

exports.appName = 'ucros';

exports.env = {
    production: false,
    staging: false,
    test: false,
    development: false
};

exports.env[ currentEnv ] = true;

exports.log = {
    path: __dirname + '/var/log/app_#{currentEnv}.log'
};

exports.server = {
    port: process.env.PORT || 4600,
    // In staging and production, listen loopback. nginx listens on the network.
    ip: '127.0.0.1'
};

if( currentEnv != 'production' && currentEnv != 'staging' ) {
    exports.enableTests = true;

    // Listen on all IPs in dev/test (for testing from other machines)
    exports.server.ip = '0.0.0.0';
}

exports.db = {
    ip: '127.0.0.1',
    port: 27017,
    database: exports.appName + '_' + currentEnv
};
exports.db.url = 'mongodb://' + exports.db.ip + ':' + exports.db.port + '/' + exports.db.database;

exports.auth = local.auth;

exports.session = local.session;

if( currentEnv === 'production' ) {
    exports.baseUrl = local.url.production;
} else if( currentEnv === 'staging' ) {
    exports.baseUrl = local.url.staging;
} else {
    exports.baseUrl = 'http://' + exports.server.ip + ':' + exports.server.port;
}

exports.surveyVersion = "20150331";

exports.email = local.email;
