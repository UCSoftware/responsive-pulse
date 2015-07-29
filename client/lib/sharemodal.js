var $ = require( 'jquery' ),
    cookie = require( './cookie' );

var $modal = $( '.modal--share' ).find( '.modal--body' ),
    $addBtn = $modal.find( '.share--new-submit a' ),
    $input = $modal.find( '.share--new-input input[name="email"]' );

$modal.on( 'click', '.share--list-remove', function( evt ) {
    var $item = $( evt.target ).closest( '.share--list-item' ),
        user = $item.data( 'email' );

    $item.addClass( 'share--list-item--disabled' );

    $.post( '/share/' + survey, {
        _csrf: $( '[name="_csrf"]' ).val(),
        remove: JSON.stringify( [ { email: user } ] )
    }, function( result ) {
        $modal.find( '.share--list-item[data-email="' + user + '"]' ).remove();

        if( !$modal.find( '.share--list-item:not(.share--list-item-template)' ).length ) {
            $( '.share--list' ).find( '.share--list-nobody' ).show();
        }
    } );
} );

$modal.on( 'change', '.share--list-permissions select', function( evt ) {
    var $select = $( evt.target ),
        $item = $select.closest( '.share--list-item' ),
        perms = [ {
            email: $item.data( 'email' ),
            permissions: [ $select.val() ]
        } ];

    $item.addClass( 'share--list-item--disabled' );

    $.post( '/share/' + survey, {
        _csrf: $( '[name="_csrf"]' ).val(),
        add: JSON.stringify( perms )
    }, function( result ) {
        $item.removeClass( 'share--list-item--disabled' );
    } );
} );

$addBtn.on( 'click', function( evt ) {
    var email = $input.val().split( /[,]/g ),
        perms = $.map( email, function( addr ) {
            return { email: addr, permissions: [ 'collaborator' ] }
        } );

    $input.val( '' );
    $addBtn.addClass( 'button--disabled' );

    $.post( '/share/' + survey, {
        _csrf: $( '[name="_csrf"]' ).val(),
        add: JSON.stringify( perms )
    }, function( result ) {
        $.each( result.add, function( idx, item ) {
            var $itm = $( '<li class="share--list-item"/>' ).attr( 'data-email', item.email ),
                $perms = $( '.share--list-item-template .share--list-permissions' ).clone( true ),
                $remove = $( '.share--list-item-template .share--list-remove' ).clone( true );

            if( activeSurveyUser && ( activeSurveyUser.perms.indexOf( 'owner' ) > -1 || activeSurveyUser.roles.indexOf( 'admin' ) > -1 ) ) {
                $perms.find( 'select' ).removeClass( 'share--list-permissions--hidden' );
                $perms.find( 'option' )
                    .attr( 'selected', false )
                    .filter( '[value="' + item.permissions[0] + '"]' )
                    .attr( 'selected', true );
            } else {
                var perm = item.permissions[0];
                perm = perm.split( ' ' )
                    .map( function( p ) { return p[0].toUpperCase() + p.slice(1).toLowerCase() } )
                    .join( ' ' );

                $perms.find( 'span' )
                    .removeClass( 'share--list-permissions--hidden' )
                    .html( perm );
            }

            $( '.share--list' ).find( '.share--list-nobody' ).hide();

            $itm
                .append(
                    item[ 'name' ] && item.name.length
                        ? $( '<div class="share--list-name"/>' )
                            .append( item.name + ' ' )
                            .append( $( '<span/>' ).html( '(' + item.email + ')' ) )
                        : $( '<div class="share--list-name"/>' )
                            .append( item.email )
                )
                .append( $perms )
                .append( activeSurveyUser && ( activeSurveyUser.perms.indexOf( 'owner' ) > -1 || activeSurveyUser.roles.indexOf( 'admin' ) > -1 )
                            ? $remove.removeClass( 'share--list-remove--hidden' )
                            : $remove.addClass( 'share--list-remove--hidden' )
                )
                .appendTo( '.share--list' );
        } );

        $addBtn.removeClass( 'button--disabled' );
    }, 'json' );

    return false;
} );
