var $ = require( 'jquery' ),
    d3 = require( '../../vendor/d3' ),
    stack = require( '../../graphs/stack' );

module.exports = function( charts, data, responses, colors ) {
    $( '.chart.stacked' ).each( function() {
        var col = $( this ).data( 'col' ),
            stackedData = responses.dimension( function( d ) {
                return d[ col ];
            } ),
            stackedData2 = responses.dimension( function( d ) {
                return d[ col ];
            } ),
            stackedDataGroup = stackedData.group();

        var width = $( this ).width(),
            height = $( this ).data( 'height' ) || 200;

        var y = d3.scale.ordinal()
            .rangeRoundBands([0, height], 0.1, 1)
            .domain($.unique(data.responses.map(function(d) { return d[ col ] })).sort(function(a, b) { return parseInt(a) > parseInt(b); }));

        var chart = stack( width, height, data.responses )
            .dimension( stackedData )
            .altDimension( stackedData2 )
            .color( colors[ 'graph-a' ], colors[ 'graph-a' ] )
            .y( y );

        charts.push( [ chart, this ] );
        $('.data-placeholder--box', this).remove();
    } );
};
