var fs = require( 'fs' ),
    config = require( '../config' ),
    surveys = {};

exports.requiredFields = [
    'org_years',
    'management_layers',
    'org_position',
    'org_traction',
    'team'
];

exports.getCurrentSurvey = function() {
    return exports.getSurvey( config.surveyVersion );
};

exports.getSurvey = function( id ) {
    if( !surveys[ id ] ) {
        try {
            surveys[ id ] = JSON.parse(
                fs.readFileSync( __dirname + '/../surveys/' + id + '.json', 'utf-8' )
            );
        } catch( err ) {
            console.warn( 'Unable to read survey template "' + id + '":', err );
            return {};
        }
    }

    return surveys[ id ];
};

exports.validateCurrentSurvey = function() {
    var fieldError = [],
        requiredFields = exports.requiredFields.slice(),
        survey = exports.getCurrentSurvey();

    survey.pages.forEach( function( page ) {
        page.fields.forEach( function( field ) {
            if( !field[ 'type' ] ) {
                fieldError.push( 'Field "' + field[ 'name' ] + '" missing required "type" attribute' );
            } else if( field.type !== 'gridselect' && !field[ 'name' ] ) {
                console.warn( '[Warning] Field in survey missing name in survey version', config.surveyVersion, '\n', field );
            } else if( requiredFields.indexOf( field.name ) > -1 ) {
                requiredFields.splice( requiredFields.indexOf( field.name ), 1 );
            } else if( field.type === "gridselect" ) {
                for( var key in field.options ) {
                    if( requiredFields.indexOf( key ) > -1 ) {
                        requiredFields.splice( requiredFields.indexOf( key ), 1 );
                    }
                }
            }
        } );
    } );

    if( fieldError.length ) {
        fieldError.forEach( function( err ) {
            console.error( '[Error]', err, 'in survey version', config.surveyVersion );
        } );
    }

    if( requiredFields.length ) {
        console.error(
            '[Error] Missing required survey field' + ( requiredFields.length > 1 ? 's' : '' ),
            '"' + requiredFields.join( '", "' ) + '"',
            'in survey version',
            config.surveyVersion
        );
    }

    return ( !fieldError.length && !requiredFields.length ) ? true : false;
};
