var mongoose = require( 'mongoose' ),
    random = require( '../lib/random' ),
    Schema = mongoose.Schema;

var forgotKeySchema = new Schema( {
    user: Schema.Types.ObjectId,
    created: {
        type: Number,
        default: Date.now
    },
    key: {
        type: String,
        default: function() {
            return random.string( 24, random.defaultChars );
        }
    }
} );

module.exports = mongoose.model( 'ForgotKey', forgotKeySchema );
