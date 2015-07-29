var $ = require( 'jquery' ),
    d3 = require( '../vendor/d3' );

module.exports = function( width, height ) {
    var margin = { top: 10, right: 0, bottom: 40, left: 28 };

    // Remove base margins from the width/height (for most calculations)
    width -= margin.left + margin.right;
    height -= margin.top + margin.bottom;

    var axis = [],
        series = [],
        axisPadding = { left: 0, right: 0 },
        x = d3.scale.ordinal()
            .rangePoints( [ axisPadding.left, width - (axisPadding.left + axisPadding.right) ] ),
        y = d3.scale.linear()
            .range( [ height, 0 ] ),
        xAxis = d3.svg.axis()
            .scale( x )
            .innerTickSize( 3 )
            .orient( 'bottom' ),
        yAxis = d3.svg.axis()
            .scale( y )
            .innerTickSize( 3 )
            .ticks( 5 )
            .orient( 'left' ),
        yDomain,
        axisAngles = { x: 0, y: 0 },
        group,
        origData,
        currentFilter,
        hasPopup = true,
        color = d3.scale.category10();

    function sortData( a, b ) {
        if( parseInt( a.key ) > parseInt( b.key ) )
            return 1;

        if( parseInt( a.key ) < parseInt( b.key ) )
            return -1;

        return 0;
    };

    function sortAxis( a, b ) {
        if( parseInt( a ) > parseInt( b ) )
            return 1;

        if( parseInt( a ) < parseInt( b ) )
            return -1;

        return 0;
    };

    var chart = function( div ) {
        series = Object.keys( origData );
        axis = origData[ series[ 0 ] ].map( function( d ) { return d.key; } );
        x.domain( axis );

        if( !yDomain ) {
            var upperBound = 0;

            $.each( origData, function( label, values ) {
                var max = Math.max.apply( null, values.reduce( function( a, b ) { a.push( b.value ); return a; }, [] ) );

                if( max > upperBound )
                    upperBound = max;
            } );

            yDomain = [ 0, Math.round( upperBound ) ];
        }
        y.domain( yDomain );

        div.each( function() {
            var div = d3.select( this ),
                g = div.select( 'g' ),
                data = origData,
                graph;

            if( data.length > 10 ) {
                var remainder = data.slice( 10 ).reduce( function( a, b ) {
                    return a + b.value;
                }, 0 );
                data = data.slice( 0, 10 ).map( function( d ) { return { key: d.key, value: d.value }; } );
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
                    .style( 'text-anchor', 'start' )
                    .attr( 'x', 6 )
                    .attr( 'y', 6 )
                    .attr( 'transform', function( d ) {
                        return 'rotate(' + axisAngles.x + ')';
                    } );

                // Add our own domain bar that stretches from left to right
                var xAxisLineFn = d3.svg.line().x( function(d) { return d.x; } ).y( function(d) { return d.y; } ),
                    xAxisLine = g.select( '.x.axis' )
                        .append( 'line' )
                            .attr( 'class', 'domain' )
                            .attr( 'x1', 0 )
                            .attr( 'y1', 0 )
                            .attr( 'x2', width )
                            .attr( 'y2', 0 );

                // Add a grid
                g.insert( 'g', '.y.axis' )
                    .attr( 'class', 'grid horizontal' )
                    .attr( 'transform', 'translate(' + width + ', 0)' )
                    .call( d3.svg.axis().scale( y )
                        .orient( 'right' )
                        .tickSize( -width, 0, 0 )
                        .ticks( 10 )
                        .tickFormat( '' )
                    ).select( '.domain' ).remove();

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
                        .on( 'click', function() { $.proxy( chart._clickFilter, g[0][0] )( div[0][0] ); } )
                        .hide();
                $( this ).prepend( $reset );

                if( hasPopup ) {
                    var $popup = $( '<div/>' ).appendTo( 'body' )
                            .addClass( 'line--popup' )
                            .css( 'display', 'none' );
                }

                var $key = $( '<div/>' ).appendTo( this )
                    .addClass( 'line--key' );

                // Render the lines based on the group data
                $.each( data, function( label, serie ) {
                    var serieColor = function() { return color( series.indexOf( label ) ); },
                        line = d3.svg.line()
                            .x( function( d ) { return x( d.key ); } )
                            .y( function( d ) { return y( d.value ); } );

                    var $serie = $( '<div/>' ).appendTo( $key )
                        .addClass( 'serie' );

                    $( '<span/>' ).appendTo( $serie )
                        .addClass( 'color' )
                        .css( 'background', serieColor() );

                    $( '<span/>' ).appendTo( $serie )
                        .addClass( 'label' )
                        .css( 'color', serieColor() )
                        .html( label );

                    var lineGroup = g.append( 'g' );

                    lineGroup.append( 'path' )
                        .datum( serie )
                        .attr( 'class', 'line' )
                        .attr( 'd', line )
                        .style( 'stroke', serieColor );

                    lineGroup.selectAll( 'marker' )
                        .data( serie )
                      .enter().append( 'circle' )
                        .attr( 'class', 'marker' )
                        .attr( 'fill', serieColor )
                        .attr( 'r', 3 )
                        .attr( 'cx', function( d ) { return x( d.key ); } )
                        .attr( 'cy', function( d ) { return y( d.value ); } );

                    var focus = lineGroup.append( 'g' )
                        .datum( { label: label, serie: serie } )
                        .attr( 'class', 'focus' )
                        .style( 'display', 'none' );

                    focus.append( 'circle' )
                        .attr( 'stroke', serieColor )
                        .attr( 'r', 4.5 );
                } );

                // For mouse interactivity
                g.append( 'rect' )
                    .datum( hasPopup ? { popup: $popup } : {} )
                    .attr( 'class', 'overlay' )
                    .attr( 'width', width )
                    .attr( 'height', height )
                    .on( 'mouseover', function() {
                        if( hasPopup )
                            d3.select( this ).datum().popup.css( 'display', '' );

                        g.selectAll( '.focus' ).style( 'display', null );
                    } )
                    .on( 'mouseout', function() {
                        if( hasPopup )
                            d3.select( this ).datum().popup.css( 'display', 'none' );

                        g.selectAll( '.focus' ).style( 'display', 'none' );
                    } )
                    .on( 'mousemove', chart._mouseMove );
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
    };

    chart._mouseMove = function() {
        var g = d3.select( this.parentNode ),
            x0 = d3.mouse( this )[0],
            i = d3.bisector( function( d ) { return x( d ); } ).left( axis, x0, 1 ),
            a0 = axis[i - 1],
            a1 = axis[i],
            a = x0 - x( a0 ) > x( a1 ) - x0 ? a1 : a0,
            minY = height; // which is closer?

        if( hasPopup )
            var popup = d3.select( this ).datum().popup.empty();

        g.selectAll( '.focus' )
            .attr( 'transform', function( d, i ) {
                var item = d.serie.filter( function( n ) { return n.key == a ? true : false } )[ 0 ],
                    yPos = y( item.value );

                if( hasPopup ) {
                    if( yPos < minY )
                        minY = yPos; // to define the top of the popup

                    var serie = $( '<div/>' ).appendTo( popup )
                        .addClass( 'serie' );

                    $( '<span/>' ).appendTo( serie )
                        .addClass( 'color' )
                        .css( 'background', color( series.indexOf( d.label ) ) );

                    $( '<span/>' ).appendTo( serie )
                        .addClass( 'label' )
                        .css( 'color', color( series.indexOf( d.label ) ) )
                        .html( d.label );

                    $( '<span/>' ).appendTo( serie )
                        .addClass( 'value' )
                        .css( 'color', color( series.indexOf( d.label ) ) )
                        .html( item.value );
                }

                return 'translate(' + x( a ) + ',' + yPos + ')';
            } );

        if( hasPopup ) {
            var svgPos = $( this ).closest( 'svg' ).offset();
            popup.css( {
                'top': svgPos.top + minY,
                'left': svgPos.left + x( a ),
                'display': ''
            } );
        }
    };

    chart._clickFilter = function( div, d ) {
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

            $( div ).find( '.reset' ).show();

            d3.select( this ).selectAll( '.subset' ).attr( 'class', 'subset selected' );
        } else {
            currentFilter = null;
            $( div ).find( '.reset' ).hide();
        }

        $( div ).trigger( 'filter', {
            title: $( div ).data( 'title' ) || 'Unknown',
            value: currentFilter
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

    chart.margin = function( _ ) {
        if( !arguments.length ) return margin;
        margin = _;
        x.rangePoints( [ axisPadding.left, width - (axisPadding.left + axisPadding.right) ] );
        return chart;
    }

    chart.axisPadding = function( _ ) {
        if( !arguments.length ) return axisPadding;
        axisPadding = _;
        x.rangePoints( [ axisPadding.left, width - (axisPadding.left + axisPadding.right) ] );
        return chart;
    };

    chart.hasPopup = function( _ ) {
        if( !arguments.length ) return hasPopup;
        hasPopup = !!_;
        return chart;
    }

    chart.rotate = function( x, y ) {
        if( !arguments.length ) return axisAngles;
        axisAngles = { x: x, y: y };
        return chart;
    }

    chart.data = function( _ ) {
       if( !arguments.length ) return dimension;
       origData = _;
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

    chart.color = function( _ ) {
        if( !arguments.length ) return color;
        color = _;
        return chart;
    };

    return chart;
};
