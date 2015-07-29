var $ = require( 'jquery' );

module.exports = function() {
    var $spinner = $( '.spinner' ),
        $gradient = $( '.nav--gradient' ),
        states = {};

    function onChange() {
        var showSpinner = false;

        for( var key in states ) {
            if( states[ key ] )
                showSpinner = true;
        }

        $spinner[ showSpinner ? 'removeClass' : 'addClass' ]('hidden');
        $gradient[ showSpinner ? 'addClass' : 'removeClass' ]('loading');
    }

    this.loading = function( key ) {
        states[ key ] = true;
        onChange();
    };

    this.done = function( key ) {
        delete states[ key ];
        onChange();
    };
};
