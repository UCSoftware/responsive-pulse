var $ = require( 'jquery' ),
    findAndReplaceDOMText = require( '../vendor/findAndReplaceDOMText' );

/**
 * Pulls in the jargon.json file (from public) and replaces any instances of jargon
 * in the page with a tooltip-wrapped version that includes a hover-definition.
 * @return {null}
 */
module.exports = function() {
    $.getJSON( '/data/jargon.json', function( jargon ) {
        var body = document.body;

        $.each( jargon, function( key, value ) {
            findAndReplaceDOMText( body, {
                find: new RegExp( '\\b' + key.replace( /([\[\]*.\\\/^$?!+\()])/g, '\$1' ), 'gi' ),
                replace: function( portion, match ) {
                    var el = $( '<span class="jargon--tooltip" data-tip="' + value.replace( /"/g, '\\"' ) + '"></span>' );
                    el.html( portion.text );
                    return el[ 0 ];
                }
            } );
        } );

        $( body ).find( '.jargon--tooltip[data-tip]' ).tooltipster( {
            functionBefore: function( origin, continueTooltip ) {
                origin.tooltipster( 'content', origin.data( 'tip' ) );
                continueTooltip();
            },
            theme: 'tooltipster-default'
        } );
    } );
};