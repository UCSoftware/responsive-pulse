var extend = require( 'util' )._extend,
    request = require( 'request' ),
    auth = require( './auth' ),
    config = require( '../config.js' ),
    surveyTemplate = require( '../lib/survey_template' ),
    Survey = require( '../models/survey' ),
    SurveyResponse = require( '../models/survey_response' );

var SurveyDataController = function() {
    this.data = function( req, res ) {
        var key = req.params.key,
            dummy = false;

        Survey.findOne( { key: key } ).exec( function( err, svy ) {
            if( !svy ) {
                dummy = true;
                svy = new Survey( {
                    key: key,
                    responses: [],
                    responseCount: 0
                } );
            }

            var data = svy.toObject(),
                send = function() {
                    // Remove list of shared users from object sent to user
                    delete data.users;

                    res.send( data );
                };

            // Add the survey template
            data.survey = surveyTemplate.getSurvey( svy.version );

            // Incomplete survey count
            data.incompleteCount = 0;

            if( !dummy ) {
                SurveyResponse.find( { surveyId: svy.id }, function( err, responses ) {
                    data.responses = responses.filter( function( resp ) { return resp.submitted; } )
                                              .map( function( resp ) { return resp.response; } );
                    data.incompleteCount = responses.filter( function( resp ) { return !resp.submitted; } ).length;

                    send();
                } );
            } else {
                send();
            }
        } );
    };

    this.percentile = function( req, res ) {
        Survey.find( { responseCount: { $gt: 0 } }, { score: 1, key: 1 } ).exec( function( err, surveys ) {
            // Get the score for the current survey
            var keySurvey = surveys.filter( function( s ) { return s.key === req.params.key; } )[ 0 ],
                surveyCount = surveys.length;
            // Get a count of the number of surveys with scores less than this one
            var surveysBelow = surveys.filter( function( s ) {
                return s.score < keySurvey.score;
            } );

            // Get a count of the number of surveys with scores equal to this one
            var surveysEqual = surveys.filter( function( s ) {
                return s.score === keySurvey.score;
            } );

            /**
             * ( ( B + 0.5E ) / n ) * 100 = Percentile
             * Where:
             * B = number of scores below x
             * E = number of scores equal to x
             * n = number of scores
             * @type {Number}
             */
            res.send( { percentile: ( ( surveysBelow.length + ( 0.5 * surveysEqual.length ) ) / surveyCount ) * 100 } );
        } );
    };
};

exports.setup = function( app ) {
    var survey = new SurveyDataController();

    app.get( '/view/:key/results.json', auth.canAccessSurvey, survey.data );
    app.get( '/view/:key/percentile.json', auth.canAccessSurvey, survey.percentile );
};
