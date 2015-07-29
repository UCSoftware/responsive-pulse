var mongoose = require( 'mongoose' ),
    User = require( '../models/user' ),
    config = require( '../config' );

// Connect to the MongoDB database
mongoose.connect( config.db.url );

exports.up = function(next){
    // Seed a user
    var user = new User( {
        email: 'global@test.io',
        password: '12345678',
        roles: [ 'admin' ]
    } );

    user.save( function(err) {
        if( err ) {
            console.log( err );
        } else {
            console.log( 'user: ' + user.email + ' saved.' );
        }

        next();
    } );
};

exports.down = function(next){
    User.findOneAndRemove( { email: 'global@test.io' }, function() {
        next()
    } );
};
