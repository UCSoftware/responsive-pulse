// Calculate an individual column score
exports.columnScore = function( responses, column, filter ) {
    var values = responses.dimension( function( d ) { return d[ column ]; } ),
        numResponses = 0;

    if( filter )
        values.filter( d );

    var valueResults = values.group().all(),
        valueResultsByKey = {};
    valueResults.forEach( function( vr ) {
        if( vr.key !== -1 ) {
            valueResultsByKey[ vr.key ] = vr.value;
            numResponses += vr.value;
        }
    } );

    // Make room for more dimensions
    values.dispose();

    return (
        ( valueResultsByKey[ 1 ] || 0 ) +
        ( ( valueResultsByKey[ 2 ] || 0 ) * 2 ) +
        ( ( valueResultsByKey[ 3 ] || 0 ) * 3 ) +
        ( ( valueResultsByKey[ 4 ] || 0 ) * 4 )
    ) / ( numResponses * 4 );
};

// Calculate overall scores
exports.scores = function( data, responses ) {
    var columnTotal = [],
        overallScores = [];

    data.survey.overalls.forEach( function( row, rdx ) {
        var rowTotal = 0,
            rowData = [];

        row.forEach( function( column, cdx ) {
            var total = exports.columnScore( responses, column ),
                percentage = Math.round( total * 100 );

            // Tabulate row total
            rowTotal += total;
            rowData.push( total );

            // Tabulate column total
            if( !columnTotal[ cdx ] )
                columnTotal[ cdx ] = total;
            else
                columnTotal[ cdx ] += total;
        } );

        // Add row average
        rowTotal /= row.length;
        rowData.push( rowTotal );

        overallScores.push( rowData );
    } );

    columnTotal = columnTotal.map( function( a ) { return a / data.survey.rows.length; } );
    columnTotal.push( columnTotal.reduce( function( a, b ) { return a + b; } ) / data.survey.columns.length );

    overallScores.push( columnTotal );

    return overallScores;
};

// Calculate scores and only return the total average
exports.totalAverage = function( data, responses ) {
    var scores = exports.scores( data, responses ),
        averagesRow = scores[ scores.length - 1 ];

    return averagesRow[ averagesRow.length - 1 ];
};
