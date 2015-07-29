var onHeaders = require( 'on-headers' ),
    passport = require( 'passport' ),
    LocalStrategy = require( 'passport-local' ).Strategy,
    config = require( '../config' ),
    Survey = require( '../models/survey' ),
    User = require( '../models/user' ),
    ForgotKey = require( '../models/forgot_key' );

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser( function( user, done ) {
    done( null, user.id );
} );

passport.deserializeUser( function( id, done ) {
    User.findById( id, function( err, user ) {
        done( err, user );
    } );
} );

// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use( new LocalStrategy( function( email, password, done ) {
    User.findOne( { email: email }, function( err, user ) {
        if( err )
            return done(err);

        if( !user )
            return done( null, false, { message: 'Invalid email address or password.' } );

        user.comparePassword( password, function( err, isMatch ) {
            if( err ) return done( err );

            if( isMatch ) {
                return done( null, user );
            } else {
                return done( null, false, { message: 'Invalid email address or password.' } );
            }
        } );
    } );
} ) );

var AuthController = function() {
    this.login = function( req, res ) {
        res.render( 'user/login', { csrfToken: req.csrfToken() } );
    };

    this.validate = function( req, res, next ) {
        passport.authenticate( 'local', function( err, user, info ) {
            if( err ) return next( err );

            if( !user ) {
                req.flash( 'error', info.message );
                req.flash( 'email', req.body.username );
                return res.redirect( '/login' );
            }

            if( !user.activated ) {
                res.mailer.send( 'registration', {
                    to: user.email,
                    key: user.activationKey,
                    subject: '[Responsive Pulse] Account activation required'
                }, function( err, info ) {
                    if (err) {
                        console.log( err );
                    }
                } );

                req.flash( 'error', 'Your account has not yet been verified. You should receive another email with activation instructions momentarily.' );
                return res.redirect( '/login' );
            }

            req.logIn( user, function( err ) {
                if( err ) {
                    return next( err );
                }

                return res.redirect( '/' );
            } );
        } )( req, res, next );
    };

    this.logout = function( req, res ) {
        req.logout();
        res.redirect( '/' );
    };

    this.signup = function( req, res ) {
        res.render( 'user/signup', { csrfToken: req.csrfToken() } );
    };

    this.account = function( req, res ) {
        res.locals.path = req.path;
        res.render( 'user/account', { csrfToken: req.csrfToken() } );
    };

    this.updateAccount = function( req, res ) {
        exports.updateUser( req.user, req.body, function( status ) {
            res.send( status );
        } );
    };

    this.register = function( req, res, next ) {
        // The 'email' field is named 'username' because that is what the
        // passport library requires to validate on req.logIn. We create
        // the user then pass them to the .validate method.

        var self = this,
            usr = new User( {
                email: req.body.username,
                password: req.body.password,
                roles: [ 'user' ],
                profile: {
                    name: req.body.name,
                    organization: req.body.company
                }
            } );

        // All Undercurrenters are automatically admins.
        if( req.body.username.match( /@undercurrent\.com$/i ) ) {
            usr.roles.push( 'admin' );
        }

        usr.save( function( err ) {
            if( err ) {
                for( var key in err.errors ) {
                    req.flash( 'error', err.errors[ key ].message );
                }

                res.redirect( '/signup' );
            } else {
                res.mailer.send( 'registration', {
                    to: req.body.username,
                    key: usr.activationKey,
                    subject: '[Responsive Pulse] Account activation required'
                }, function( err, info ) {
                    if (err) {
                        console.log( err );
                    }
                } );

                req.flash( 'success', 'Your account has been registered but needs to be verified. You should receive an email with activation instructions momentarily.' );
                res.redirect( '/login' );
            }
        } );
    };

    // This is a standard activation post-registration (user has set a password).
    this.signupActivation = function( req, res, next ) {
        var self = this;

        User.findOne( { email: req.query.email, activationKey: req.query.key }, function( err, usr ) {
            if( !usr ) {
                req.flash( 'error', 'That activation key has already been used or no such user is registered.' );
                res.redirect( '/login' );
                return;
            }

            usr.activated = true;

            usr.save( function( err ) {
                if( err ) {
                    for( var key in err.errors ) {
                        req.flash( 'error', err.errors[ key ].message );
                    }
                } else {
                    req.flash( 'success', 'Your account has been activated! Please sign in to continue.' );

                    res.mailer.send( 'activated', {
                        to: usr.email,
                        name: usr.profile && usr.profile.name ? usr.profile.name : null,
                        subject: '[Responsive Pulse] Your account is now activated'
                    }, function( err, info ) {
                        if (err) {
                            console.log( err );
                        }
                    } );
                }

                res.redirect( '/login' );
            } );
        } );
    };

    // This is an invite-only activation. The user has not set their own password yet.
    this.activate = function( req, res ) {
        User.findOne( { email: req.query.email, activationKey: req.query.key }, function( err, usr ) {
            if( !usr ) {
                req.flash( 'error', 'That activation key has already been used or no such user is registered.' );
                res.redirect( '/login' );
                return;
            }

            res.render( 'user/signup', {
                email: req.query.email,
                activationKey: req.query.key,
                csrfToken: req.csrfToken()
            } );
        } );
    };

    // This is step 2 of an invite-only activation. The user has not set their own password yet.
    this.completeActivation = function( req, res, next ) {
        var self = this;

        User.findOne( { email: req.body.username, activationKey: req.body.activationKey }, function( err, usr ) {
            if( !usr ) {
                req.flash( 'error', 'That activation key has already been used or no such user is registered.' );
                res.redirect( '/login' );
                return;
            }

            usr.password = req.body.password;
            usr.organization = req.body.company;
            usr.activated = true;

            usr.save( function( err ) {
                if( err ) {
                    for( var key in err.errors ) {
                        req.flash( 'error', err.errors[ key ].message );
                    }

                    res.redirect( '/activate?email=' + encodeURIComponent( req.body.username ) + '&key=' + req.body.activationKey );
                } else {
                    self.validate( req, res, next );
                }
            } );
        } );
    };

    this.forgot = function( req, res ) {
        res.render( 'user/forgot', { csrfToken: req.csrfToken() } );
    };

    this.sendReset = function( req, res ) {
        User.findOne( { email: req.body.email }, function( err, usr ) {
            if( !usr ) {
                req.flash( 'error', 'No registered user with that email address found.' );
                res.redirect( '/forgot' );
                return;
            }

            if( usr.activated === false ) {
                res.mailer.send( 'forgotpassword', {
                    to: usr.email,
                    key: usr.activationKey,
                    activated: false,
                    name: usr.profile && usr.profile.name ? usr.profile.name : null,
                    subject: '[Responsive Pulse] Set Your Password'
                }, function( err, info ) {
                    if (err) {
                        console.log( err );
                    }
                } );

                req.flash( 'success', 'A link to set your password has been sent. Please check your email.' );
                res.redirect( '/forgot' );
            } else {
                var forgot = new ForgotKey( { user: usr.id } );

                forgot.save( function( err ) {
                    res.mailer.send( 'forgotpassword', {
                        to: usr.email,
                        key: forgot.key,
                        activated: true,
                        name: usr.profile && usr.profile.name ? usr.profile.name : null,
                        subject: '[Responsive Pulse] Reset Password'
                    }, function( err, info ) {
                        if (err) {
                            console.log( err );
                        }
                    } );

                    req.flash( 'success', 'A link to reset your password has been sent. Please check your email.' );
                    res.redirect( '/forgot' );
                } );
            }
        } );
    };

    this.reset = function( req, res ) {
        ForgotKey.findOne( { key: req.params.key }, function( err, forgot ) {
            if( !forgot ) {
                req.flash( 'error', 'This reset key has already been used or expired.' );
                res.redirect( '/forgot' );
                return;
            }

            res.render( 'user/reset', { csrfToken: req.csrfToken() } );
        } );
    };

    this.doReset = function( req, res ) {
        ForgotKey.findOne( { key: req.params.key }, function( err, forgot ) {
            if( !forgot ) {
                req.flash( 'error', 'This reset key has already been used or expired.' );
                res.redirect( '/forgot' );
                return;
            }

            if( req.body.password !== req.body.validate_password ) {
                req.flash( 'error', 'The entered passwords do not match.' );
                res.redirect( '/reset_password/' + req.params.key );
                return;
            }

            User.findOne( { _id: forgot.user }, function( err, usr ) {
                usr.password = req.body.password;

                usr.save( function( err ) {
                    if( err ) {
                        for( var key in err.errors ) {
                            req.flash( 'error', err.errors[ key ].message );
                        }

                        res.redirect( '/reset_password/' + req.params.key );
                    } else {
                        forgot.remove();

                        req.flash( 'error', 'Your password has been reset. Please sign in to continue.' );
                        res.redirect( '/login' );
                    }
                } );
            } )
        } );
    };
};

// Authentication check middleware
exports.ensureAuthenticated = function( req, res, next ) {
    if( req.isAuthenticated() ) return next();

    res.redirect( '/login' );
};

// Permissions check middleware
exports.requiresRole = function( roles ) {
    return function( req, res, next ) {
        if( req.isAuthenticated() ) {
            var hasRole = false;

            if( roles instanceof Array ) {
                roles.forEach( function( role ) {
                    hasRole = hasRole || req.user.roles.indexOf( role ) > -1;
                } );
            } else {
                hasRole = req.user.roles.indexOf( roles ) > -1;
            }

            if( hasRole ) return next();

            req.flash( 'error', 'Restricted access.' );
            res.redirect( '/' );
        } else {
            req.flash( 'error', 'Please sign in to access this page.' );
            res.redirect( '/login' );
        }
    };
};

// Role validation
exports.canAccessSurvey = function( req, res, next ) {
    if( !req.isAuthenticated() || !req.params.key )
        return res.redirect( '/' );

    if( req.user.roles.indexOf( 'admin' ) > -1 ) {
        Survey.findOne( { key: req.params.key } ).populate( 'users.user' ).exec( function( err, survey ) {
            if( !survey ) {
                return res.redirect( '/404' );
            }

            req.survey = survey;
            next();
        } );
    } else {
        Survey.findOne( { key: req.params.key, 'users.user': req.user._id } ).populate( 'users.user' ).exec( function( err, survey ) {
            if( !survey ) {
                return res.redirect( '/404' );
            }

            req.survey = survey;
            next();
        } );
    }
};

// Update a user's profile
exports.updateUser = function( user, changes, done ) {
    var updates = [],
        errors = [],
        next = function( err ) {
            if( err ) errors.push( err );

            if( updates.length ) {
                updateHash[ updates.shift() ]();
            } else if( !errors.length ) {
                user.save( function( err ) {
                    if( !err ) {
                        done( { status: 'ok' } );
                    } else {
                        for( var key in err.errors ) {
                            errors.push( err.errors[ key ].message );
                        }

                        done( { status: 'err', errors: errors } );
                    }
                } );
            } else {
                done( { status: 'err', errors: errors } );
            }
        },
        updateHash = {
            'email': function() {
                user.email = changes.email;
                next();
            },
            'name': function() {
                user.profile.name = changes.name;
                user.markModified( 'profile' );
                next();
            },
            'organization': function() {
                user.profile.organization = changes.organization;
                user.markModified( 'profile' );
                next();
            },
            'password': function() {
                if( !changes.password.length ) return next();

                user.comparePassword( changes.password_old, function( err, isMatch ) {
                    if( isMatch ) {
                        user.password = changes.password;
                        next();
                    } else {
                        next( '"Old password" entered does not match your current password.' );
                    }
                } );
            }
        };

    for( var key in changes ) {
        if( key in updateHash ) updates.push( key );
    }

    next();
};

exports.setup = function( app ) {
    app.use( passport.initialize() );
    app.use( passport.session() );

    // Prevents Passport from flooding our session DB with empty sessions
    // https://github.com/jaredhanson/passport/issues/279
    app.use( function cleanupPassport( req, res, next ) {
        // hook me in right AFTER express-session
        onHeaders( res, function() {
            if( Object.keys( req.session.passport ).length === 0 ) {
                delete req.session.passport;
            }
        } );

        next();
    } );

    app.use( function( req, res, next ) {
        res.locals.user = req.user;
        next();
    } );

    var auth = new AuthController();

    app.get( '/login', auth.login );
    app.post( '/login', auth.validate );

    app.get( '/signup', auth.signup );
    app.post( '/signup', auth.register.bind( auth ) );

    app.get( '/forgot', auth.forgot );
    app.post( '/forgot', auth.sendReset.bind( auth ) );

    app.get( '/reset_password/:key', auth.reset );
    app.post( '/reset_password/:key', auth.doReset.bind( auth ) );

    // This is the activation path for users that were invited by someone else
    app.get( '/activate', auth.activate );
    app.post( '/activate', auth.completeActivation.bind( auth ) );

    // This is the typical activation for a standard signup
    app.get( '/reg_activate', auth.signupActivation );

    app.get( '/logout', auth.logout );

    app.get( '/account', auth.account );
    app.post( '/account', auth.updateAccount );
};
