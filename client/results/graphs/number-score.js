var $ = require( 'jquery' ),
    d3 = require( '../../vendor/d3' );

module.exports = function( charts, data, responses, colors, calculate ) {
    $( '.number.score' ).each( function() {
        var $score = $( this );

        var chart = function( _, filters ) {
            var sum = 0;

            data.survey.overalls.forEach( function( row, rdx ) {
                row.forEach( function( column, cdx ) {
                    sum += calculate.columnScore( responses, column ) * 100;
                } );
            } );

            var average = Math.round( sum / ( data.survey.overalls.length * data.survey.columns.length ) );
            var oldAverage = $score.data('average');
            var diff = Math.round((average - oldAverage) / oldAverage * 100);

            var activeFilterNum = filters && filters.length;

            if( activeFilterNum ) {
                $('.ovw-scoring--responses-total').addClass('is-shown');
                $('.ovw-scoring--reset').addClass('is-shown');

                if (diff !== 0) {
                    $('.ovw-scoring--score-diff').addClass('is-shown');
                    $('.score-diff-num').addClass('is-shown').html(diff + '%');
                } else {
                    $('.ovw-scoring--score-diff').removeClass('is-shown');
                }

                if (diff > 0) {
                    $('.score-diff-up').addClass('is-shown');
                    $('.score-diff-down').removeClass('is-shown');
                    $('.score-diff-num').attr('class', 'score-diff-num score-diff-up is-shown');
                } else if (diff < 0) {
                    $('.score-diff-up').removeClass('is-shown');
                    $('.score-diff-down').addClass('is-shown');
                    $('.score-diff-num').attr('class', 'score-diff-num score-diff-down is-shown');
                } else {
                    $('.score-diff-up').removeClass('is-shown');
                    $('.score-diff-down').removeClass('is-shown');
                    $('.score-diff-num').attr('class', 'score-diff-num');
                }
            } else {
                $('.ovw-scoring--score-diff').removeClass('is-shown');
                $('.ovw-scoring--responses-total').removeClass('is-shown');

                $('.score-diff-num').removeClass('is-shown');
                $('.ovw-scoring--reset').removeClass('is-shown');
                $('.score-diff-up').removeClass('is-shown');
                $('.score-diff-down').removeClass('is-shown');
            }

            console.log('Diff', diff, activeFilterNum);

            $score.html( average );
            $score.data('average', average);
        };

        charts.push( [ chart, this ] );
        $('.data-placeholder--box', this).remove();
    } );
};
