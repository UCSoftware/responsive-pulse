var fs = require( 'fs' ),
    marked = require( 'marked' ),
    extend = require( 'util' )._extend,
    surveyTemplate = require( '../lib/survey_template' ),
    Survey = require( '../models/survey' ),
    SurveyResponse = require( '../models/survey_response' ),
    random = require( '../lib/random' );

require( 'array.prototype.findindex' );

function objectLength(object) {
    var hasVal = false;
    for( var keys in object ) {
        hasVal = true;
        break;
    }
    return hasVal;
}

var SurveyController = function() {
    var self = this;

    this.applySurveyValuesToQuestion = function( question, values ) {
        for( var key in values ) {
            question = question.replace( '{{' + key + '}}', values[ key ] );
        }

        return question;
    };

    this.view = function( req, res ) {
        var key = req.params.key,
            page = parseInt( req.params.page ) || 1;

        Survey.findOne( { key: key }, function( err, svy ) {
            if( svy ) {
                var survey = surveyTemplate.getSurvey( svy.version );

                if( page === 1 ) {
                    // On page 1, we show the welcome form
                    res.render( 'form-welcome', {
                        welcomeMessage: svy.welcomeMessage ? marked( svy.welcomeMessage ) : null,
                        page: page,
                        totalPages: survey.pages.length + 1,
                        csrfToken: req.csrfToken()
                    } );
                } else {
                    // On all subsequent pages, load the correct page of the survey, offsetting for page 1
                    SurveyResponse.find( { surveyId: svy.id, submitted: { $ne: null } }, 'response.team', function( err, responses ) {
                        var teams = responses.map( function( resp ) { return resp.response.team; } ),
                            deDupedTeams = [];

                        teams.forEach( function( team ) {
                            if( deDupedTeams.indexOf( team ) === -1 ) deDupedTeams.push( team );
                        } );

                        var surveyValues = svy.toJSON();

                        // fast-forward seeded rng to the correct page
                        if( !req.session.seed ) {
                            req.session.seed = {};
                            req.session.seed[ key ] = Math.floor( Math.random() * 1000 );
                        }

                        var seed = req.session.seed[ key ];
                        for( var i = 1; i < page; i++ ) {
                            seed = random.seededNumber( seed, 0, 1 ).nextSeed;
                        }

                        // generate 100 seeded numbers for the page to use
                        var rng = [];
                        for( var n = 0; n < 100; n++ ) {
                            var num = random.seededNumber( seed, 1, 2 );
                            rng.push( Math.round( num.value ) - 1 );
                            seed = num.nextSeed;
                        }

                        res.render( 'form', {
                            template: survey.pages[ page - 2 ],
                            fillIn: self.applySurveyValuesToQuestion,
                            surveyValues: surveyValues,
                            form: req.session.form && req.session.form[ key ] ? req.session.form[ key ] : {},
                            teams: deDupedTeams,
                            page: page,
                            rng: rng,
                            totalPages: survey.pages.length + 1,
                            csrfToken: req.csrfToken()
                        } );
                    } );
                }
            } else {
                res.status( 404 ).render( '404', { url: req.url } );
            }
        } );
    };

    this.submit = function( req, res ) {
        var key = req.params.key,
            page = parseInt( req.params.page ) || 1;

        var data = req.body,
            fields = {},
            errors = {};

        // Otherwise, let's validate the page
        Survey.findOne( { key: key }, function( err, svy ) {
            // If we're coming from page 1, they just saw a welcome page, so just go to page 2
            if( page === 1 ) {
                console.log(req.session);

                if( !req.session.survey || !req.session.survey[ key ] ) {
                    return SurveyResponse.create( {
                        surveyId: svy.id,
                        response: {}
                    } )
                    .then( function( surveyRes ) {
                        if( !req.session.survey ) {
                            req.session.survey = {};
                        }

                        if( !req.session.seed ) {
                            req.session.seed = {};
                        }

                        req.session.seed[ key ] = Math.floor( Math.random() * 1000 );
                        req.session.survey[ key ] = surveyRes.id;
                        req.session.save( function( err ) {
                            res.redirect( '/survey/' + key + '/2' );
                        } );
                    }, function( err ) {
                        res.redirect( '/survey/' + key + '/1' );
                    } );
                } else {
                    return res.redirect( '/survey/' + key + '/2' );
                }
            } else if( page > 1 && !req.session.survey ) {
                return res.redirect( '/survey/' + key + '/1' );
            }

            var survey = surveyTemplate.getSurvey( svy.version );

            survey.pages[ page - 2 ].fields.forEach( function( field, idx ) {
                if( field.type === 'gridselect' ) {
                    // 'gridselect' fields are a 'complex' field comprised of a number of sub-fields
                    for( var opt in field.options ) {
                        if( !req.body[ opt ] ) {
                            errors[ opt ] = 'This value is required.';
                        } else {
                            fields[ opt ] = req.body[ opt ];
                        }
                    }
                } else {
                    if( field.required && !req.body[ field.name ] ) {
                        errors[ field.name ] = 'This value is required.';
                    } else {
                        fields[ field.name ] = req.body[ field.name ];
                    }
                }
            } );

            if( objectLength( errors ) ) {
                req.flash( 'error', errors );
                req.flash( 'field', fields );
                res.redirect( '/survey/' + key + '/' + page );
            } else {
                self._sessionForm( req, fields );

                if( page - 1 === survey.pages.length ) {
                    var pageError = survey.pages.findIndex( function( page, pageIdx ) {
                        return page.fields.reduce( function( hasError, field, idx ) {
                            if( field.required && !req.session.form[ key ][ field.name ] ) {
                                errors[ field.name ] = 'This value is required.';
                                return hasError || true;
                            } else {
                                return hasError || false;
                            }
                        }, false );
                    } );

                    if( pageError > -1 ) {
                        req.flash( 'error', errors );
                        res.redirect( '/survey/' + key + '/' + ( pageError + 1 ) );
                    } else {
                        Survey.findOne( { key: key }, function( err, survey ) {
                            if( req.session.survey && req.session.survey[ key ] ) {
                                SurveyResponse.findOne( { _id: req.session.survey[ key ] } )
                                    .exec()
                                    .then( function( surveyResp ) {
                                        surveyResp.response = req.session.form[ key ];
                                        surveyResp.submitted = Date.now();
                                        surveyResp.save();
                                        delete req.session.survey[ key ];
                                        delete req.session.form[ key ];
                                        res.render( 'survey/done' );
                                    } );
                            } else {
                                var response = new SurveyResponse( {
                                    surveyId: survey.id,
                                    response: req.session.form[ key ]
                                } );

                                response.save();
                                delete req.session.form[ key ];
                                res.render( 'survey/done' );
                            }
                        } );
                    }
                } else {
                    res.redirect( '/survey/' + key + '/' + ( page + 1 ) );
                }
            }
        } );
    };

    this._sessionForm = function( req, page ) {
        var key = req.params.key;

        if( !req.session[ 'form' ] ) {
            req.session.form = {};
        }

        if( !req.session.form[ key ] ) {
            req.session.form[ key ] = {};
        }

        req.session.form[ key ] = extend( req.session.form[ key ], page );
    };
};

exports.setup = function( app ) {
    var surveys = new SurveyController();

    app.get( '/survey/:key/:page?', surveys.view );
    app.post( '/survey/:key/:page?', surveys.submit );
};
