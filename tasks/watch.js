module.exports = function( gulp, plugins ) {
    gulp.task( 'watch:styles', function() {
        gulp.watch( 'sass/**/*.scss', [ 'scss-lint', 'styles' ] );
    } );

    gulp.task( 'watch:js-lint', function() {
        gulp.watch( [
            'controllers/**/*.js',
            'lib/**/*.js',
            'models/**/*.js'
        ], [ 'js-lint' ] );
    } );

    gulp.task( 'watch', [
        'watch:styles',
        'watch:js-lint',
        'bundle:watch'
    ] );
};
