var $ = require( 'jquery' ),
    d3 = require( '../../vendor/d3' );

module.exports = function( charts, data, responses, colors ) {
    $( '.number.percentile' ).each( function() {
        var $number = $( this );

        var postfix = [ 'th', 'st', 'nd', 'rd' ];

        var chart = function( _, filters ) {
            // filter by distance from CEO (d['management_layers'])
            var filterData = responses.dimension( function( d ) { return d[ 'management_layers' ]; } ),
                filterNum = filterData.group().all().reduce( function( pV, cV ) { return pV + cV.value; }, 0 );

            if( filterNum < data.responses.length || filters.length ) {
                $number.addClass( 'is-hidden' );
            } else {
                $number.removeClass( 'is-hidden' );
            }

            filterData.dispose();
        };

        $number.addClass( 'is-hidden' );
        $.getJSON( '/view/' + data.key + '/percentile.json', function( pct ) {
            var percentile = Math.round( pct.percentile ),
                lastDigit = parseInt( percentile.toString().slice( -1 ) );

            $number.removeClass( 'is-hidden' ).html( percentile + ( postfix[ lastDigit ] || postfix[ 0 ] ) + ' percentile globally' );
        } );

        charts.push( [ chart, this ] );
    } );
};