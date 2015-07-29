/**
 * Compile JavaScript with Browserify.
 *
 * ---------------------------------------------------------------
 *
 * Compiles the js bundle from `src/js` into a single file and places
 * them into `build/js` directory.
 *
 */
var path = require( 'path' );
var source = require( 'vinyl-source-stream' );
var buffer = require( 'vinyl-buffer' );
var watchify = require( 'watchify' );
var browserify = require( 'browserify' );

module.exports = function( gulp, plugins, path ) {
    var errorHandler = function( err ) {
        plugins.notify.onError( {
            message: "<%= error.message %>"
        } ).apply( this, arguments );

        this.emit( 'end' );
    };

    var bundles = [
        {
            entryPoint: './app.js',
            require: [],
            output: 'bundle.js',
            external: [ 'jquery' ]
        },
        {
            entryPoint: './admin.js',
            require: [],
            output: 'admin.js',
            external: [ 'jquery' ]
        },
        {
            entryPoint: './form.js',
            require: [],
            output: 'form.js',
            external: [ 'jquery' ]
        },
        {
            entryPoint: './shared.js',
            require: [ 'jquery' ],
            output: 'shared.js',
            external: []
        }
    ];

    var args = watchify.args;
    args.debug = true;
    args.basedir = path.resolve( __dirname, '../client/' );
    args.fullPaths = false;
    args.insertGlobals = true;

    var bundlers = {};

    bundles.forEach( function( b ) {
        var bundler = browserify( b.entryPoint, args );
        // add any other browserify options or transforms here
        bundler.transform( 'brfs' );
        bundler.transform( 'bulkify' );

        if( b.require ) {
            b.require.forEach( function( r ) {
                bundler.require( r );
            } );
        }

        if( b.external ) {
            b.external.forEach( function( e ) {
                bundler.external( e );
            } );
        }

        bundlers[ b.output ] = bundler;
    } );

    gulp.task( 'bundle:dev', function() {
        bundles.forEach( function( b ) {
            bundle( b )();
        } );
    } ); // so you can run `gulp bundle:dev` to build the file
    gulp.task( 'bundle:watch', function() {
        bundles.forEach( function( b ) {
            var watcher = watchify( bundlers[ b.output ] );
            watcher.on( 'update', bundle( b ) ); // on any dep update, runs the bundler
        } );
    } );

    function bundle( b ) {
        return function() {
            bundlers[ b.output ].bundle()
              // log errors if they happen
              .on( 'error', errorHandler )
              .pipe( source( b.output ) )
              // optional, remove if you dont want sourcemaps
                .pipe( buffer() )
                .pipe( plugins.sourcemaps.init( { loadMaps: true } ) ) // loads map from browserify file
                .pipe( plugins.sourcemaps.write( './' ) ) // writes .map file
              //
              .pipe( gulp.dest( './public/js' ) )
              .pipe( plugins.notify( { message: b.output + ': browserify bundler task complete', onLast: true } ) );
        };
    }
};
