var $ = require( 'jquery' ),
    d3 = require( '../../vendor/d3' );

module.exports = function( charts, data, responses, colors ) {
    $( '.number.responses' ).each( function() {
        var $number = $( this );

        var chart = function() {
            // filter by distance from CEO (d['management_layers'])
            var filterData = responses.dimension( function( d ) { return d[ 'management_layers' ]; } );
            var num = filterData.group().all().reduce( function( pV, cV ) { return pV + cV.value; }, 0 );

            console.log('Responses', num);
            $number.html( num );
            filterData.dispose();
        };

        var filterData = responses.dimension( function( d ) { return d[ 'management_layers' ]; } );
        var num = filterData.group().all().reduce( function( pV, cV ) { return pV + cV.value; }, 0 );

        console.log('Filter data:', filterData);
        console.log("UPDATING");
        $('.ovw-scoring--responses-total').html('of ' + num);

        charts.push( [ chart, this ] );
        $('.data-placeholder--box', this).remove();
    } );
};