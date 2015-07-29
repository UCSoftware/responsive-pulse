// Fixes an issue with jquery.tooltipster not being AMD or CommonJS
var $ = require( 'jquery' );
global.jQuery = $;

var cookie = require( './lib/cookie' );
var nav = require( './nav' );

if( !cookie.cookiesEnabled() ) {
    document.getElementById( 'cookies' ).className = 'cookies--not-enabled';
}
