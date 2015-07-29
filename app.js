var extend = require( 'util' )._extend,
    express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    cookieParser = require( 'cookie-parser' ),
    csv = require( 'express-csv' ),
    session = require( 'express-session' ),
    flash = require( 'express-flash' ),
    compression = require( 'compression' ),
    mongoose = require( 'mongoose' ),
    nodemailer = require( 'nodemailer' ),
    htmlToText = require( 'nodemailer-html-to-text' ).htmlToText,
    sesTransport = require( 'nodemailer-ses-transport' ),
    MongoStore = require( 'express-session-mongo' ),
    csrf = require( 'csurf' ),
    config = require( './config' ),
    routeClass = require( './lib/route_class' ),
    emailHash = require( './lib/email_hash' ),
    surveyTemplate = require( './lib/survey_template' ),
    path = require('path'),
    templatesDir = path.resolve(__dirname, '.', 'views/email'),
    emailTemplates = require('email-templates'),
    nodeSass = require('node-sass'),
    juice = require('juice2'),
    app = express();

if( !surveyTemplate.validateCurrentSurvey() ) {
    process.exit( 1 );
}

app.set( 'views', __dirname + '/views' );
app.locals.basedir = app.get( 'views' );
app.set( 'view engine', 'jade' );
app.enable( 'trust proxy' );
app.locals.moment = require('moment');

app.use( session( {
    secret: config.session.secret,
    saveUninitialized: true,
    resave: true,
    store: new MongoStore( { ip: config.db.ip, port: config.db.port, db: config.db.database } )
} ) );
app.use( flash() );

if( !config.env.production ) {
    app.use( require( 'morgan' )( 'combined' ) );
}

app.use( cookieParser() );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( compression() );
app.use( express.static( __dirname + '/public' ) );
app.use( routeClass() );
app.use( emailHash() );

app.use( csrf() );

// Mailer
var transporter = nodemailer.createTransport( sesTransport( config.email ) );
transporter.use( 'compile', htmlToText( {} ) );
app.use( function( req, res, next ) {
    res.mailer = {
        send: function( templateName, locals, callback ) {
            emailTemplates(templatesDir, function( err, template ) {
                if( err ) {
                    console.log( err );
                } else {
                    template( templateName, extend( { baseUrl: config.baseUrl }, locals ), function( err, html, text ) {
                        juice.juiceContent( html, { url: config.baseUrl, preserveMediaQueries: true }, function( err, html ) {
                            transporter.sendMail( extend( {
                                from: config.email.from,
                                html: html
                            }, locals ), callback || function(){} );
                        });
                    } );
                }
            } );
        }
    };

    next();
} );

// CSRF error handler
app.use( function( err, req, res, next ) {
    if( err.code !== 'EBADCSRFTOKEN' ) return next( err );

    // handle CSRF token errors here
    res.status( 403 );
    var errorValue = 'Session has expired or the form has been tampered with.';

    if( req.get( 'Content-Type' ) === 'application/json' )
        res.send( { status: 'err', error: [ errorValue ] } )
    else
        res.send( errorValue );
} );

// Connect to the MongoDB database
mongoose.connect( config.db.url );

// Setup routes and controllers
[
    'auth',
    'dashboard',
    'export',
    'survey',
    'survey_data',
    'survey_share',
    'home',
    'about',
    'overview',
    'admin'
].map( function( controllerName ) {
    var controller = require( './controllers/' + controllerName );
    controller.setup( app );
} );

// Start server
app.listen( config.server.port, config.server.ip );
console.log( 'Server started, listening on', config.server.ip + ':' + config.server.port );

// HTTP Error Handling
app.use(function(req, res, next){
    res.status( 404 );

    // respond with html page
    if( req.accepts( 'html' ) ) {
        res.render( '404', { url: req.url } );
        return;
    }

    // respond with json
    if( req.accepts( 'json' ) ) {
        res.send( { error: 'Not found' } );
        return;
    }

    // default to plain-text. send()
    res.type( 'txt' ).send( '404 Page Not Found' );
});
