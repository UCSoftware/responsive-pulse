if( !window.console ) { window.console = {}; }
if( !console.log ) { console.log = function() {}; }

var $ = require( 'jquery' );

// These export onto the jQuery namespace
require( 'rangeslider.js' ); // this is just the name of the package
require( './vendor/jquery.tooltipster.min' );
require( './vendor/parsley.min' );

require( './input.js' );
require( './lib/jargonizer' )();

$( function() {
    $( '.tooltip' ).each( function() {
        $( this ).tooltipster( {
            contentAsHTML: true,
            theme: 'tooltipster-default ' + $( this ).attr( 'class' ).replace( /tooltip\s?/, '' )
        } );
    } );

    $( 'input[type="range"]' ).rangeslider({
        polyfill: false,
        onSlide: function(position, value) {
            var area = $(this.$element).closest('.form--element-control');
            var left = area.find('.rangeslider__handle').css('left');
            var tip = area.find('.range-value');
            tip.css('left', left);
            tip.find('.range-value-label').html(value);
        }
    });

    $('.get_link').click( function(e){
        e.preventDefault();
        $('.link-popup').toggleClass('visible');
        $('.link-popup input').focus().select();
    });

    $(document).on('click', function(){
        $('.nav--toggle').removeClass('shown');
    });

    $('.nav--toggle').on('click', function(e){
        e.stopPropagation();
    })

    $('.nav--toggle-button').on( 'click', function(e) {
        $('.nav--toggle').toggleClass('shown');
    });

    //responsive tables

    $('.table-wrapper').scroll( function(){
        $('.row-header').css('left', $(this).scrollLeft());
    })

    //teamselect click handler

    $('.teamselect--dropdown').change(function() {
        if ($(this).find("option:selected").attr("value") === "newteam") {
            $(this).removeClass('is-shown').attr("name", "");
            $('.teamselect--text').addClass('is-shown').focus().attr("name", "team");
        };
    });

    $('.teamselect--text').blur(function() {
        if (!$(this).val()) {
            $(this).removeClass('is-shown');
            $('.teamselect--dropdown').addClass('is-shown').find('option').prop('selected', false);
        }
    });
} );
