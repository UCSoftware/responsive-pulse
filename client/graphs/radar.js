var $ = require( 'jquery' ),
    d3 = require( '../vendor/d3' );

module.exports = function( width, options ) {
    var data,
        height,
        cfg = {
            radius: 5,
            factor: 1,
            factorLegend: .85,
            levels: 3,
            maxValue: 0,
            radians: 2 * Math.PI,
            opacityArea: 0.5,
            ToRight: 5,
            margin: { top: 30, right: 100, bottom: 30, left: 100 },
            color: [ '#7eb550', '#599ece' ]
        };

    if( 'undefined' !== typeof options ) {
        for( var i in options ) {
            if( 'undefined' !== typeof options[i] ) {
                cfg[i] = options[i];
            }
        }
    }

    // Remove base margins from the width (for most calculations)
    width -= cfg.margin.left + cfg.margin.right;
    height = width;

    function chart( div ) {
        div.each( function() {
            var div = d3.select( this ),
                g = div.select( 'g' ),
                graph;

            cfg.maxValue = Math.max( cfg.maxValue, d3.max( data, function( i ) {
                return d3.max( i.map( function( o ) { return o.value; } ) )
            } ) );

            var allAxis = data[ 0 ].map( function( i, j ) { return i.axis; } ),
                total = allAxis.length,
                series,
                radius = cfg.factor * Math.min( width / 2, height / 2 ),
                Format = d3.format( '%' );

            if( g.empty() ) {
                // Generate the skeleton chart
                g = div.append( 'svg' )
                    .attr( 'width', width + cfg.margin.left + cfg.margin.right )
                    .attr( 'height', width + cfg.margin.top + cfg.margin.bottom )
                  .append( 'g' )
                    .attr( 'transform', 'translate(' + cfg.margin.left + ',' + cfg.margin.top + ')' );

                // Circular segments
                for( var j = 0; j < cfg.levels - 1; j++ ){
                  var levelFactor = cfg.factor * radius * ( ( j + 1 ) / cfg.levels );

                  g.selectAll( '.levels' )
                    .data( allAxis )
                    .enter()
                        .append( 'svg:line' )
                        .attr( 'x1', function( d, i ) {
                            return levelFactor * ( 1 - cfg.factor * Math.sin( i * cfg.radians / total ) );
                        } )
                        .attr( 'y1', function( d, i ) {
                            return levelFactor * ( 1 - cfg.factor * Math.cos( i * cfg.radians / total ) );
                        } )
                        .attr( 'x2', function( d, i ) {
                            return levelFactor * ( 1 - cfg.factor * Math.sin( ( i + 1 ) * cfg.radians / total ) );
                        } )
                        .attr( 'y2', function( d, i ) {
                            return levelFactor * ( 1 - cfg.factor * Math.cos( ( i + 1 ) * cfg.radians / total ) );
                        } )
                        .attr( 'class', 'line' )
                        .style( 'stroke', 'grey' )
                        .style( 'stroke-opacity', '0.75' )
                        .style( 'stroke-width', '0.3px' )
                        .attr( 'transform', 'translate(' + ( width / 2 - levelFactor ) + ', ' + ( height / 2 - levelFactor ) + ')' );
                }

                // Text indicating at what % each level is
                for( var j = 0; j < cfg.levels; j++ ) {
                    var levelFactor = cfg.factor * radius * ( ( j + 1 ) / cfg.levels );
                    g.selectAll( '.levels' )
                        .data( [ 1 ] ) //dummy data
                        .enter()
                            .append( 'svg:text' )
                            .attr( 'x', function( d ) {
                                return levelFactor * ( 1 - cfg.factor * Math.sin(0) );
                            } )
                            .attr( 'y', function( d ) {
                                return levelFactor * ( 1 - cfg.factor * Math.cos(0) );
                            } )
                            .attr( 'class', 'legend percent' )
                            .attr( 'transform', 'translate(' + ( width / 2 - levelFactor + cfg.ToRight ) + ", " + ( height / 2 - levelFactor ) + ')' )
                            .text( j % 2 ? Format( ( j + 1 ) * cfg.maxValue / cfg.levels ) : '' );
                }

                series = 0;

                var axis = g.selectAll( '.axis' )
                    .data( allAxis )
                    .enter()
                        .append( 'g' )
                        .attr( 'class', 'axis' );

                axis.append( 'line' )
                    .attr( 'x1', width / 2 )
                    .attr( 'y1', height / 2 )
                    .attr( 'x2', function(d, i) { return width/2*(1-cfg.factor*Math.sin(i*cfg.radians/total)); } )
                    .attr( 'y2', function(d, i) { return height/2*(1-cfg.factor*Math.cos(i*cfg.radians/total)); } )
                    .attr( 'class', 'line' )
                    .style( 'stroke', 'grey' )
                    .style( 'stroke-width', '1px' );

                axis.append( 'text' )
                    .attr( 'class', 'legend' )
                    .text( function( d ) { return d; } )
                    .attr( 'text-anchor', 'middle' )
                    .attr( 'dy', '1.5em' )
                    .attr( 'transform', function(d, i) { return 'translate(0, -10)'; } )
                    .attr( 'x', function(d, i) { return width/2*(1-cfg.factorLegend*Math.sin(i*cfg.radians/total))-60*Math.sin(i*cfg.radians/total);})
                    .attr( 'y', function(d, i) { return height/2*(1-Math.cos(i*cfg.radians/total))-20*Math.cos(i*cfg.radians/total);});

                data.forEach( function( y, x ) {
                    dataValues = [];
                    g.selectAll( '.nodes' )
                        .data( y, function( j, i ) {
                            dataValues.push( [
                                width/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)),
                                height/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
                            ] );
                        } );

                    dataValues.push( dataValues[0] );

                    g.selectAll( '.areas' )
                        .data( [ dataValues ] )
                            .enter()
                                .append( 'polygon' )
                                .attr( 'class', 'area radar-chart-serie' + series )
                                .style( 'stroke-width', '2px' )
                                .style( 'stroke', cfg.color[ series ] )
                                .attr( 'points', function( d ) {
                                    var str = '';
                                    for( var pti = 0; pti < d.length; pti++ ) {
                                        str = str + d[ pti ][ 0 ] + ',' + d[ pti ][ 1 ] + ' ';
                                    }
                                    return str;
                                })
                                .style( 'fill', function( j, i ) { return cfg.color[ series ]; } )
                                .style( 'fill-opacity', cfg.opacityArea )
                                .on( 'mouseover', function( d ) {
                                    z = 'polygon.' + d3.select( this ).attr( 'class' ).replace( 'area ', '' );
                                    g.selectAll( 'polygon' )
                                        .transition( 200 )
                                        .style( 'fill-opacity', 0.1 );

                                    g.selectAll( z )
                                        .transition( 200 )
                                        .style( 'fill-opacity', .7 );
                                })
                                .on( 'mouseout', function() {
                                    g.selectAll( 'polygon' )
                                        .transition( 200 )
                                        .style( 'fill-opacity', cfg.opacityArea );
                                });
                    series++;
                });

                series = 0;

                data.forEach( function( y, x ) {
                    g.selectAll( '.nodes' ).data( y ).enter()
                        .append( 'svg:circle' )
                        .attr( 'class', 'node radar-chart-serie' + series )
                        .attr( 'r', cfg.radius )
                        .attr( 'alt', function( j ) { return Math.max(j.value, 0); } )
                        .attr( 'cx', function( j, i ) {
                            dataValues.push( [
                                width/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)),
                                height/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
                            ] );
                            return width/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total));
                        })
                        .attr( 'cy', function( j, i ) {
                            return height/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total));
                        } )
                        .attr( 'data-id', function( j ) { return j.axis; } )
                        .style( 'fill', cfg.color[ series ] ).style( 'fill-opacity', .9 )
                        .on( 'mouseover', function( d ) {
                            newX =  parseFloat( d3.select(this).attr('cx') ) - 10;
                            newY =  parseFloat( d3.select(this).attr('cy') ) - 5;

                            tooltip
                                .attr( 'x', newX )
                                .attr( 'y', newY )
                                .text( Format( d.value ) )
                                .transition( 200 )
                                .style( 'opacity', 1 );

                            z = 'polygon.' + d3.select( this ).attr( 'class' ).replace( 'node ', '' );

                            g.selectAll( 'polygon' )
                                .transition( 200 )
                                .style( 'fill-opacity', 0.1 );

                            g.selectAll( z )
                                .transition( 200 )
                                .style( 'fill-opacity', .7 );
                        } )
                        .on( 'mouseout', function() {
                            tooltip
                                .transition( 200 )
                                .style( 'opacity', 0 );

                            g.selectAll( 'polygon' )
                                .transition( 200 )
                                .style( 'fill-opacity', cfg.opacityArea );
                        } )
                        .append( 'svg:title' )
                        .text( function( j ) { return Math.max( j.value, 0 ); } );

                    series++;
                } );

                // Tooltip
                var tooltip = g.append( 'text' )
                    .style( 'opacity', 0 )
                    .style( 'font-size', '13px' );
            } else {
                series = 0;

                data.forEach( function( y, x ) {
                    dataValues = [];
                    g.selectAll( '.nodes' )
                        .data( y, function( j, i ) {
                            dataValues.push( [
                                width/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)),
                                height/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
                            ] );
                        } );

                    dataValues.push( dataValues[0] );
                    dataValues = [ dataValues ];

                    g.selectAll( '.area.radar-chart-serie' + series )
                        .transition()
                            .duration( 1000 )
                            .attr( 'points', function( d, i ) {
                                var str = '';
                                for( var pti = 0; pti < dataValues[ i ].length; pti++ ) {
                                    str = str + dataValues[ i ][ pti ][ 0 ] + ',' + dataValues[ i ][ pti ][ 1 ] + ' ';
                                }
                                return str;
                            });
                    series++;
                });

                series = 0;

                data.forEach( function( y, x ) {
                    g.selectAll( '.node.radar-chart-serie' + series ).data( y )
                        .transition()
                            .duration( 1000 )
                            .attr( 'cx', function( j, i ) {
                                dataValues.push( [
                                    width/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)),
                                    height/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
                                ] );
                                return width/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total));
                            })
                            .attr( 'cy', function( j, i ) {
                                return height/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total));
                            } );
                    series++;
                } );
            }
        } );
    }

    chart.data = function( _ ) {
        if( !arguments.length ) return data;
        data = _;
        return chart;
    };

    return chart;
};
