var $ = require( 'jquery' ),
    d3 = require( '../vendor/d3' );

module.exports = function( width, height, options ) {
    var dimension = null,
        cfg = {
            rangeX: [ 0, 1 ],
            rangeY: [ 0, 1 ],
            xLabels: [],
            xValues: [],
            yLabels: [],
            yValues: [],
            margin: { top: 10, right: 10, bottom: 10, left: 10 }
        };

    if( 'undefined' !== typeof options ) {
        for( var i in options ) {
            if( 'undefined' !== typeof options[i] ) {
                cfg[i] = options[i];
            }
        }
    }

    // Remove base margins from the width/height (for most calculations)
    width -= cfg.margin.left + cfg.margin.right;
    height -= cfg.margin.top + cfg.margin.bottom;

    var x = d3.scale.linear()
            .domain( cfg.rangeX )
            .range( [ 0, width ] ),
        y = d3.scale.linear()
            .domain( cfg.rangeY )
            .range( [ height, 0 ] ),
        xAxis = d3.svg.axis()
            .scale( x )
            .ticks( 0 )
            .outerTickSize( 0 )
            .orient( 'bottom' ),
        yAxis = d3.svg.axis()
            .scale( y )
            .ticks( 0 )
            .outerTickSize( 0 )
            .orient( 'left' ),
        color;

    function chart( div ) {
        div.each( function() {
            var div = d3.select( this ),
                g = div.select( 'g' ),
                graph,
                data = chart._data();

            if( !( data[ 0 ] instanceof Array ) ) {
                data = [ data ];
            }

            if( g.empty() ) {
                // Generate the skeleton chart
                g = div.append( 'svg' )
                    .attr( 'width', width + cfg.margin.left + cfg.margin.right )
                    .attr( 'height', height + cfg.margin.top + cfg.margin.bottom )
                  .append( 'g' )
                    .attr( 'class', 'graph' )
                    .attr( 'transform', 'translate(' + cfg.margin.left + ',' + cfg.margin.top + ')' );

                g.append( 'g' )
                    .attr( 'class', 'y axis' )
                    .attr( 'transform', 'translate(' + ( width / 2 ) + ',0)' )
                    .call( yAxis );

                g.append( 'g' )
                    .attr( 'class', 'x axis' )
                    .attr( 'transform', 'translate(0,' + ( height / 2 ) + ')' )
                    .call( xAxis );

                if( cfg.xLabels.length ) {
                    g.append( 'text' )
                        .attr( 'class', 'x label' )
                        .attr( 'text-anchor', 'start' )
                        .attr( 'x', 0 )
                        .attr( 'y', ( height / 2 ) - 5 )
                        .text( cfg.xLabels[ 0 ] );

                    g.append( 'text' )
                        .attr( 'class', 'x label' )
                        .attr( 'text-anchor', 'end' )
                        .attr( 'x', '90%' )
                        .attr( 'y', ( height / 2 ) - 5 )
                        .text( cfg.xLabels[ 1 ] );
                }

                if( cfg.yLabels.length ) {
                    g.append( 'text' )
                        .attr( 'class', 'y label' )
                        .attr( 'text-anchor', 'end' )
                        .attr( 'x', 0 )
                        .attr( 'y', ( width / 2 ) - 10 )
                        .text( cfg.yLabels[ 0 ] );

                    g.append( 'text' )
                        .attr( 'class', 'y label' )
                        .attr( 'text-anchor', 'start' )
                        .attr( 'x', -height )
                        .attr( 'y', ( width / 2 ) - 10 )
                        .text( cfg.yLabels[ 1 ] );
                }

                g.selectAll( 'circle' )
                    .data( data )
                    .enter()
                    .append( 'circle' )
                    .attr( 'class', function( d, i ) { return 'circle-' + ( data.length > 1 ? i : 'only' ); } )
                    .attr( 'fill', function( d, i ) { return ( color ? color.start.mix( color.end, i / data.length ).rgbString() : '' ); } )
                    .attr( 'cx', function( d ) {
                        return x( d[ 0 ] );
                    } )
                    .attr( 'cy', function( d ) {
                        return y( 1 - d[ 1 ] );
                    } )
                    .attr( 'r', 10 );
            } else {
                g.selectAll( 'circle' ).each( function( d, i ) {
                    d3.select( this )
                        .transition()
                            .duration( 1000 )
                            .attr( 'cx', function( d ) {
                                return x( data[ i ][ 0 ] );
                            } )
                            .attr( 'cy', function( d ) {
                                return y( 1 - data[ i ][ 1 ] );
                            } );
                } );
            }
        } );
    };

    chart.dimension = function( _ ) {
       if( !arguments.length ) return dimension;
       dimension = _;
       return chart;
    };

    chart._data = function() {
        var data = dimension.group().all().map( function( d ) {
            var dm = [];
            for( var i = 0; i < d.value; i++ ) {
                dm.push( d.key );
            }
            return dm;
        } ).reduce( function( a, b ) { return a.concat( b ); }, [] );

        data = data.reduce( function( a, b, idx ) {
            var b0val = cfg.xValues.indexOf( b[ 0 ] ),
                b1val = cfg.yValues.indexOf( b[ 1 ] ),
                b0 = ( b0val < 0 ? ( ( cfg.xValues.length - 1 ) / 2 ) : b0val ) / ( cfg.xValues.length - 1 ),
                b1 = ( b1val < 0 ? ( ( cfg.yValues.length - 1 ) / 2 ) : b1val ) / ( cfg.yValues.length - 1 ),
                a0 = ( ( a[ 0 ] * idx ) + b0 ) / ( idx + 1 ),
                a1 = ( ( a[ 1 ] * idx ) + b1 ) / ( idx + 1 );

            return [ a0, a1 ];
        }, [ 0, 0 ] );

        return data;
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
