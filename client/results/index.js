var $ = require( 'jquery' ),
    Color = require( 'color' ),
    d3 = require( '../vendor/d3' ),
    crossfilter = require( 'crossfilter' ),

    Spinner = require( '../lib/spinner' ),
    stickyheader = require( '../lib/stickyheader' ),

    graphs = require( './graphs/index' );

require( '../vendor/jquery.tooltipster.min' );

var renderers = {
    'original': require( './renderers/original' ),
    'even-over': require( './renderers/even-over' )
};

var spinner = new Spinner(),
    firstRender = true,
    charts = [],
    activeFilters = [];

// Renders the specified chart or list.
function render( d ) {
    if( d )
        d3.select( d[ 1 ] ).call( d[ 0 ], activeFilters );
}

exports.init = function() {
    if ($(window).width() > 640) {
        $('.sticky-nav').stick_in_parent({recalc_every: 50});
        $('.sticky-header').stick_in_parent({offset_top: 175});
    }

    spinner.loading( 'survey' );
    d3.json( '/view/' + survey + '/results.json', function( data ) {
        spinner.done( 'survey' );

        if( data.responses.length === 0 ) return;

        var survey = data.survey,
            responses = crossfilter( data.responses );

        var colors = {};

        // Graphing colors
        [
            'green',
            'red',
            'graph-a',
            'graph-b',
            'blue'
        ].forEach( function( color ) {
            var obj = $( '<div>' ).addClass( 'color-' + color.toLowerCase() ).appendTo( 'body' );
            colors[ color ] = Color( obj.css( 'color' ) );
            obj.remove();
        } );

        // Graphing color(s)
        var graphColorScheme = [
                colors[ 'graph-a' ],
                colors[ 'graph-b' ]
            ];

        // Initialize the appropriate renderer
        renderers[ survey.render ].init( data, responses, spinner, colors );

        function resetAll() {
            // Don't hate me.
            $('.reset').click();
            $('.ovw-scoring--responses-total').removeClass('is-shown');
        }

        $('.ovw-scoring--reset').on( 'click', function( evt ) {
            resetAll();
            return false;
        } );

        function renderAll() {
            charts.forEach( render );
            renderers[ survey.render ].render( activeFilters );

            $('body').trigger('sticky_kit:recalc');
            console.log('Completed render all');
        }

        $( 'body' ).on( 'filter', '.chart, .table', function( evt, data ) {
            console.log( 'Filter', data );

            if( data.value ) {
                var found = false;
                for( var i = 0; i < activeFilters.length; i++ ) {
                    if( activeFilters[ i ].title === data.title ) {
                        activeFilters[ i ].value = data.value;
                        found = true;
                        break;
                    }
                }

                if( !found ) {
                    activeFilters.push( data );
                }
            } else {
                var found = false;
                for( var i = 0; i < activeFilters.length; i++ ) {
                    if( activeFilters[ i ].title === data.title ) {
                        found = i;
                        break;
                    }
                }

                if( found !== false ) {
                    activeFilters.splice( i, 1 );
                }
            }

            renderAll();
        } );

        [
            'stack',
            'pie',
            'matrixplot',
            'bar',
            'line',
            'numberResponses',
            'numberIncomplete',
            'numberPercentile'
        ].forEach( function( gr ) {
            graphs[ gr ]( charts, data, responses, colors );
        } );

        renderAll();
    } );
};
