var md5 = require( 'md5' ),
    Survey = require( '../models/survey' ),
    auth = require( './auth' ),
    config = require( '../config' );

var DashboardController = function() {
    this.index = function( req, res ) {
        if( req.user.roles.indexOf( 'admin' ) > -1 ) {
            this.indexView( req, res, true );
        } else {
            this.indexView( req, res, false );
        }
    };

    this.indexView = function( req, res, isAdmin ) {
        var showAll = !!parseInt( req.query.all || 0 ),
            page = parseInt( req.query.page || 1 ),
            search = req.query.q || null,
            sortKey = req.query.sort || 'title',
            sortDirection = req.query.dir || 'asc';

        var query;
        if( isAdmin ) {
            query = {};
        } else {
            query = { users: { $elemMatch: { user: req.user._id } } };
        }

        if( isAdmin ) {
            if( !showAll ) {
                query = { users: { $not: { $elemMatch: {
                    user: req.user._id,
                    active: false
                } } } };
            }
        } else if( !showAll ) {
            query.users.$elemMatch.active = true;
        }

        if (search) {
            var searchQuery = new RegExp( search, 'i' );
            query.title = searchQuery;
        }

        if(sortKey == 'title') {
            var sortQueryKey = 'title_lower';
        } else {
            var sortQueryKey = sortKey;
        }

        var sortObj = {};
        sortObj[sortQueryKey] = sortDirection;

        Survey.paginate( query, { page: page, limit: 10 }, function( err, surveys, pageCount, itemCount ) {
            var totalResponses = 0;

            surveys = surveys.map( function( survey ) {
                var s = survey.toJSON();

                // tally all responses
                totalResponses += survey.responseCount;

                if (isAdmin)  {
                    s.username = md5.digest_s( s.surveyId + config.authSecret ).substring( 0, 6 );
                }

                return s;
            } );

            res.locals.classes.push( 'dashboard' );
            res.render( 'user/dashboard', {
                baseUrl: config.baseUrl,
                surveyList: surveys,
                totalResponses: totalResponses,
                showAll: showAll,
                baseUrl: config.baseUrl,
                totalPages: pageCount,
                page: page,
                q: search,
                sortKey: sortKey,
                sortDirection: sortDirection
            } );
        }, {
            populate: 'creator',
            sortBy: sortObj
        } );
    };

    this.newSurvey = function( req, res ) {
        var formData = req.flash( 'form' );

        res.render( 'survey/new', {
            csrfToken: req.csrfToken(),
            industries: Survey.industries(),
            orgSizes: Survey.orgSizes(),
            form: formData.length ? formData[0] : {}
        } );
    };

    this.create = function( req, res ) {
        var title = req.body[ 'title' ] || null,
            lowerTitle = title ? title.toLowerCase() : null;

        var dupeCheck = Survey.count( { title_lower: lowerTitle, users: { $elemMatch: { user: req.user._id } } }, function( err, count ) {
            if (count === 0) {
                var freshSurvey = new Survey( {
                    title: title,
                    title_lower: lowerTitle,
                    orgSize: req.body.orgSize,
                    orgAge: req.body.orgAge,
                    industry: req.body.industry,
                    orgLeader: req.body.orgLeader,
                    orgLeaderRole: req.body.orgLeaderRole,
                    welcomeMessage: req.body.welcomeMessage,
                    version: config.surveyVersion
                } );

                freshSurvey.users.push( {
                    user: req.user._id,
                    permissions: [ 'creator', 'owner' ]
                } );

                freshSurvey.save( function( err ) {
                    if( !err ) {
                        res.redirect( '/dashboard' );
                    } else {
                        req.flash( 'error', 'There were some errors with your responses below. Please correct them and resubmit the form.' );
                        req.flash( 'fieldErrors', err.errors );
                        req.flash( 'form', req.body );
                        res.redirect( '/dashboard/new' );
                    }
                } );
            } else {
                req.flash( 'error', 'That survey name is already in use.' );
                res.redirect( '/dashboard/new' );
            }
        });
    };

    this.toggleInactive = function( req, res ) {
        var query = { key: req.param( 'key' ) };

        if( !req.user.hasRole( 'admin' ) ) {
            query[ 'users.user' ] = req.user.id;
        }

        Survey.findOne( query, function( err, svy ) {
            if( svy ) {
                if( req.user.hasRole( 'admin' ) &&
                    !svy.users.filter( function( user ) { return user.user == req.user.id } ).length ) {
                    svy.users.push( {
                        user: req.user.id,
                        permissions: 'collaborator',
                        active: false
                    } );
                } else {
                    svy.users = svy.users.map( function( user ) {
                        if( user.user == req.user.id ) {
                            user.active = !user.active;
                        }

                        return user;
                    } );
                }

                svy.save( function( err ) {
                    res.redirect( '/dashboard?all=' + req.param( 'all', 0 ) );
                } );
            } else {
                res.redirect( '/dashboard' );
            }
        } );
    };

    this.toggleMultipleActive = function( req, res ) {
        var query = {
            'key': { $in: JSON.parse( req.param( 'keys' ) ) }
        };


        if( !req.user.hasRole( 'admin' ) ) {
            query[ 'users.user' ] = req.user.id;
        }

        var setActive = ( req.param( 'val' ) == 1 ? true : false );

        Survey.find( query, function( err, surveys ) {
            var updateActiveState = function() {
                if( !surveys.length ) {
                    return res.redirect( '/dashboard?all=' + req.param( 'all', 0 ) );
                }

                var svy = surveys.shift();
                if( req.user.hasRole( 'admin' ) &&
                    !svy.users.filter( function( user ) { return user.user == req.user.id } ).length ) {
                    svy.users.push( {
                        user: req.user.id,
                        permissions: 'collaborator',
                        active: setActive
                    } );
                } else {
                    svy.users = svy.users.map( function( user ) {
                        if( user.user == req.user.id ) {
                            user.active = setActive;
                        }

                        return user;
                    } );
                }

                svy.save( function() {
                    process.nextTick( updateActiveState );
                } );
            };

            updateActiveState();
        } );
    };
};

exports.setup = function( app ) {
    var dashboard = new DashboardController();

    app.get( '/dashboard', auth.requiresRole( [ 'admin', 'user' ] ), dashboard.index.bind( dashboard ) );

    app.get( '/dashboard/inactive/:key', auth.requiresRole( [ 'admin', 'user' ] ), dashboard.toggleInactive );
    app.get( '/dashboard/multiple-active', auth.requiresRole( [ 'admin', 'user' ] ), dashboard.toggleMultipleActive );

    app.get( '/dashboard/new', auth.requiresRole( [ 'admin', 'user' ] ), dashboard.newSurvey );
    app.post( '/dashboard/new', auth.requiresRole( [ 'admin', 'user' ] ), dashboard.create );
};
