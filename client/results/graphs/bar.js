var $ = require( 'jquery' ),
    d3 = require( '../../vendor/d3' ),
    bar = require( '../../graphs/bar' );

module.exports = function( charts, data, responses, colors ) {
    $( '.chart.bar[data-col]' ).each( function() {
        var width = $( this ).width(),
            height = $( this ).data( 'height' ) || 200,
            col = $( this ).data( 'col' ),
            margins = ( $( this ).data( 'margins' ) || '' ).split( ',' ),
            barData = responses.dimension( function( d ) {
                return d[ col ];
            } ),
            barData2 = responses.dimension( function( d ) {
                return d[ col ];
            } );

        var chart = bar( width, height )
                .dimension( barData )
                .altDimension( barData2 )
                .color( colors[ 'graph-a' ], colors[ 'graph-a' ] );
        chart.margins.apply( chart, margins );

        charts.push( [ chart, this ] );
        $('.data-placeholder--box', this).remove();
    } );
};
