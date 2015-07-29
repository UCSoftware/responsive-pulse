var mongoose = require( 'mongoose' ),
    crossfilter = require( 'crossfilter' ),
    Schema = mongoose.Schema,
    config = require( '../config' ),
    surveyTemplate = require( '../lib/survey_template' ),
    mongoosePaginate = require('mongoose-paginate'),
    textSearch = require('mongoose-text-search');

var surveyUserPermissions = {
    values: [ 'creator', 'owner', 'collaborator' ],
    message: '{VALUE} is not a valid permission type.'
};

var surveyIndustry = {
    values: [
        'Accounting','Airlines/Aviation','Alternative Dispute Resolution','Alternative Medicine','Animation','Apparel & Fashion','Architecture & Planning','Arts and Crafts','Automotive','Aviation & Aerospace',
        'Banking','Biotechnology','Broadcast Media','Building Materials','Business Supplies and Equipment','Capital Markets','Chemicals','Civic & Social Organization','Civil Engineering','Commercial Real Estate',
        'Computer & Network Security','Computer Games','Computer Hardware','Computer Networking','Computer Software','Construction','Consumer Electronics','Consumer Goods','Consumer Services','Cosmetics','Dairy',
        'Defense & Space','Design','Education Management','E-Learning','Electrical/Electronic Manufacturing','Entertainment','Environmental Services','Events Services','Executive Office','Facilities Services',
        'Farming','Financial Services','Fine Art','Fishery','Food & Beverages','Food Production','Fund-Raising','Furniture','Gambling & Casinos','Glass, Ceramics & Concrete','Government Administration',
        'Government Relations','Graphic Design','Health, Wellness and Fitness','Higher Education','Hospital & Health Care','Hospitality','Human Resources','Import and Export','Individual & Family Services',
        'Industrial Automation','Information Services','Information Technology and Services','Insurance','International Affairs','International Trade and Development','Internet','Investment Banking',
        'Investment Management','Judiciary','Law Enforcement','Law Practice','Legal Services','Legislative Office','Leisure, Travel & Tourism','Libraries','Logistics and Supply Chain','Luxury Goods & Jewelry',
        'Machinery','Management Consulting','Maritime','Market Research','Marketing and Advertising','Mechanical or Industrial Engineering','Media Production','Medical Devices','Medical Practice',
        'Mental Health Care','Military','Mining & Metals','Motion Pictures and Film','Museums and Institutions','Music','Nanotechnology','Newspapers','Non-Profit Organization Management','Oil & Energy',
        'Online Media','Outsourcing/Offshoring','Package/Freight Delivery','Packaging and Containers','Paper & Forest Products','Performing Arts','Pharmaceuticals','Philanthropy','Photography','Plastics',
        'Political Organization','Primary/Secondary Education','Printing','Professional Training & Coaching','Program Development','Public Policy','Public Relations and Communications','Public Safety',
        'Publishing','Railroad Manufacture','Ranching','Real Estate','Recreational Facilities and Services','Religious Institutions','Renewables & Environment','Research','Restaurants','Retail',
        'Security and Investigations','Semiconductors','Shipbuilding','Sporting Goods','Sports','Staffing and Recruiting','Supermarkets','Telecommunications','Textiles','Think Tanks','Tobacco',
        'Translation and Localization','Transportation/Trucking/Railroad','Utilities','Unknown','Venture Capital & Private Equity','Veterinary','Warehousing','Wholesale','Wine and Spirits','Wireless',
        'Writing and Editing'
    ],
    message: '{VALUE} is not a valid industry option.'
};

var surveyOrgSize = {
    values: [
        '1 - 49', '50 - 299', '299 - 999', '1,000 - 4,999', '5000 or more', 'Not known'
    ],
    message: '{VALUE} is not a valid organization size selection.'
};

var surveyUserSchema = new Schema( {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    permissions: [ { type: String, enum: surveyUserPermissions } ],
    active: { type: Boolean, default: true }
} );

var surveySchema = new Schema( {
    key: String,
    title: { type: String, required: true },
    title_lower: String,

    orgSize: { type: String, enum: surveyOrgSize, required: true },
    orgAge: { type: Number, required: true },
    industry: { type: String, enum: surveyIndustry, required: true },
    orgLeader: { type: String, required: true },
    orgLeaderRole: { type: String, required: true },

    welcomeMessage: { type: String },

    responseCount: { type: Number, default: 0 },
    lastUpdate: { type: Date, default: null },
    createdAt: { type: Date, default: null },

    score: { type: Number, default: 0 },
    users: [ surveyUserSchema ],
    creator: { type: Schema.Types.ObjectId, ref: 'User' },
    version: { type: String, default: config.surveyVersion },
    responses: [ Schema.Types.Mixed ]
} );
surveySchema.plugin(mongoosePaginate);
surveySchema.plugin(textSearch);
surveySchema.index({ title: 'text' });

surveySchema.pre( 'save', function( next ) {
    if( this.isNew ) {
        this.createdAt = new Date();

        var rand = 10000 + Math.ceil( Math.random() * 89999 );
        this.key = this.title.replace( /[^a-zA-Z0-9]/g, '-' )
                            .replace( /-{2,}/g, '-' )
                            .toLowerCase()
                            .slice( 0, 20 )
                            .replace( /-$/, '' )
                            + '-' + rand;
    }

    next();
} );

surveySchema.static( 'updateScore', function( surveyId, done ) {
    mongoose.model( 'Survey' ).findOne( { _id: surveyId }, function( err, survey ) {
        var template = surveyTemplate.getSurvey( survey.version ),
            calculate = require( '../lib/calculations/' + template.render );

        survey.lastUpdate = Date.now();

        mongoose.model( 'SurveyResponse' ).find( { surveyId: survey.id, submitted: { $ne: null } }, function( err, responses ) {
            responses = responses.map( function( resp ) { return resp.response; } );

            survey.responseCount = responses.length;
            survey.score = calculate.totalAverage( { survey: template }, crossfilter( responses ) ) || 0;
            survey.save( done || function(){ console.log( arguments )} );
        } );
    } );
} );

surveySchema.virtual( 'age' ).get( function() {
    return ( Date.now() - this.lastUpdate ) / 60 / 60 / 1000;
} );

surveySchema.static( 'validPermissions', function() {
    return surveyUserPermissions.values.filter( function( perm ) {
        return perm !== 'creator';
    } );
} );

surveySchema.static( 'industries', function() {
    return surveyIndustry.values;
} );

surveySchema.static( 'orgSizes', function() {
    return surveyOrgSize.values;
} );

module.exports = mongoose.model( 'Survey', surveySchema );
