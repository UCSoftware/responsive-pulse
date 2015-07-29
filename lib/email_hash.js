var crypto = require( 'crypto' );

module.exports = function() {
    return function( req, res, next ) {
        // returns the current user's email address as an md5 hash
        res.locals.emailHash = function() {
            if( req.user ) {
                var md5 = crypto.createHash( 'md5' );
                md5.update( req.user.email.toLowerCase().trim() );

                return md5.digest( 'hex' );
            }

            return '';
        };

        next();
    };
};
