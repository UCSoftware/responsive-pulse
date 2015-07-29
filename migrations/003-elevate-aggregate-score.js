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
                if(!svy.orgLeaderRole || svy.orgLeaderRole === '') {
                    svy.orgLeaderRole = 'Unknown';
                    svy.orgLeader = 'Unknown';
                    svy.industry = 'Unknown';
                    svy.orgAge = 0;
                    svy.orgSize = 'Not known';
                }
                svy.save( function( err ) {
                    Survey.updateScore( svy._id, function() {
                        if( surveys.length ) {
                            process.nextTick( pop );
                        } else {
                            next();
                        }
                    } );
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
