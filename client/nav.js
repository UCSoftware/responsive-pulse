var $ = require( 'jquery' );

$(document).ready( function() {

    var hoverTimer;

    // nav toggling
    $('.dropdown').on('click', function(e){
        e.stopPropagation();
    });

    $('.dropdown').on( 'mouseenter', function(e) {
        clearTimeout(hoverTimer);
        $(this).addClass('is-active');
    });

    $('.dropdown').on( 'mouseleave', function(e) {
        hoverTimer = setTimeout( function(){
            $('.dropdown').removeClass('is-active');
        }, 200);
    });

});
