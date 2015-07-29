var mongoose = require( 'mongoose' ),
    Schema = mongoose.Schema;

var surveyResponseSchema = new Schema( {
    surveyId: Schema.Types.ObjectId,
    response: Schema.Types.Mixed,
    started: { type: Date, default: Date.now },
    submitted: { type: Date, default: null }
} );

surveyResponseSchema.post( 'save', function( resp ) {
    if( resp.submitted ) {
        mongoose.model( 'Survey' ).updateScore( resp.surveyId );
    }
} );

module.exports = mongoose.model( 'SurveyResponse', surveyResponseSchema );
