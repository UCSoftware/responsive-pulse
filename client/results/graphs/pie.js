var $ = require( 'jquery' ),
    d3 = require( '../../vendor/d3' ),
    pie = require( '../../graphs/pie' );

module.exports = function( charts, data, responses, colors ) {
    $( '.chart.pie' ).each( function() {
        var width = $( this ).width(),
            height = 200,
            col = $( this ).data( 'col' ),
            subCol = $( this ).data( 'sub-col' ),
            pieData = responses.dimension( function( d ) {
                return (subCol ? d[ col ][ subCol ] : d[ col ])
            } ),
            pieData2 = responses.dimension( function( d ) {
                return (subCol ? d[ col ][ subCol ] : d[ col ])
            } );

        var chart = pie( width, height )
                .dimension( pieData )
                .altDimension( pieData2 )
                .color( graphColorScheme );

        charts.push( [ chart, this ] );
        $('.data-placeholder--box', this).remove();
    } );
};
