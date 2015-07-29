var $ = require( 'jquery' ),
    d3 = require( '../vendor/d3' );

module.exports = function( width, height, data ) {
    var margin = { top: 0, right: 30, bottom: 0, left: 20 };

    // Remove base margins from the width/height (for most calculations)
    width -= margin.left + margin.right;
    height -= margin.top + margin.bottom;

    var y = d3.scale.ordinal()
        .rangeRoundBands( [ 0, height ], 0.1, 1 )
        .domain(
            $.unique( data ).sort( function( a, b ) { return parseInt( a ) > parseInt( b ); } )
        );

    var x = d3.scale.linear().range( [ width, 0 ] ),
        y,
        axis = d3.svg.axis().orient( 'left' ),
        dimension,
        altDimension,
        group,
        origData,
        currentFilter,
        color;

    function chart( div ) {
        x.domain( [ 0, origData.reduce( function( a, b ) { return Math.max( a, b.value ); }, 0 ) ] );

        div.each( function() {
            var div = d3.select( this ),
                g = div.select( 'g' ),
                data = dimension.group().all(),
                graph;

            if( g.empty() ) {
                // Generate the skeleton chart
                g = div.append( 'svg' )
                    .attr( 'width', width + margin.left + margin.right )
                    .attr( 'height', height + margin.top + margin.bottom )
                  .append( 'g' )
                    .attr( 'transform', 'translate(' + margin.left + ',' + margin.top + ')' );

                graph = g.selectAll( '.graph' )
                    .data( [ 'primary' ] )
                  .enter().append( 'g' )
                    .attr( 'class', function( d ) { return d + ' graph'; } );

                // Add y axis label
                graph.append( 'text' )
                    .attr( 'transform', 'rotate(-90)' )
                    .attr( 'y', -margin.left / 2 )
                    .attr( 'x', -height / 2 )
                    .attr( 'class', 'y label' )
                    .style( 'text-anchor', 'middle' )
                    .text( $( div[0][0] ).data( 'y-label' ) || '' );

                // Add reset link
                var $reset = $( '<div/>' )
                        .addClass( 'reset' )
                        .html( 'Reset' )
                        .on( 'click', function() { $.proxy( chart._clickFilter, g[0][0] )( div[0][0] ); } );
                $( this ).prepend( $reset );

                // Render the bars based on the group data
                var bars = graph.selectAll( '.bar' )
                    .data( data )
                  .enter().append( 'g' )
                    .attr( 'class', 'bar' )
                    .on( 'click', function( d ) { $.proxy( chart._clickFilter, this )( div[0], d ); } );

                bars.append( 'rect' )
                    .attr( 'y', function( d ) { return y( d.key ); } )
                    .attr( 'height', y.rangeBand() )
                    .attr( 'x', 20 )
                    .attr( 'width', function( d, i ) { return width - x( origData[ i ].value ); } )
                    .attr( 'opacity', '0.2' );

                bars.append( 'rect' )
                    .attr( 'y', function( d ) { return y( d.key ); } )
                    .attr( 'height', y.rangeBand() )
                    .attr( 'x', 20 )
                    .attr( 'width', function( d ) { return width - x( d.value ); } )
                    .attr( 'class', 'subset' )
                    .attr( 'fill', function( d, i ) { return ( color ? color.start.mix( color.end, i / data.length ).rgbString() : '' ); } );

                // Render the labels based on the group data
                bars.append( 'text' )
                    .text( function(d) { return d.key; } )
                    .attr( 'y', function(d) { return y( d.key ) + ( y.rangeBand() / 2 ) + 4; })
                    .attr( 'x', '0' )
                    .attr( 'text-anchor', 'left' );
            } else {
                g.selectAll( '.graph .bar .subset' ).each( function( d, i ) {
                    d3.select( this )
                        .transition()
                            .duration( 1000 )
                            .attr( 'x', 20 )
                            .attr( 'width', width - x( data[ i ].value ) );
                } );
            }
        } );
    }

    chart._clickFilter = function( div, d ) {
        if( !arguments.length ) return;

        altDimension.filterAll();
        d3.select( this.parentNode ).selectAll( '.subset' ).attr( 'class', 'subset' );

        if( d && currentFilter !== d.key ) {
            currentFilter = d.key;
            altDimension.filterExact( d.key );
            $( div ).find( '.reset' ).addClass('is-shown');

            d3.select( this ).selectAll( '.subset' ).attr( 'class', 'subset selected' );
        } else {
            currentFilter = null;
            $( div ).find( '.reset' ).removeClass('is-shown');
        }

        $( div ).trigger( 'filter', {
            title: $( div ).data( 'title' ) || 'Unknown',
            value: currentFilter,
            num: d ? d.value : null
        } );
    };

    chart.x = function( _ ) {
        if( !arguments.length ) return x;
        x = _;
        axis.scale( x );
        return chart;
    };

    chart.y = function( _ ) {
        if( !arguments.length ) return y;
        y = _;
        return chart;
    };

    chart.dimension = function( _ ) {
        if( !arguments.length ) return dimension;
        dimension = _;
        origData = dimension.group().all().map( function( d ) {
            return { key: d.key, value: d.value };
        } );
        return chart;
    };

    chart.altDimension = function( _ ) {
        if( !arguments.length ) return altDimension;
        altDimension = _;
        return chart;
    };

    chart.filter = function( _ ) {
        if( _ ) {
            altDimension.filterRange( _ );
        } else {
            altDimension.filterAll();
        }
        return chart;
    };

    chart.color = function( start, end ) {
        if( !arguments.length ) return color;
        color = {
            start: start,
            end: end
        };
        return chart;
    };

    return chart;
};
