module.exports = function() {
    return function( req, res, next ) {
        var classes = req.path.toLowerCase()
            .replace( /^\/([^\/]+)\/?$/, '$1' ).trim()
            .replace( /[^A-Za-z0-9_\-\/]+/g, '-' )
            .replace( /[-]{2,}/g, '-' )
            .split( '/' );

        res.locals.classes = classes
            .filter( function( cls ) {
                return cls.length > 1;
            } )
            .map( function( cls ) {
                if( cls.match( /^\d/ ) )
                    return '_' + cls;

                return cls;
            } );

        // usage:
        // is(['/view', 'active']) -> returns: 'active'
        // is(['/view', 'active'], [/toggle$/, 'thing']) -> if url contains /view and ends with toggle returns: 'active thing'
        res.locals.is = function() {
            var classes = [];
            Array.prototype.slice.call( arguments, 0 ).forEach( function( itm ) {
                if( typeof itm[ 0 ] === 'object' )
                    var rxitm = itm[ 0 ];
                else
                    var rxitm = new RegExp( itm[ 0 ].replace( /\//g, '\\/' ).replace( /([.?+*^$()|])/g, '[$1]' ), 'i' );
                if( req.path.match( rxitm ) )
                    classes.push( itm[ 1 ] );
            } );

            return classes.join( ' ' );
        };

        next();
    };
};
