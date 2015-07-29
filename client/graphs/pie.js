var $ = require( 'jquery' ),
    d3 = require( '../vendor/d3' );

module.exports = function( width, height ) {
    var dimension,
        altDimension,
        origData,
        currentFilter,
        color;

    function chart( div ) {
        div.each( function() {
            var div = d3.select( this ),
                pie = d3.layout.pie()
                            .sort( null )
                            .value( function( d ) { return d.value; } ),
                radius = ( Math.min( width, height ) / 2 ),
                arcOuter = d3.svg.arc()
                            .outerRadius( radius - 25 )
                            .innerRadius( radius - 45 ),
                arcInner = d3.svg.arc()
                            .outerRadius( radius - 50 )
                            .innerRadius( 0 ),
                labelPos = d3.svg.arc()
                            .innerRadius( radius )
                            .outerRadius( radius - 15 ),
                g = div.select( 'g' ),
                data = dimension.group().all().filter( function( d, i ) { return origData[ i ].value > 0 } ),
                graph;

            var origPieData = pie( origData ),
                pieData = pie( data );

            if( g.empty() ) {
                // Generate the skeleton pie
                g = div.append( 'svg' )
                    .attr( 'width', width )
                    .attr( 'height', height)
                  .append( 'g' )
                    .attr( 'transform', 'translate(' + width / 2 + ',' + height / 2 + ')' );

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

                // Render the arcs based on the group data
                var pieces = graph.selectAll( '.arc' )
                            .data( origPieData )
                        .enter().append( 'g' )
                            .attr( 'class', 'arc' )
                            .on( 'click', function( d ) { $.proxy( chart._clickFilter, this )( div[0], d ); } );

                pieces.append( 'path' )
                    .attr( 'd', arcInner )
                    .attr( 'fill', function( d, i ) { return color[0].mix( color[1], i / data.length ).desaturateByRatio( 0.5 ); } )
                    .attr( 'opacity', '0.9' );

                pieces.append( 'path' )
                    .attr( 'class', 'subset' )
                    .attr( 'd', arcOuter )
                    .attr( 'fill', function( d, i ) { return color[0].mix( color[1], i / data.length ); } )
                    .each( function(d) {
                        this._current = d;
                    });

                pieces.append( 'text' )
                    .attr( 'transform', function(d) {
                        var c = labelPos.centroid( d );
                        return 'translate(' + ( c[ 0 ] * 1.2 ) + ',' + ( c[ 1 ] * 0.95 ) + ')';
                    } )
                    .attr( 'display', function(d) { return d.value >= 2 ? null : 'none'; } )
                    .style( 'text-anchor', 'middle' )
                    .style( 'fill', function( d, i ) { return color[0].mix( color[1], i / data.length ); } )
                    .text( function( d ) { return d.data.key; } )
                    .each( function(d) {
                        this._current = d;
                    });
            } else {
                graph = g.selectAll( '.graph' );

                var pieces = graph.selectAll( '.arc' );

                pieces.selectAll( 'path.subset' ).each( function( d, n, i ) {
                    d = pieData[ i ];

                    d3.select( this ).transition()
                        .duration( 1000 )
                        .attrTween( 'd', function() {
                            var i = d3.interpolate( this._current, d );
                            this._current = i( 0 );

                            return function( t ) {
                                return arcOuter( i( t ) );
                            };
                        } );
                } );

                pieces.selectAll( 'text' ).each( function( d, n, idx ) {
                    d3.select( this ).transition()
                        .duration( 1000 )
                        .attr('opacity', function() {
                            return pieData[ idx ].value ? 1 : 0;
                        })
                        .attrTween( 'transform', function() {
                            var i = d3.interpolate( this._current, pieData[ idx ] );
                            this._current = i( 0 );

                            return function( t ) {
                                var c = labelPos.centroid( i( t ) );
                                return "translate(" + ( c[0] * 1.2 ) +"," + ( c[1] * 0.95 ) + ")";
                            };
                        });
                } );
            }
        } );
    }

    chart._clickFilter = function( div, d ) {
        if( !arguments.length ) return;
        
        altDimension.filterAll();
        d3.select( this.parentNode ).selectAll( '.subset' ).each( function() {
            var slice = d3.select( this );
            slice.attr( 'class', 'subset' );
        } );

        if( d && d.data.key !== currentFilter ) {
            currentFilter = d.data.key;
            altDimension.filterFunction( function( p ) { return ( p == d.data.key ); } );
            $( div ).find( '.reset' ).addClass('is-shown');

            var curSlice = d3.select( this ).selectAll( '.subset' );
            curSlice.attr( 'class', 'subset selected' );
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

    chart.dimension = function( _ ) {
        if( !arguments.length ) return dimension;
        dimension = _;
        origData = dimension.group().all()
            .filter( function( d ) { return d.value > 0 } )
            .map( function( d ) {
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

    chart.color = function( scheme ) {
        if( !arguments.length ) return color;
        color = scheme;
        return chart;
    };

    return chart;
};
