var mongoose = require( 'mongoose' ),
    config = require( '../config' );

// Connect to the MongoDB database
var db = mongoose.createConnection( config.db.url );

exports.up = function(next){
    // expire sessions after 2 years
    db.collection( 'sessions' ).ensureIndex(
        { "lastAccess": 1 },
        { expireAfterSeconds: 1000 * 60 * 60 * 24 * 365 * 2 },
        function() { next(); }
    );
};

exports.down = function(next){
    db.collection( 'sessions' ).dropIndex(
        { "lastAccess": 1 },
        {},
        function() { next(); }
    );
};
