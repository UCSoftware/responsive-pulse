var mongoose = require( 'mongoose' ),
    config = require( '../config' ),
    SurveyResponse = require( '../models/survey_response' ),
    Survey = require( '../models/survey' );

// Connect to the MongoDB database
var db = mongoose.createConnection( config.db.url );

exports.up = function(next){
    // recalculate aggregate score for each survey
    Survey.find( {}, function( err, surveys ) {
        function pop() {
            var svy = surveys.pop();
            if (svy !== undefined && svy !== null) {
                if( !svy.creator && svy.users.length ) {
                    var creator = svy.users.filter( function( user ) {
                        return user.permissions.indexOf( 'owner' );
                    } )[ 0 ];

                    if( creator ) {
                        svy.creator = creator.user;
                    }
                }
                svy.save( function( err ) {
                    if( surveys.length ) {
                        process.nextTick( pop );
                    } else {
                        next();
                    }
                } );
            } else {
                if( surveys.length ) {
                    process.nextTick( pop );
                } else {
                    next();
                }
            }
        };

        pop();
    } );
};

exports.down = function(next){
    next();
};
