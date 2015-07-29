var extend = require( 'util' )._extend;

module.exports = function( gulp, plugins, path ) {
    var options = {
        script: 'app.js',
        ext: [ 'js' ],
        ignore: [
            path.resolve( __dirname, '../client/**' ),
            path.resolve( __dirname, '../public/**' ),
            path.resolve( __dirname, '../tasks/**/*' )
        ]
    };

    gulp.task( 'serve:dev', function () {
        plugins.nodemon( extend( options, { env: { 'NODE_ENV': 'development' } } ) );
    } );

    gulp.task( 'serve:stage', function () {
        plugins.nodemon( extend( options, { env: { 'NODE_ENV': 'staging' } } ) );
    } );

    gulp.task( 'serve:prod', function () {
        plugins.nodemon( extend( options, { env: { 'NODE_ENV': 'production' } } ) );
    } );
};
