var fs = require( 'fs' ),
    auth = require( './auth' ),
    Survey = require( '../models/survey' ),
    surveyTemplate = require( '../lib/survey_template' );

var OverviewController = function() {
    this.index = function( req, res ) {
        if( !req.survey ) {
            return res.redirect( '/404' );
        }

        res.locals.classes.push( 'overview' );

        var template = surveyTemplate.getSurvey( req.survey.version );

        res.render( 'survey/' + template.render + '/overview', {
            survey: req.survey,
            validPermissions: Survey.validPermissions(),
            csrfToken: req.csrfToken()
        } );
    };

    this.detail = function( req, res ) {
        var template = surveyTemplate.getSurvey( req.survey.version );

        fs.exists( __dirname + '/../views/survey/' + template.render + '/detail.jade', function( exists ) {
            if( exists ) {
                res.render( 'survey/' + template.render + '/detail', {
                    survey: req.survey,
                    validPermissions: Survey.validPermissions(),
                    csrfToken: req.csrfToken()
                } );
            } else {
                // if no scores template exists, head back to the overview
                res.redirect( '/view/' + req.param( 'key' ) );
            }
        } );
    };

    this.domain = function( req, res ) {
        var template = surveyTemplate.getSurvey( req.survey.version ),
            domain = req.param( 'domain' );
        domain = domain[ 0 ].toUpperCase() + domain.slice( 1 );

        fs.exists( __dirname + '/../views/survey/' + template.render + '/scores.jade', function( exists ) {
            if( exists ) {
                res.render( 'survey/' + template.render + '/scores', {
                    survey: req.survey,
                    domain: domain,
                    validPermissions: Survey.validPermissions(),
                    csrfToken: req.csrfToken()
                } );
            } else {
                // if no scores template exists, head back to the overview
                res.redirect( '/view/' + req.param( 'key' ) );
            }
        } );
    };
};

exports.setup = function( app ) {
    var overview = new OverviewController();

    app.get( '/view/:key', auth.canAccessSurvey, overview.index );
    app.get( '/view/:key/detail', auth.canAccessSurvey, overview.detail );
    app.get( '/view/:key/scores/:domain', auth.canAccessSurvey, overview.domain );
};
