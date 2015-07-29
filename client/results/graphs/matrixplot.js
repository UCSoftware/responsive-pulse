var $ = require( 'jquery' ),
    d3 = require( '../../vendor/d3' ),
    matrixplot = require( '../../graphs/matrixplot' );

module.exports = function( charts, data, responses, colors ) {
    $( '.chart.matrixplot' ).each( function() {
        var width = $( this ).width(),
            height = $( this ).data( 'height' ) || width,
            colX = $( this ).data( 'col-x' ).toLowerCase(),
            colXValues = $( this ).data( 'x-values' ).split( ',' ),
            colY = $( this ).data( 'col-y' ).toLowerCase(),
            colYValues = $( this ).data( 'y-values' ).split( ',' ),
            plotData = responses.dimension( function( d ) {
                    return [ ( d[ colX ] || '' ).toLowerCase(), ( d[ colY ] || '' ).toLowerCase() ];
                } ),
            chart = matrixplot( width, height, {
                    xLabels: $( this ).data( 'x-labels' ).split( ',' ),
                    xValues: colXValues,
                    yLabels: $( this ).data( 'y-labels' ).split( ',' ),
                    yValues: colYValues
                } )
                .color( colors[ 'graph-a' ], colors[ 'graph-a' ] )
                .dimension( plotData );

        charts.push( [ chart, this ] );
        $('.data-placeholder--box', this).remove();
    } );
};
