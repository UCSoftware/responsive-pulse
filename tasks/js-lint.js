module.exports = function( gulp, plugins ) {
    gulp.task( 'js-lint', function() {
      gulp.src( [
        'controllers/**/*.js',
        'lib/**/*.js',
        'models/**/*.js'
      ] ).pipe( plugins.jshint() );
    } );
};
