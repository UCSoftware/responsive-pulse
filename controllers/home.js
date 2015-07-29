var HomeController = function() {
    this.index = function( req, res ) {
        if( req.isAuthenticated() )
            return res.redirect( '/dashboard' );

        res.render( 'landing' );
    };
};

exports.setup = function( app ) {
    var home = new HomeController();

    app.get( '/', home.index );
};
