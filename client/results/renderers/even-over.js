var $ = require( 'jquery' ),
    _ = require( 'lodash' ),
    Color = require( 'color' ),
    d3 = require( '../../vendor/d3' ),
    crossfilter = require( 'crossfilter' ),
    marked = require( 'marked' ),

    calculate = require( '../../../lib/calculations/even-over' ),
    graphs = require( '../graphs/index' ),

    bar = require( '../../graphs/bar' );

exports.graphs = graphs;
exports.calculate = calculate;

var _data,
    _responses,
    overallScores = [],
    activeFilters = [],
    charts = [];

// Renders the specified chart or list.
function _render( d ) {
    if( d )
        d3.select( d[ 1 ] ).call( d[ 0 ], activeFilters );
}

function pseudofilter( d ) {
    return {
        group: function() {
            return {
                all: function() {
                    return d;
                }
            };
        }
    };
}

exports.render = function( _activeFilters ) {
    activeFilters = _activeFilters;
    overallScores = calculate.scores( _data, _responses );
    charts.forEach( _render );

    setTimeout( function() {
        $('body').trigger('sticky_kit:recalc');
    }, 150 );
    console.log( '[even-over] completed render' );
};

exports.init = function( data, responses, spinner, colors ) {
    _data = data;
    _responses = responses;

    [
        'numberlineAgreement',
        'numberlineDisagreement',
        'responsivenessTable',
        'numberScore'
    ].forEach( function( gr ) {
        graphs[ gr ]( charts, data, responses, colors, calculate );
    } );

    $( '.chart.bar.responsiveness' ).each( function() {
        var width = $( this ).width(),
            height = 200;

        var chart = bar( width, height )
                .color( colors[ 'graph-a' ], colors[ 'graph-a' ] );
        chart.margins.apply( chart, ( $( this ).data( 'margins' ) || '' ).split( ',' ) );

        var renderer = function() {
            // since the bar renderer uses crossfilter to process data, we need to emulate
            // crossfilter's methods.
            // we also trim the last value off overallScores, since that is the average of averages
            // and not an e/o average itself.
            var barData = pseudofilter( overallScores.slice( 0, overallScores.length - 1 ).map( function( score, idx ) {
                return { key: data.survey.columns[ idx ].title, value: Math.round( ( score || 0.5 ) * 100 ) };
            } ) );

            chart.dimension( barData );

            if( width > 0 )
                chart( this );
        };

        charts.push( [ renderer, this ] );
        $('.data-placeholder--box', this).remove();
    } );

    $( 'select.filter' ).each( function() {
        var $select = $( this ),
            column = $select.data( 'col' ),
            minValue = $select.data( 'min-value' ),
            maxValue = $select.data( 'max-value' ),
            selected = '';

        var filterDimension = responses.dimension( function( d ) { return d[ column ] || 'Unknown'; } );

        var normalizeKey = function( key ) {
            return key ? key.toLowerCase().replace( /\band\b/g, '&' ).replace( /\s+/g, '' ) : null;
        };

        var filter = function() {
            $select.empty();

            var filterData = filterDimension.group().all()
                .filter( function( d ) { return d.key !== 'Unknown'; } )
                .reduce( function( a, b ) {
                    var lowerKey = normalizeKey( b.key ),
                        existing = a.normalized.indexOf( lowerKey );
                    if( existing === -1 ) {
                        a.keys.push( b );
                        a.normalized.push( lowerKey );
                    } else {
                        a.keys[ existing ].value += b.value;
                    }

                    return a;
                }, { keys: [], normalized: [] } ).keys;

            if( minValue )
                filterData = filterData.filter( function( d ) { return d.value >= minValue; } );

            if( maxValue )
                filterData = filterData.filter( function( d ) { return d.value <= maxValue; } );

            if( selected.length && !filterData.reduce( function( a, b ) { return a || ( normalizeKey( b.key ) === selected ); }, false ) ) {
                filterData.push( { key: selected } );
            }

            filterData.forEach( function( d ) {
                var $option = $( '<option value="' + normalizeKey( d.key ) + '">' + d.key + '</option>'  );
                if( selected === normalizeKey( d.key ) )
                    $option.attr( 'selected', true );

                $select.append( $option );
            } );

            var $all = $select.prepend( '<option value="">All</option>' );
            if( selected === '' )
                $all.attr( 'selected', true );
        };

        charts.push( [ filter, this ] );
        $('.data-placeholder--box', this).remove();

        $select.on( 'change', function() {
            var value = $select.val();
            selected = value;

            if( value.length )
                filterDimension.filter( function( d ) { return normalizeKey( d ) === value; } );
            else
                filterDimension.filterAll();

            var $table = $select.closest( '.overall.card-data' ).find( 'table' );
            $table.trigger( 'filter', {
                title: $select.data( 'title' ),
                value: value
            } );
        } );
    } );

    /**
     * Handles the "Idenitifies most" and "Identifies least" containers on the Overview.
     *
     * Requests /data/traits.json, which contains full titles and blurbs for each potential trait.
     * Scores are based on overall average scores and are not filterable.
     */
    $( '.identifies-most' ).each( function() {
        var renderer = function() {
            $.getJSON( '/data/traits.json', function( traits ) {
                var identifiesMost = [ 'N/A', -1 ], identifiesLeast = [ 'N/A', 101 ];
                overallScores.slice( 0, overallScores.length - 1 ).forEach( function( score, idx ) {
                    if( score > identifiesMost[ 1 ] ) {
                        identifiesMost = [ data.survey.columns[ idx ].title, score ];
                    } else if( score < identifiesLeast[ 1 ] ) {
                        identifiesLeast = [ data.survey.columns[ idx ].title, score ];
                    }
                } );

                var $identifiesMost = $( '.identifies-most' ),
                    _identifiesMostTpl = _.template( $identifiesMost.find( '.template' ).html() );
                $( '.identifies-most' ).html( _identifiesMostTpl( { trait: traits[ identifiesMost[ 0 ] ], marked: marked } ) );

                var $identifiesLeast = $( '.identifies-least' ),
                    _identifiesLeastTpl = _.template( $identifiesLeast.find( '.template' ).html() );
                $( '.identifies-least' ).html( _identifiesLeastTpl( { trait: traits[ identifiesLeast[ 0 ] ], marked: marked } ) );
            } );
        };

        charts.push( [ renderer, this ] );
    } );

    $( '.overall table' ).each( function() {
        var $tbody = $( this ).find( 'tbody' ).empty();

        var renderer = function() {
            var verbatimTotal = 0;

            $tbody.empty();

            overallScores.slice( 0, overallScores.length - 1 ).map( function( score, idx ) {
                var verbatimDim = responses.dimension( function( d ) {
                        return d[ data.survey.columns[ idx ].verbatims ];
                    } ),
                    verbatims = verbatimDim.group().top( Infinity ).filter( function( value ) { return value.key && value.key.length; } ).length;

                verbatimDim.dispose(); // make room for other dimensions
                verbatimTotal += verbatims;

                var $row = $( '<tr/>' ),
                    headerText = data.survey.columns[ idx ].title,
                    $header = $( '<td class="row-header"/>' );

                $header.append(
                    $( '<a/>').attr( 'href', '#' + headerText.replace(/[^a-z0-9]/gi, '-') )
                              .text( headerText )
                );

                $row.append( $header );
                $row.append( $( '<td class="number"/>' ).text( Math.round( ( score || 0.5 ) * 100 ) + '%' ) );
                $row.append( $( '<td class="number"/>' ).text( verbatims ) );

                $tbody.append( $row );
            } );

            var $totalRow = $( '<tr/>' );

            $totalRow.append( $( '<td/>' ) );
            $totalRow.append( $( '<td class="number"/>' ).text( Math.round( ( overallScores[ overallScores.length - 1 ] || 0.5 ) * 100 ) + '%' ) );
            $totalRow.append( $( '<td class="number"/>' ).text( verbatimTotal ) );

            $tbody.append( $totalRow );
        };

        charts.push( [ renderer, this ] );
    } );

    $( '.verbatims' ).each( function() {
        var $verbatims = $( this ),
            $list = $( this ).find( '.verbatims--list' ).empty(),
            $showMore = $( this ).find( '.verbatims--show-more' ),
            $showLess = $( this ).find( '.verbatims--show-less' ),
            domain = $( this ).data( 'domain' ),
            verbatimId;

        $showMore.on( 'click', function() {
            $verbatims.addClass( 'verbatims--expanded' );
        } );

        $showLess.on( 'click', function() {
            $verbatims.removeClass( 'verbatims--expanded' );
        } );

        $.each( data.survey.columns, function( idx, col ) {
            if( col.title === domain ) {
                verbatimId = col.verbatims;
            }
        } );

        var renderer = function() {
            $list.empty();

            var verbatimDim = responses.dimension( function( d ) {
                    return d[ verbatimId ];
                } ),
                verbatims = verbatimDim.group().all().filter( function( v ) { return v.value && v.key.length; } );

            verbatimDim.dispose(); // make room for other dimensions

            $showMore.find( 'span' ).text( verbatims.length );

            if( verbatims.length <= 10 ) {
                $verbatims.addClass( 'verbatims--no-collapse' );
            } else {
                $verbatims.removeClass( 'verbatims--no-collapse' );
            }

            verbatims.forEach( function( text ) {
                if( text.key && text.key.length ) {
                    var $row = $( '<li/>' );
                    $row.append( text.key );
                    $list.append( $row );
                }
            } );
        };

        charts.push( [ renderer, this ] );
    } );
};
