if( !window.console ) { window.console = {}; }
if( !console.log ) { console.log = function() {}; }

var $ = require( 'jquery' ),
    ZeroClipboard = require( './vendor/ZeroClipboard.min' );

// These export onto the jQuery namespace
require( './vendor/jquery.tooltipster.min' );
require( './vendor/stupidtable.min' );

$('.table--expand-button').click( function(e){
    $(this).closest('tr').toggleClass('expanded');
    e.preventDefault();
} );

$( '#select-all' ).change(function() {
    var elems = $('.table--checkbox .form--element-control');
    if (this.checked) {
        elems.each(function() {
            this.checked = true;
        });
    } else {
        elems.each(function() {
            this.checked = false;
        });
    }
});


(function($) {
    var re = /([^&=]+)=?([^&]*)/g;
    var decode = function(str) {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    };
    $.parseParams = function(query) {
        var params = {}, e;
        if (query) {
            if (query.substr(0, 1) == '?') {
                query = query.substr(1);
            }

            while (e = re.exec(query)) {
                var k = decode(e[1]);
                var v = decode(e[2]);
                if (params[k] !== undefined) {
                    if (!$.isArray(params[k])) {
                        params[k] = [params[k]];
                    }
                    params[k].push(v);
                } else {
                    params[k] = v;
                }
            }
        }
        return params;
    };
})(jQuery);

function setMultipleActive(val) {
    var elems = $('.table--checkbox .form--element-control:checked');
    var keys = [];
    elems.each(function() {
        keys.push($(this).closest('tr').data('key'));
    });
    window.location = '/dashboard/multiple-active?val=' + (val ? 1 : 0) + '&keys=' + JSON.stringify(keys) + '&all=0';
}

$( '.button--mark-inactive' ).click(function() {
    setMultipleActive(false);
});

$( '.button--mark-active' ).click(function() {
    setMultipleActive(true);
});

var activeSorting = $('table.sortable th.sorting-no-icon');

$( 'table.sortable th' ).each( function(idx, el) {
    var key = $(el).data('sort-key');
    if (!key) {
        return;
    }

    $(el).click(function() {
        var map = $.parseParams( document.location.search );
        map.sort = key;
        map.page = 1;
        if (key == activeSorting.data('sort-key')) {
            map.dir = activeSorting.hasClass('sorting-asc') ? 'desc' : 'asc';
        }
        window.location = '/dashboard?' + $.param(map);
    });
});

$( '.dashboard--copy' ).each( function( idx, el ) {
    $( el ).attr( 'data-clipboard-text',
        window.location.protocol.replace( ':', '' )
        + '://'
        + window.location.host
        + $( el ).data( 'url' )
    );

    ZeroClipboard.config( { swfPath: "/vendor/ZeroClipboard.swf" } );
    var client = new ZeroClipboard( el );

    client.on( 'ready', function( readyEvent ) {
        client.on( 'beforecopy', function( event ) {
            $( event.target ).removeClass( 'dashboard--zc-copied' );
        } );

        client.on( 'aftercopy', function( event ) {
            $( event.target ).addClass( 'dashboard--zc-copied' );
        } );
    } );
} );

//click handlers for table sorting
$( 'main' ).show();
