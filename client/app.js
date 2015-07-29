if( !window.console ) { window.console = {}; }
if( !console.log ) { console.log = function() {}; }

var $ = require( 'jquery' ),
    d3 = require( './vendor/d3' ),
    Color = require( 'color' ),

    Spinner = require( './lib/spinner' ),
    modal = require( './lib/modal' ),
    sharemodal = require( './lib/sharemodal' ),
    jargonizer = require( './lib/jargonizer' ),

    surveyResults = require( './results/index' );

// These export onto the jQuery namespace
require( './vendor/jquery.tooltipster.min' );
require( './vendor/parsley.min' );
require( 'rangeslider.js' ); // this is just the name of the package
require( './input' );

console.log( 'Running app.js' );

var spinner = new Spinner();

$( '.tooltip' ).each( function() {
    $( this ).tooltipster( {
        contentAsHTML: true,
        theme: 'tooltipster-default ' + $( this ).attr( 'class' ).replace( /tooltip\s?/, '' )
    } );
} );

$( 'input[type="range"]' ).rangeslider( {
    polyfill: false
} ).on( 'change', function() {
    var area = $(this).closest( '.form--element-control' );
    var left = area.find( '.rangeslider__handle' ).css( 'left' );
    var tip = area.find( '.range-value' );
    tip.css( 'left', left );
    tip.find( '.range-value-label' ).html( $( this ).val() );
} );


$( '.get_link' ).click( function( e ) {
    e.preventDefault();
    $( '.link-popup' ).toggleClass( 'visible' );
    $( '.link-popup input' ).focus().select();
} );

$( document ).on( 'click', function() {
    $( '.nav--toggle' ).removeClass( 'shown' );
} );

$( '.nav--toggle' ).on( 'click', function( e ) {
    e.stopPropagation();
} );

$( '.nav--toggle-button' ).on( 'click', function(e) {
    $( '.nav--toggle' ).toggleClass( 'shown' );
} );

// responsive tables
$( '.table-wrapper' ).on( 'scroll', function() {
    $( '.row-header' ).css( 'left', $( this ).scrollLeft() );
} );

var chart = d3.selectAll( '.chart, .table, .filter' ),
    firstRender = true,
    charts = [];

// bind click handlers to modal links
$( '.modal--open' ).on( 'click', function() {
    modal( $( this ).attr( 'data-modalname' ) ).open();
} );

function getRandomArbitrary(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function updateNumberPlaceholder(el, index) {
    if (!el.context.parentNode) {
        window.clearTimeout(dataPlaceholderIntervals[index]);
        return;
    }

    var rand = getRandomArbitrary(1, 100);
    el.html(rand);
}

var dataPlaceholderIntervals = {};

function showDataPlaceholders() {
    $('.data-placeholder--number').each(function(i) {
        var el = $(this);
        dataPlaceholderIntervals[i] = window.setInterval(function() {
            updateNumberPlaceholder(el, i);
        }, 50);
    });
}

// Survey graphs
$( function() {
    showDataPlaceholders();

    if( typeof survey !== 'undefined' ) {
        spinner.loading( 'survey' );
        surveyResults.init();
        jargonizer();
    }
} );
