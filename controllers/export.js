var auth = require( './auth' ),
    surveyTemplate = require( '../lib/survey_template' ),
    SurveyResponse = require( '../models/survey_response' );

var ExportController = function() {
    this.csv = function( req, res ) {
        var now = new Date(),
            cleanTitle = req.survey.title.replace( /[^a-z0-9]/ig, '' ),
            key = req.param( 'key' ),
            today = now.getFullYear() + '_' + ( now.getMonth() + 1 ) + '_' + now.getDate(),
            flatSurvey = [],
            csvData = [],
            survey = surveyTemplate.getSurvey( req.survey.version );

        survey.pages.forEach( function( page ) {
            page.fields.forEach( function( q ) {
                if( q.type === 'gridselect' ) {
                    for( var key in q.options ) {
                        flatSurvey.push( { name: key, label: q.options[ key ] } );
                    }
                } else {
                    flatSurvey.push( { name: q.name, label: q.label } );
                }
            } );
        } );

        csvData.push( flatSurvey.map( function( q ) { return q.label; } ) );

        SurveyResponse.find( { surveyId: req.survey.id }, function( err, responses ) {
            if( responses && responses.length ) {
                responses.forEach( function( response ) {
                    csvData.push( flatSurvey.map( function( q ) {
                        try {
                            return response.response[ q.name ];
                        } catch( e ) {
                            return '';
                        }
                    } ) );
                } );
            }

            res.header('Content-Disposition', 'attachment; filename=' + today + '_' + cleanTitle + '.csv');
            res.csv( csvData );
        } );
    };
};

exports.setup = function( app ) {
    var exporter = new ExportController();

    app.get( '/export/:key', auth.canAccessSurvey, exporter.csv );
};
