var $ = require( 'jquery' ),
    Color = require( 'color' ),
    d3 = require( '../../vendor/d3' ),
    crossfilter = require( 'crossfilter' ),

    calculate = require( '../../../lib/calculations/original' ),
    graphs = require( '../graphs/index' ),

    line = require( '../../graphs/line' );

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

exports.render = function( _activeFilters ) {
    activeFilters = _activeFilters;
    overallScores = calculate.scores( _data, _responses );
    charts.forEach( _render );

    console.log( '[original] completed render' );
};

exports.init = function( data, responses, spinner, colors ) {
    _data = data;
    _responses = responses;

    [
        'numberlineAgreement',
        'numberlineDisagreement',
        'numberScore'
    ].forEach( function( gr ) {
        graphs[ gr ]( charts, data, responses, colors, calculate );
    } );

    var renderOverall = function( table ) {
        var columnTotal = [],
            $table = $( table ),
            $head = $table.find( 'thead tr' ),
            $body = $table.find( 'tbody' ).empty(),
            min = 100,
            max = 0;

        $head.find( '.strategic-input' ).remove(); // remove any dummy headers
        data.survey.columns.forEach( function( strategicInput, idx ) {
            // Add strategic input
            var $header = $( '<td class="strategic-input tooltip"><span>' + data.survey.columns[ idx ].title + '</span></td>' );

            $header.insertBefore( $head.find( '.total' ) )
                .tooltipster( {
                    content: $( '<span>' + data.survey.strategic_inputs[ data.survey.columns[ idx ].title ].description + '</span>' ),
                    theme: 'tooltipster-default right-offset-arrow'
                } );
        } );

        overallScores.forEach( function( row, rdx ) {
            var $row = $( '<tr/>' ),
                rowTotal = 0;

            row.forEach( function( percentage, cdx ) {
                var $td = $( '<td/>' ).html( Math.round( percentage * 100 ) + '%' );

                if( data.survey.rows[ rdx ] ) {
                    $td.appendTo( $row );

                    if( cdx < row.length - 1 ) {
                        var questionKey = data.survey.overalls[ rdx ][ cdx ];

                        $td.addClass( 'tooltip' )
                            .tooltipster( {
                                content: $( '<span>' + data.survey.intersections[ questionKey ] + '</span>' ),
                                theme: 'tooltipster-default right-offset-arrow'
                            } );
                    } else {
                        $td.addClass( 'row-summary' );
                    }
                } else {
                    $td.appendTo( $row );

                    if( cdx === row.length - 1 )
                        $td.addClass( 'row-summary' );
                }
            } );

            // Add row header (operational output)
            var $header = $( '<td class="row-header"><span>' + ( data.survey.rows[ rdx ] ? data.survey.rows[ rdx ] : 'Total' ) + '</span></td>' );
            if( data.survey.rows[ rdx ] ) {
                $header.addClass( 'tooltip' )
                    .prependTo( $row )
                    .tooltipster( {
                        content: $( '<span>' + data.survey.operational_outputs[ data.survey.rows[ rdx ] ].description + '</span>' ),
                        theme: 'tooltipster-default left-offset-arrow'
                    } );
            } else {
                $header.prependTo( $row );
            }

            // Add row to table
            $table.append( $row );
        } );

        $table.find( 'td:not(:first-child)' ).each( function() {
            $( this ).wrapInner( '<div/>' );

            var svg = d3.select( this ).append( 'svg' )
                        .attr( 'width', 100 )
                        .attr( 'height', 36 ),
                value = parseFloat( $(this).text().replace( '%', '' ) ),
                radius = 16;

            if( radius && ( value >= 75 || value <= 25 ) ) {
                var circle = svg.append( 'circle' )
                    .attr( 'cx', 62 )
                    .attr( 'cy', 18 )
                    .attr( 'r', radius );

                if( value >= 75 )
                    circle.attr( 'fill', colors[ 'green' ] );
                else if( value <= 25 )
                    circle.attr( 'fill', colors[ 'red' ] );
            }
        } );
    }

    $( '.overall .table' ).each( function() {
        var chart = $.proxy( function() { renderOverall( this ); }, this );

        charts.push( [ chart, this ] );
    } );

    $( '.chart.line.responsiveness' ).each( function() {
        var width = $( this ).width(),
            height = 250,
            chart = line( width, height );

        var renderer = function() {
            var series = overallScores.reduce( function( a, b, idx ) {
                var label;
                if( label = data.survey.rows[ idx ] ) {
                    var serieLabel;
                    for( var inputIdx = 0; inputIdx < b.length - 1; inputIdx++ ) {
                        if( serieLabel = data.survey.columns[ inputIdx ].title ) {
                            if( !a[ serieLabel ] ) {
                                a[ serieLabel ] = [];
                            }

                            a[ serieLabel ].push( {
                                key: label,
                                value: Math.round( b[ inputIdx ] * 100 )
                            } );
                        }
                    }
                }

                return a;
            }, {} );

            chart.yDomain( [ 0, 100 ] )
                .hasPopup( false )
                .margin( { top: 10, right: 0, bottom: 60, left: 40 } )
                .axisPadding( { left: 40, right: 135 } )
                .rotate( 15, 0 )
                .data( series );

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

    $( '.domain-table' ).each( function() {
        var $body = $( this ).find( 'tbody' ),
            domain = $( this ).data( 'domain' ),
            domainIdx,
            max = 0, min = 100, average = 0;

        $.each( data.survey.columns, function( idx, col ) {
            if( col.title === domain ) {
                domainIdx = idx;
            }
        } );

        data.survey.overalls.forEach( function( row, rdx ) {
            var $row = $( '<tr/>' ),
                score = calculate.columnScore( responses, row[ domainIdx ] ) * 100;

            if( score > max ) max = score;
            if( score < min ) min = score;

            $row.append( $( '<td/>' ).html( data.survey.rows[ rdx ] ) );
            $row.append( $( '<td class="number"/>' ).html( Math.round( score ) + '%' ) );

            average += score;

            $body.append( $row );
        } );

        var $totalRow = $( '<tr/>' );
        $totalRow.append( '<td class="row-header">Total</td>' );
        $totalRow.append( $( '<td class="number row-header"/>' ).html( Math.round( average / data.survey.overalls.length ) + '%' ) );

        $body.append( $totalRow );

        $body.find( 'td.number' ).each( function() {
            $( this ).wrapInner( $( '<div/>' ) );

            var svg = d3.select( this ).append( 'svg' )
                        .attr( 'width', 75 )
                        .attr( 'height', 44 ),
                value = parseFloat( $(this).text().replace( '%', '' ) ),
                size = ( value - min ) / ( max - min ),
                radius = 19;

            if( radius && ( value <= 25 || value >= 75 ) ) {
                var circle = svg.append( 'circle' )
                    .attr( 'cx', 50 )
                    .attr( 'cy', 22 )
                    .attr( 'r', radius );

                if( value >= 75 )
                    circle.attr( 'fill', colors[ 'green' ] );
                else if( value <= 25 )
                    circle.attr( 'fill', colors[ 'red' ] );
            }
        } );
        $('.data-placeholder--box', $(this).parent()).remove();
    } );

    $( '.verbatims--list' ).each( function() {
        var $table = $( this ),
            domain = $( this ).data( 'domain' ),
            verbatimId = data.survey.strategic_inputs[ domain ].verbatim,
            verbatimText = data.responses
                .map( function( d ) { return d[ verbatimId ]; } )
                .filter( function( d ) { return d; } );

        verbatimText.forEach( function( text ) {
            var $row = $( '<li/>' );
            $row.append( text );
            $table.append( $row );
        } );
    } );
};
