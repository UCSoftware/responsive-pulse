var Survey = require( '../models/survey' ),
    User = require( '../models/user' ),
    auth = require( './auth' );

var SurveyShareController = function() {
    this.index = function( req, res ) {
        // check if user has permission to view this list (i.e., can also add sharers)
        if( req.user.roles.indexOf( 'admin' ) > -1 ) {
            var matchSurvey = { key: req.param( 'key' ) };
        } else {
            var matchSurvey = {
                key: req.param( 'key' ),
                users: { $elemMatch: {
                    id: req.user.id,
                    permissions: 'owner'
                } }
            };
        }

        Survey.findOne( matchSurvey, function( err, survey ) {
            if( !survey )
                return res.status( 404 ).send( { error: 'Survey not found.' } );

            res.send( survey.users );
        } );
    };

    this._parseEmail = function( email ) {
        var parsed = email.match( /(.+) <([^>]+)>/ ),
            result = {
                email: null,
                name: null
            };
        if( parsed ) {
            result.email = parsed[ 2 ];
            result.name = parsed[ 1 ];
        } else {
            result.email = email;
        }

        return result;
    };

    this.update = function( req, res ) {
        var self = this;

        if( req.user.roles.indexOf( 'admin' ) > -1 ) {
            var matchSurvey = { key: req.params.key };
        } else {
            var matchSurvey = {
                key: req.params.key,
                users: { $elemMatch: {
                    user: req.user._id,
                    permissions: 'owner'
                } }
            };
        }

        Survey.findOne( matchSurvey, function( err, survey ) {
            if( !survey )
                return res.status( 404 ).send( { error: 'Survey not found.' } );

            var userPerms = ( survey.users.filter( function( user ) {
                    return user.user == req.user.id;
                } ) || [ { permissions: [] } ] )[ 0 ],
                changes = {
                    add: [],
                    remove: []
                },
                updated = {
                    add: [],
                    remove: [],
                    unchanged: []
                },
                complete = function() {
                    var changeCount = changes.add.length + changes.remove.length,
                        updateCount = updated.add.length + updated.remove.length + updated.unchanged.length;
                    if( changeCount === updateCount ) {
                        res.send( updated );
                    }
                };

            if( userPerms && userPerms[ 'permissions' ] ) {
                userPerms = userPerms.permissions;
            } else {
                userPerms = [];
            }

            try {
                changes.add = JSON.parse( req.body.add );
            } catch( e ) {}

            try {
                changes.remove = JSON.parse( req.body.remove );
            } catch( e ) {}

            var added = [],
                addComplete = function( user ) {
                    updated.add.push( user );

                    if( updated.add.length === changes.add.length ) {
                        survey.save();
                        complete();
                    }
                },
                unchangedComplete = function( user ) {
                    updated.unchanged.push( user );
                    complete();
                },
                removeComplete = function( user ) {
                    updated.remove.push( user );

                    if( updated.remove.length === changes.remove.length ) {
                        survey.markModified( 'users' );
                        survey.save();
                        complete();
                    }
                };

            if( changes.add.length ) {
                changes.add.forEach( function( user ) {
                    // { email: '...', permissions: [ '...' ] }
                    user.email = self._parseEmail( user.email );

                    // Only owners & admins can assign owners
                    if( ( user.permissions.indexOf( 'owner' ) > -1 || user.permissions.indexOf( 'creator' ) > -1 ) &&
                        req.user.roles.indexOf( 'admin' ) === -1 &&
                        userPerms.indexOf( 'owner' ) === -1 ) {
                        user.permissions = user.permissions.filter( function( perm ) {
                            return perm !== 'owner' && perm !== 'creator';
                        } );
                    }

                    if( !user.permissions.length ) {
                        return unchangedComplete( {
                            email: user.email.email
                        } );
                    }

                    // find user
                    // if user ->
                    //   add user objectid + role to survey.users list
                    //   notify user via email
                    // else if no user ->
                    //   create new user
                    //   email user
                    User.findOne( { email: user.email.email }, function( err, siteUser ) {
                        if( !siteUser ) {
                            var newUser = new User( {
                                email: user.email.email,
                                password: '!' + ( Math.random() * 1000000000 ) + Date.now(),
                                roles: [ 'user' ]
                            } );

                            if( user.email.name ) {
                                newUser.profile.name = user.email.name;
                            }

                            newUser.validate( function( err ) {
                                if( err ) {
                                    return addComplete( {} );
                                }

                                newUser.save( function( err ) {
                                    survey.users.push( {
                                        user: newUser.id,
                                        permissions: user.permissions
                                    } );

                                    addComplete( {
                                        name: user.email.name,
                                        email: user.email.email,
                                        permissions: user.permissions
                                    } );

                                    var toString = user.email.email;
                                    if( user.email.name ) {
                                        toString = user.email.name + ' <' + toString + '>';
                                    }

                                    res.mailer.send( 'surveysharednoaccount', {
                                        to: toString,
                                        email: user.email.email,
                                        inviteeKey: newUser.activationKey,
                                        inviter: req.user.profile && req.user.profile.name ? req.user.profile.name : 'Somebody',
                                        organization: req.user.profile && req.user.profile.organization ? req.user.profile.organization : null,
                                        role: user.permissions[0],
                                        survey: survey,
                                        subject: '[Responsive Pulse] Survey \'' + survey.title + '\' shared with you!'
                                    }, function( err, info ) {
                                        if (err) {
                                            console.log( err );
                                        }
                                    } );
                                } );
                            } );
                        } else {
                            var alreadyShared = false;

                            // remove user if already added
                            survey.users = survey.users.filter( function( surveyUser ) {
                                if( surveyUser.user == siteUser.id )
                                    alreadyShared = true;

                                return surveyUser.user != siteUser.id;
                            } );

                            survey.users.push( {
                                user: siteUser.id,
                                permissions: user.permissions
                            } );

                            addComplete( {
                                name: siteUser.profile ? siteUser.profile.name : '',
                                email: siteUser.email,
                                permissions: user.permissions
                            } );

                            if( !alreadyShared ) {
                                var toString = siteUser.email;
                                if( siteUser.profile.name ) {
                                    toString = siteUser.profile.name + ' <' + toString + '>';
                                }

                                res.mailer.send( 'surveysharedhasaccount', {
                                    to: toString,
                                    invitee: siteUser.profile ? siteUser.profile.name : null,
                                    inviter: req.user.profile && req.user.profile.name ? req.user.profile.name : 'Somebody',
                                    role: user.permissions[0],
                                    survey: survey,
                                    subject: '[Responsive Pulse] Survey \'' + survey.title + '\' shared with you!'
                                }, function( err, info ) {
                                    if (err) {
                                        console.log( err );
                                    }
                                } );
                            }
                        }
                    } );
                } );
            }

            if( changes.remove.length ) {
                changes.remove.forEach( function( user ) {
                    // { email: '...' }

                    User.findOne( { email: user.email }, function( err, siteUser ) {
                        if( siteUser ) {
                            survey.users = survey.users.filter( function( surveyUser ) {
                                return surveyUser.user != siteUser.id;
                            } );

                            removeComplete( {
                                name: siteUser.profile ? siteUser.profile.name : '',
                                email: siteUser.email,
                                permissions: user.permissions
                            } );
                        } else {
                            unchangedComplete( {
                                email: user.email
                            } );
                        }
                    } );
                } );
            }
        } );
    }.bind( this );
};

exports.setup = function( app ) {
    var share = new SurveyShareController();

    app.get( '/share/:key', auth.requiresRole( [ 'admin', 'user' ] ), share.index );
    app.post( '/share/:key', auth.requiresRole( [ 'admin', 'user' ] ), share.update );
};
