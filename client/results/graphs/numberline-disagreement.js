var $ = require( 'jquery' ),
    d3 = require( '../../vendor/d3' ),
    numberline = require( '../../graphs/numberline' );

module.exports = function( charts, data, responses, colors, calculate ) {
    $( '.chart.numberline.disagreement' ).each( function() {
        var $this = $( this ),
            domain = $( this ).data( 'domain' ),
            domainIdx,
            furthest = {
                q: null,
                leadership: null,
                team: null
            };

        $.each( data.survey.columns, function( idx, col ) {
            if( col.title === domain ) {
                domainIdx = idx;
            }
        } );

        data.survey.overalls.forEach( function( row, rdx ) {
            // filter by distance from CEO (d['management_layers'])
            var leadershipDim = responses
                    .dimension( function( d ) { return d[ 'management_layers' ]; } )
                    .filter( function( d ) { return parseInt( d ) <= 2; } ),
                leadership = calculate.columnScore( responses, row[ domainIdx ] );
            leadershipDim.dispose();

            var teamDim = responses
                    .dimension( function( d ) { return d[ 'management_layers' ]; } )
                    .filter( function( d ) { return parseInt( d ) > 2; } ),
                team = calculate.columnScore( responses, row[ domainIdx ] );
            teamDim.dispose();

            if( Math.abs( leadership - team ) >= Math.abs( furthest.leadership - furthest.team ) ) {
                furthest.leadership = leadership;
                furthest.team = team;
                furthest.q = row[ domainIdx ];
            }
        } );

        var furthestQuestion;
        data.survey.pages.filter( function( page, pdx ) {
            return page.fields.filter( function( field, fdx ) {
                if( field.type === 'gridselect' ) {
                    for( var key in field.options ) {
                        if( key === furthest.q ) {
                            furthestQuestion = field.options[ key ];
                            return true;
                        }
                    }

                    return false;
                }
            } );
        } );

        var $chartbox = $( '<div />' );
        $this.append( $chartbox );
        $this.append( $( '<p/>' ).html( furthestQuestion ) );

        disagreementData = [ furthest.leadership, furthest.team ];
        if( Math.abs( disagreementData[ 0 ] - disagreementData[ 1 ] ) <= 0.01 )
            disagreementData = [ ( disagreementData[ 0 ] + disagreementData[ 1 ] ) / 2 ];


        if( furthest.q !== null ) {
            var chart = numberline( $( this ).width(), disagreementData );
            charts.push( [ chart, $chartbox[ 0 ] ] );
        } else {
            $('.data-placeholder--err', this).addClass( 'visible' );
        }

        $('.data-placeholder--box', this).remove();
    } );
};
