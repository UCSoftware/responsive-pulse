// These export onto the jQuery namespace
var $ = require( 'jquery' );

require( './vendor/parsley.min' );
require( './vendor/chosen.jquery' );

console.log('Running input.js');

$( function() {
    $( '.form--chosen-select' ).chosen( { disable_search_threshold: 10 } );

    var formGroups = $('.form--group');
    if (formGroups.length) {
        formGroups.parsley({
            trigger: 'keypress change focusout',
            successClass: "form--element-valid",
            errorClass: "form--element-invalid",
            classHandler: function(el) {
                return el.$element.closest('.form--element');
            },
            errorsContainer: function( el ) {
                if( el.$element.closest( '.form--gridselect' ).length ) {
                    return el.$element.closest( '.form--gridselect-row' ).find( '.form--gridselect-question' );
                }

                return el.$element.closest('.form--area');
            },
            errorsWrapper: '<ul class="form--element-invalid-message"></ul>',
            errorTemplate: '<li></li>',
        });
    }

    $.listen('parsley:form:validated', function(formInstance) {
        window.setTimeout(function() {
            if (formInstance.validationResult === true) {
                console.log("VALID", formInstance);
                formInstance.$element.addClass("form--valid").removeClass("form--invalid");
                formInstance.$element.find(".button--primary").removeAttr("disabled");
            } else {
                console.log("INVALID", formInstance);
                formInstance.$element.addClass("form--invalid").removeClass("form--valid");
                formInstance.$element.find(".button--primary").attr("disabled", "disabled");
            }
        }, 100);
    });

    $.listen('parsley:field:success', function(fieldInstance) {
        if( fieldInstance.parent.isValid() ) {
            fieldInstance.parent.$element.find(".button--primary").removeAttr("disabled");
        }
    });

    // Editable readonly forms
    var readonlyForms = {
        enable: function(form, input) {
            this.reset();
            var passwordHolder = input.closest(".form--password");
            if (passwordHolder.length) {
                passwordHolder.addClass("form--password-active");
                var inputs = passwordHolder.find(".form--password-confirm input");
                inputs.each(function() {
                    $(this).removeAttr("readonly");
                });
                inputs[0].focus();
            } else {
                if (!input.data("last-value")) {
                    input.data("last-value", input.val());
                }
                var element = input.closest(".form--element");
                element.addClass("form--element-active");
                if (input) {
                    input.removeAttr("readonly");
                    input.focus();
                }
            }
            $(form).addClass("form--readonly-active");
        },
        disable: function(form) {
            var passwordHolder = $(form).find(".form--password");
            console.log(passwordHolder);
            if (passwordHolder.length) {
                passwordHolder.removeClass("form--password-active");
            }

            $(form).removeClass("form--readonly-active");
            $(form).find("input").each(function() {
                var lastValue = $(this).data("last-value");
                if (lastValue && lastValue != $(this).val()) {
                    var element = $(this).closest(".form--element");
                    element.addClass("form--element-edited");
                }
            });
            $(form).find(".form--element-active").removeClass("form--element-active");
            $(form).find("input").attr("readonly", "readonly");

            $(form).parsley().validate();
        },
        clear: function(form) {
            var inputs = form.find("input.form--element-control");
            console.log('Clearing inputs', inputs);
            inputs.each(function() {
                var lastValue = $(this).data("last-value");
                if (lastValue) {
                    $(this).val(lastValue);
                }
                $(this).closest(".form--element").removeClass("form--element-edited");
            });
            this.disable(form);
        },
        reset: function() {
            var self = this;
            $(".form--readonly").each(function() {
                self.disable($(this));
            });
        },
        save: function() {
            var self = this;
            $(".form--readonly").each(function() {
                $(this).find(".form--element").removeClass("form--element-edited");
                $(this).find("input").each(function() {
                    $(this).data("last-value", $(this).val());
                });
                $(this).find("button:disabled").removeAttr("disabled");
                self.disable($(this));
            });
        }
    };

    $(".form--readonly").each(function() {
        var form = $(this);
        form.find("input").keydown(function(e) {
            if (e.keyCode == 9) { // Tab
                var reverse = e.shiftKey;
                readonlyForms.disable(form);
                $(this).blur();
                var next = form.find(':input.form--element-control:eq(' + ($(':input.form--element-control').index(this) + (reverse ? -1 : 1)) + ')');
                if (!next.length) {
                    var next = form.find(':input.form--element-control:eq(0)');
                }
                if (next.length) {
                    readonlyForms.enable(form, next);
                    next.focus();
                }
                e.preventDefault();
            }
        });
        form.find(".form--element").click(function(e) {
            readonlyForms.enable(form, $(this).find('input'));
            e.preventDefault();
        });
        form.find(".button--form-change").click(function(e) {
            readonlyForms.enable(form, $(this).closest('.form--element').find('input'));
            e.preventDefault();
        });
        form.find(".button--clear-changes").click(function(e) {
            readonlyForms.clear(form);
            e.preventDefault();
        });
        form.submit(function(e) {
            console.log("Submitting");
            var action = form.attr("action");
            if (!action) {
                console.error("Form has no action set.");
                e.preventDefault();
                return;
            }

            form.find("button").attr("disabled", "disabled");
            form.addClass("form--submitting");

            $.post( action, form.serialize() )
                .done( function( data ) {
                    if( data.status === 'ok' ) {
                        readonlyForms.save();
                        form.addClass("form-submitted-success");
                        window.setTimeout(function() {
                            form.removeClass("form-submitted-success");
                        }, 4000);
                    } else {
                        // show error
                        form.addClass("form-submitted-fail");
                        window.setTimeout(function() {
                            form.removeClass("form-submitted-fail");
                        }, 4000);
                    }
                } );
            e.preventDefault();
        });
    });

    $(".form--password-reveal").each(function() {
        $(this).click(function(e) {
            var el = $(this).parent().find("input");
            el.attr("type", (el.attr("type") == "password" ? "text" : "password"));
            e.preventDefault();
        });
    });
} );
