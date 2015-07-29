var $ = require( 'jquery' ),
    d3 = require( '../../vendor/d3' );

module.exports = function( charts, data, responses, colors ) {
    $( '.number.incomplete' ).each( function() {
        var $number = $( this );

        var chart = function() {
            $number.html( data.incompleteCount );
        };

        charts.push( [ chart, this ] );
        $('.data-placeholder--box', this).remove();
    } );
};