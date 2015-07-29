var User = require( '../models/user' ),
    Survey = require( '../models/survey' ),
    SurveyResponse = require( '../models/survey_response' ),
    auth = require( './auth' );

var AdminController = function() {
    this.users = function( req, res ) {
        var o = {};
        o.map = function() { emit( 'score', this.score ); };
        o.reduce = function( k, scores ) {
            var sum = 0, count = 0;
            for( var i = 0; i < scores.length; i++ ) {
                if( scores[ i ] > 0 ) {
                    sum += scores[ i ];
                    count++;
                }
            };
            return sum / count;
        }

        Survey.mapReduce( o, function( err, results ) {
            User.find( {}, function( err, users ) {
                SurveyResponse.count( {}, function( err, count ) {
                    var totals = {
                        users: users.length,
                        responses: count,
                        score: results[ 0 ].value
                    };

                    res.render( 'admin/users', {
                        userList: users,
                        totals: totals
                    } );
                } );
            } );
        } );
    };

    this.viewUser = function( req, res ) {
        User.findOne( { _id: req.param( 'id' ) }, function( err, usr ) {
            res.render( 'admin/account', {
                accountUser: usr,
                csrfToken: req.csrfToken()
            } );
        } );
    };

    this.updateUser = function( req, res ) {
        User.findOne( { _id: req.param( 'id' ) }, function( err, usr ) {
            auth.updateUser( usr, req.body, function( status ) {
                usr.activated = parseInt( req.body.activated ) === 1 ? true : false;

                if( req.body.roles && !usr.hasRole( req.body.roles ) && usr.validRole( req.body.roles ) ) {
                    usr.roles = [ req.body.roles ];
                }

                usr.save();

                res.send( status );
            } );
        } );
    };
};

exports.setup = function( app ) {
    var admin = new AdminController();

    app.get( '/admin/users', auth.requiresRole( 'admin' ), admin.users );

    app.get( '/admin/user/:id', auth.requiresRole( 'admin' ), admin.viewUser );
    app.post( '/admin/user/:id', auth.requiresRole( 'admin' ), admin.updateUser );
};
