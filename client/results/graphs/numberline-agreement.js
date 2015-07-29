var $ = require( 'jquery' ),
    d3 = require( '../../vendor/d3' ),
    numberline = require( '../../graphs/numberline' );

module.exports = function( charts, data, responses, colors, calculate ) {
    $( '.chart.numberline.agreement' ).each( function() {
        var $this = $( this ),
            domain = $( this ).data( 'domain' ),
            domainIdx,
            closest = {
                q: null,
                leadership: 0,
                team: 4
            };

        $.each( data.survey.columns, function( idx, col ) {
            if( col.title === domain ) {
                domainIdx = idx;
            }
        } );

        data.survey.overalls.forEach( function( row, rdx ) {
            // filter by distance from leadership (d['management_layers'])
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

            if( Math.abs( leadership - team ) <= Math.abs( closest.leadership - closest.team ) ) {
                closest.leadership = leadership;
                closest.team = team;
                closest.q = row[ domainIdx ];
            }
        } );

        var closestQuestion;
        data.survey.pages.filter( function( page, pdx ) {
            return page.fields.filter( function( field, fdx ) {
                if( field.type === 'gridselect' ) {
                    for( var key in field.options ) {
                        if( key === closest.q ) {
                            closestQuestion = field.options[ key ];
                            return true;
                        }
                    }

                    return false;
                }
            } );
        } );

        var $chartbox = $( '<div />' );
        $this.append( $chartbox );
        $this.append( $( '<p/>' ).html( closestQuestion ) );

        if( closest.q !== null ) {
            var agreementData = [ closest.leadership, closest.team ];
            if( Math.abs( agreementData[ 0 ] - agreementData[ 1 ] ) <= 0.01 ) {
                agreementData = [ ( agreementData[ 0 ] + agreementData[ 1 ] ) / 2 ];
                $( this ).prev( '.legend' ).find( '.agreement' ).addClass( 'show' );
            }

            var chart = numberline( $( this ).width(), agreementData );
            charts.push( [ chart, $chartbox[ 0 ] ] );
        } else {
            $('.data-placeholder--err', this).addClass( 'visible' );
        }


        $('.data-placeholder--box', this).remove();
    } );
};
