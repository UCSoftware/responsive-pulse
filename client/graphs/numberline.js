var $ = require( 'jquery' ),
    d3 = require( '../vendor/d3' );

module.exports = function( width, data ) {
    function chart( div ) {
        div.each( function() {
            var scale = d3.scale.linear()
                            .domain( [ 0, 1 ] )
                            .range( [ 10, width - 10 ] ),
                el = d3.select( this ),
                g = el.select( 'g' );

            if( g.empty() ) {
                g = d3.select( this ).append( 'svg' )
                        .attr( 'width', width )
                        .attr( 'height', 120 )
                        .append( 'g' );

                g.append( 'rect' )
                    .attr( 'class', 'line' )
                    .attr( 'width', width )
                    .attr( 'height', 1 )
                    .attr( 'x', 0 )
                    .attr( 'y', 50 );

                var labels = [ [ 0, 'Strongly Disagree', 'start' ], [ 2, 'Neutral', 'middle' ], [ 4, 'Strongly Agree', 'end' ] ],
                    labelItems = g.selectAll( 'text' )
                        .data( labels )
                        .enter()
                        .append( 'text' )
                        .attr( 'y', 80 )
                        .attr( 'text-anchor', function( d ) { return d[ 2 ]; } );

                labelItems.append( 'tspan' )
                    .text( function( d ) { return '(' + d[ 0 ] + ')'; } )
                    .attr( 'x', function( d, i ) { return ( ( i / ( labels.length - 1 ) ) * 100 ) + '%'; } )
                    .attr( 'dy', 0 );

                labelItems.append( 'tspan' )
                    .text( function( d ) { return d[ 1 ]; } )
                    .attr( 'x', function( d, i ) { return ( ( i / ( labels.length - 1 ) ) * 100 ) + '%'; } )
                    .attr( 'dy', 20 );

                g.selectAll( 'circle' )
                   .data( data )
                   .enter()
                   .append( 'circle' )
                   .attr( 'class', function( d, i ) { return 'circle-' + ( data.length > 1 ? i : 'only' ); } )
                   .attr( 'cx', function( d ) {
                        return scale( d );
                   })
                   .attr( 'cy', 50 )
                   .attr( 'r', 10 );
            } else {
                g.selectAll( 'circle' ).each( function( d, i ) {
                    d3.select( this )
                        .transition()
                            .duration( 1000 )
                            .attr( 'cx', scale( data[ i ] ) );
                } );
            }
        } );
    }

    return chart;
};
