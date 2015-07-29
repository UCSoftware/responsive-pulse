var $ = require( 'jquery' ),
    d3 = require( '../../vendor/d3' ),
    line = require( '../../graphs/line' );

module.exports = function( charts, data, responses, colors ) {
    $( '.chart.line[data-cols]' ).each( function() {
        var width = $( this ).width(),
            height = 200,
            col = $( this ).data( 'col' ),
            lineData = responses.dimension( function( d ) {
                return d[ col ];
            } ),
            lineData2 = responses.dimension( function( d ) {
                return d[ col ];
            } );

        var chart = graphs.line( width, height )
                .dimension( lineData )
                .altDimension( lineData2 )
                .color( colors[ 'graph-a' ], colors[ 'graph-a' ] );

        charts.push( [ chart, this ] );
    } );
};
