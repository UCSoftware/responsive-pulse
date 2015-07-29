var $ = require( 'jquery' );

var modalList = {};

var ModalObj = function(modalName) {

    this.name = modalName;
    this.object = $('.modal--' + this.name);

    this.open = function() {
        console.log('modal ' + this.name + ' opened');
        this.object.addClass('is-shown');

        $('.modal').on('click', $.proxy( function(e) {
            this.close();
        }, this));

        $('.modal--body').on('click', function(e) {
            e.stopPropagation();
        });

        $('.modal--close').on('click', $.proxy( function(e) {
            this.close();
        }, this));
    },

    this.close = function() {
        console.log('modal ' + this.name + ' closed');
        this.object.removeClass('is-shown');
    }
};

var modal = function(modalName) {

    if( !( modalName in modalList ) ) {
        modalList[ modalName ] = new ModalObj( modalName );
    };

    return modalList[ modalName ];

};

module.exports = modal;