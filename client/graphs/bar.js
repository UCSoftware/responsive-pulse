var $ = require( 'jquery' ),
    d3 = require( '../vendor/d3' );

module.exports = function( width, height, data ) {
    var origWidth = width,
        origHeight = height,
        margin = { top: 10, right: 0, bottom: 40, left: 28 };

    // Remove base margins from the width/height (for most calculations)
    width -= margin.left + margin.right;
    height -= margin.top + margin.bottom;

    var NUM_TICKS = 5,
        x = d3.scale.ordinal()
            .rangeRoundBands( [ 0, width ] , 0.1 ),
        y = d3.scale.linear()
            .range( [ height, 0 ] ),
        xAxis = d3.svg.axis()
            .scale( x )
            .orient( 'bottom' ),
        yAxis = d3.svg.axis()
            .scale( y )
            .ticks( NUM_TICKS )
            .orient( 'left' ),
        yDomain,
        dimension,
        altDimension,
        group,
        origData,
        currentFilter,
        color;

    function sortData( a, b ) {
        var aKey = a.key.replace( '<', '-' ),
            bKey = b.key.replace( '<', '-' );
        if( parseInt( aKey ) > parseInt( bKey ) )
            return 1;

        if( parseInt( aKey ) < parseInt( bKey ) )
            return -1;

        return 0;
    };

    function sortAxis( a, b ) {
        var aKey = a.replace( '<', '-' ),
            bKey = b.replace( '<', '-' );
        if( parseInt( aKey ) > parseInt( bKey ) )
            return 1;

        if( parseInt( aKey ) < parseInt( bKey ) )
            return -1;

        return 0;
    };

    // for wrapping long labels
    // from http://bl.ocks.org/mbostock/7555321
    function wrap( text, width ) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width && line.length > 1) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    };

    var chart = function( div ) {
        var axis = origData.map( function( d ) { return d.key; } ).sort( sortAxis );
        if( axis.length > 14 ) {
            axis = axis.slice( 0, 14 );
            axis[ axis.length - 1 ] += '+';
        }

        // count the values to determine if we need to change the number of ticks
        // so that we only show whole numbers
        var values = origData.reduce( function( a, b ) {
            if( a.indexOf( b.value ) === -1 )
                a.push( b.value );

            return a;
        }, [] );
        if( values.length < NUM_TICKS ) {
            yAxis.ticks( values.length );
        }

        if( origData.length > 14 ) {
            var remainder = origData.slice( 14 ).reduce( function( a, b ) {
                return a + b.value;
            }, 0 );
            origData = origData.slice( 0, 14 ).map( function( d ) { return { key: d.key, value: d.value };  });
            origData[ origData.length - 1 ].key += '+';
            origData[ origData.length - 1 ].value += remainder;
        }

        x.domain( axis );
        y.domain( yDomain ? yDomain : [ 0, origData.reduce( function( a, b ) { return Math.max( a, b.value ); }, 0 ) ] );

        div.each( function() {
            var div = d3.select( this ),
                g = div.select( 'g' ),
                data = dimension.group().all().sort( sortData ),
                graph;

            if( data.length > 14 ) {
                var remainder = data.slice( 14 ).reduce( function( a, b ) {
                    return a + b.value;
                }, 0 );
                data = data.slice( 0, 14 ).map( function( d ) { return { key: d.key, value: d.value }; } );
                data[ data.length - 1 ].key += '+';
                data[ data.length - 1 ].value += remainder;
            }

            if( g.empty() ) {
                var labelAngle = $( div[0][0] ).data( 'x-label-angle' ) || 0;
                if( labelAngle ) {
                    margin.bottom += 90;
                }

                // Generate the skeleton chart
                g = div.append( 'svg' )
                    .attr( 'width', width + margin.left + margin.right )
                    .attr( 'height', height + margin.top + margin.bottom )
                  .append( 'g' )
                    .attr( 'class', 'graph' )
                    .attr( 'transform', 'translate(' + margin.left + ',' + margin.top + ')' );

                g.append( 'g' )
                    .attr( 'class', 'y axis' )
                    .call( yAxis );

                var axisLabels = g.append( 'g' )
                    .attr( 'class', 'x axis' )
                    .attr( 'transform', 'translate(0,' + height + ')' )
                    .call( xAxis );

                axisLabels.select( '.domain' ).remove(); // remove the domain bar

                // Apply rotation to the labels if necessary
                axisLabels.selectAll( 'text' )
                    .style( 'text-anchor', labelAngle ? 'start' : 'middle' )
                    .attr( 'x', labelAngle ? 6 : 0 )
                    .attr( 'y', 6 )
                    .attr( 'transform', function( d ) {
                        return ( labelAngle ? 'translate(-' + ( x.rangeBand() / 2 ) + ', 0) rotate(' + labelAngle + ')' : '' );
                    } )
                    .call( wrap, x.rangeBand() - 10 );

                // Add our own domain bar that stretches from left to right
                var xAxisLineFn = d3.svg.line().x( function(d) { return d.x; } ).y( function(d) { return d.y; } ),
                    xAxisLine = g.select( '.x.axis' )
                        .append( 'line' )
                            .attr( 'class', 'domain' )
                            .attr( 'x1', 0 )
                            .attr( 'y1', 0 )
                            .attr( 'x2', width )
                            .attr( 'y2', 0 );

                g.append( 'text' )
                    .attr( 'class', 'x label' )
                    .attr( 'text-anchor', 'middle' )
                    .attr( 'x', width / 2 )
                    .attr( 'y', height + margin.bottom - 5 )
                    .text( $( div[0][0] ).data( 'x-label' ) || '' );

                graph = g.selectAll( '.graph' )
                    .data( [ 'primary' ] )
                  .enter().append( 'g' )
                    .attr( 'class', function( d ) { return d + ' graph'; } );

                // Add reset link
                var $reset = $( '<div/>' )
                        .addClass( 'reset' )
                        .html( 'Reset' )
                        .on( 'click', function() { $.proxy( chart._clickFilter, g[0][0] )( div[0][0] ); } );
                $( this ).prepend( $reset );

                // Render the bars based on the group data
                var bar = g.selectAll( '.bar' )
                    .data( data )
                  .enter().append( 'g' )
                    .attr( 'class', 'bar' )
                    .on( 'click', function( d ) { $.proxy( chart._clickFilter, this )( div[0], d ); } );

                bar.append( 'rect' )
                    .attr( 'x', function( d, i ) { return x( origData[ i ].key ); } )
                    .attr( 'width', x.rangeBand() )
                    .attr( 'y', function( d, i ) { return y( origData[ i ].value ); } )
                    .attr( 'height', function( d, i ) { return height - y( origData[ i ].value ); } )
                    .attr( 'opacity', '0.2' );

                bar.append( 'rect' )
                    .attr( 'class', 'subset' )
                    .attr( 'x', function( d ) { return x( d.key ); } )
                    .attr( 'width', x.rangeBand() )
                    .attr( 'y', function( d ) { return y( d.value ); } )
                    .attr( 'height', function( d ) { return height - y( d.value ); } )
                    .attr( 'fill', function( d, i ) { return ( color ? color.start.mix( color.end, i / data.length ).rgbString() : '' ); } );
            } else {
                g.selectAll( '.graph .bar .subset' ).each( function( d, i ) {
                    d3.select( this )
                        .transition()
                            .duration( 1000 )
                            .attr( 'y', y( data[ i ].value ) )
                            .attr( 'height', height - y( data[ i ].value ) );
                } );
            }
        } );
    }

    chart._clickFilter = function( div, d ) {
        console.log('Click filter', div, d);
        if( !arguments.length || !altDimension ) return;

        altDimension.filterAll();
        d3.select( this.parentNode ).selectAll( '.subset' ).attr( 'class', 'subset' );

        if( d && currentFilter !== d.key ) {
            currentFilter = d.key;
            if( d.key.match( /[+]$/ ) ) {
                altDimension.filter( function( v ) {
                    if( parseInt( v ) >= parseInt( d.key ) )
                        return true;

                    return false;
                } );
            } else {
                altDimension.filterExact( d.key );
            }

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

    chart.yDomain = function( _ ) {
        if( !arguments.length ) return yDomain;
        yDomain = _;
        return chart;
    };

    chart.dimension = function( _ ) {
        if( !arguments.length ) return dimension;
        dimension = _;
        origData = dimension.group().all().sort( sortData ).map( function( d ) {
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

    chart.margins = function( top, right, bottom, left ) {
        if( !arguments.length ) return margin;

        if( top && !isNaN( parseInt( top ) ) ) margin.top = parseInt( top );
        if( right && !isNaN( parseInt( right ) ) ) margin.right = parseInt( right );
        if( bottom && !isNaN( parseInt( bottom ) ) ) margin.bottom = parseInt( bottom );
        if( left && !isNaN( parseInt( left ) ) ) margin.left = parseInt( left );

        // Remove base margins from the width/height (for most calculations)
        width = origWidth - ( margin.left + margin.right );
        height = origHeight - ( margin.top + margin.bottom );

        x.rangeRoundBands( [ 0, width ] , 0.1 );
        y.range( [ height, 0 ] );

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
