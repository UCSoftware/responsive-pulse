var AboutController = function() {
    this.index = function( req, res ) {
        res.render( 'landing' );
    };

    this.terms = function( req, res ) {
        res.render( 'terms' );
    };
};

exports.setup = function( app ) {
    var about = new AboutController();

    app.get( '/about', about.index );
    app.get( '/terms', about.terms );
};
