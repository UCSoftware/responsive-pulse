var mongoose = require( 'mongoose' ),
    MongooseError = require( 'mongoose/lib/error' ),
    bcrypt = require( 'bcrypt' ),
    uniqueValidator = require( 'mongoose-unique-validator' ),
    random = require( '../lib/random' ),
    Schema = mongoose.Schema,
    SALT_WORK_FACTOR = 10;

var validateEmail = function( email ) {
    var re = /^[^@]*@.+(\.\w{2,})+$/;
    return re.test( email );
};

var validatePassword = function( password ) {
    return password.length >= 8;
};

var userSchema = mongoose.Schema( {
    email: {
        type: String,
        required: 'Email address is required.',
        unique: true,
        validate: [ validateEmail, 'Please enter a valid email address.' ]
    },
    password: {
        type: String,
        required: 'Please enter a password.',
        validate: [ validatePassword, 'Passwords must be at least 8 characters long.' ]
    },
    roles: [ String ],
    profile: {
        type: Schema.Types.Mixed,
        default: {}
    },
    activated: {
        type: Boolean,
        default: false
    },
    activationKey: String
} );

// Validate unique emails
userSchema.plugin( uniqueValidator, { message: 'The email address you entered is already in use.' } );

// Bcrypt middleware
userSchema.pre( 'save', function( next, done ) {
    var user = this;

    if( user.isModified( 'password' ) ) {
        bcrypt.genSalt( SALT_WORK_FACTOR, function( err, salt ) {
            if( err ) return next( err );

            bcrypt.hash( user.password, salt, function( err, hash ) {
                if( err ) return next( err );
                user.password = hash;
                next();
            } );
        } );
    } else {
        next();
    }
} );

userSchema.pre( 'save', function( next, done ) {
    var user = this;

    if( user.isNew || user.isModified( 'activated' ) ) {
        if( !user.activated ) {
            user.activationKey = random.string( 24, random.defaultChars );
        } else {
            user.activationKey = null;
        }
    }

    next();
} );

// Role validation
userSchema.method( 'hasRole', function( role ) {
    return this.roles.indexOf( role ) > -1;
} );

userSchema.method( 'validRole', function( role ) {
    return [ 'user', 'admin' ].indexOf( role ) > -1;
} );

// Password verification
userSchema.method( 'comparePassword', function( candidatePassword, cb ) {
    bcrypt.compare( candidatePassword, this.password, function( err, isMatch ) {
        if( err ) return cb( err );
        cb( null, isMatch );
    });
} );

module.exports = mongoose.model( 'User', userSchema );
