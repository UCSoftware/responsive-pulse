var $ = require( 'jquery' ),
    _ = require( 'lodash' ),
    crossfilter = require( 'crossfilter' );

module.exports = function( charts, data, responses, colors, calculate ) {
    var column, question;
    var $column, $question;

    var chart = function( div ) {
        var $div = $( div[0] ),
            dim = responses.dimension( function( r ) { return r; } ),
            filteredResp = dim.top( Infinity );

        var teamList = _.reduce( filteredResp, function( reduced, resp ) {
            reduced[ resp.team ] = [];
            return reduced;
        }, {} );

        var teams = _.keys( teamList ).sort();

        var minLayers = _.min( filteredResp, function( resp ) { return parseInt( resp.management_layers ); } ),
            maxLayers = _.max( filteredResp, function( resp ) { return parseInt( resp.management_layers ); } ),
            layerRange = _.range( parseInt( minLayers.management_layers ), parseInt( maxLayers.management_layers ) + 1 );

        var layerList = _.reduce( layerRange, function( list, layer ) {
            list[ layer ] = _.cloneDeep( teamList );
            return list;
        }, {} );

        filteredResp = filteredResp.reduce( function( reduced, resp ) {
            var layer = parseInt( resp.management_layers ),
                team = resp.team;

            reduced[ layer ][ team ].push( resp );

            return reduced;
        }, layerList );

        filteredResp = _.mapValues( filteredResp, function( teams, layer ) {
            return _.mapValues( teams, function( resps, team ) {
                if( resps.length ) {
                    var crossResp = crossfilter( resps );
                    if( column ) {
                        var colNum = _.findIndex( data.survey.columns, { title: column } );
                        return calculate.scores( data, crossResp )[ colNum ] || 0;
                    } else if( question ) {
                        var score = data.responses.reduce( function( total, resp ) {
                            console.log(resp);
                            if( parseInt( resp[ question ] ) > -1 ) {
                                total.sum += parseInt( resp[ question ] );
                                total.count++;
                            }

                            return total;
                        }, { sum: 0, count: 0 } );

                        console.log( score );

                        return ( ( score.sum / score.count ) / 4 );
                    } else {
                        return calculate.totalAverage( data, crossResp ) || 0;
                    }
                } else {
                    return 0;
                }
            } );
        } );

        dim.dispose();

        $div.find( 'table, .table--responsiveness-wrap, .table--responsiveness-legend, .table--responsiveness-axis' ).remove();

        var $tableWrap = $( '<div class="table--responsiveness-wrap"/>' ).appendTo( $div ),
            $table = $( '<table/>' ).appendTo( $tableWrap ),
            $thead = $( '<thead/>' ).appendTo( $table ),
            $tbody = $( '<tbody/>' ).appendTo( $table ),
            $header = $( '<tr/>' );

        // Team names
        _.forEach( teams, function( team ) { $header.append( $( '<th title="' + team + '">' + team + '</th>' ) ); } );
        $header.appendTo( $thead );

        // Axes
        var legend =
            '<div class="table--responsiveness-legend">' +
                '<div class="table--responsiveness-legend-label">&larr; Less Responsive</div>' +
                '<div class="table--responsiveness-legend-label">More Responsive &rarr;</div>' +
            '</div>';

        var axes =
            '<div class="table--responsiveness-axis table--responsiveness-axis-x">Team</div>' +
            '<div class="table--responsiveness-axis table--responsiveness-axis-y">Levels from leader</div>';

        $tableWrap.before( axes );
        $tableWrap.after( legend );

        // Table for layers
        $tableWrap.before( '<table class="table--responsiveness-axis-y-values">' + _.map( layerRange, function( layer ) {
            return '<tr><th>' + layer + '</th></tr>';
        } ).join( '' ) + '</table>' );

        _.forEach( layerRange, function( layer ) {
            var teams = filteredResp[ layer ],
                $row = $( '<tr/>' );

            _.forEach( teams, function( score, team ) {
                var blended = colors.blue.clone().mix( colors.green, score );
                $row.append( '<td style="background:' + blended.rgbString() + ';">&nbsp;</td>' );
            } );

            $row.appendTo( $tbody );
        } );

        setTimeout( function() {
            $( 'body' ).trigger( 'sticky_kit:recalc' );
        }, 150 );
    };

    var filterChart = function( evt ) {
        var $this = $( this );
        column = $this.val();
        question = null;
        $question.val( '' ).find( 'option' ).eq( 0 ).attr( 'selected', true );
        chart( $this.data( 'div' ) );
    };

    var filterChartByQuestion = function( evt ) {
        var $this = $( this );
        column = null;
        $column.val( '' ).find( 'option' ).eq( 0 ).attr( 'selected', true );
        question = $this.val();
        chart( $this.data( 'div' ) );
    };

    $( '.chart.table.responsiveness' ).each( function() {
        var $select = $column = $( '<select/>' );
        $select.data( 'div', [ this ] ).on( 'change', filterChart );
        $select.append( '<option value="">Filter by trait</option>' );
        _.forEach( data.survey.columns, function( col ) {
            $select.append( '<option value="' + col.title + '">' + col.title + '</option>' );
        } );
        $select.prependTo( this );

        var $qSelect = $question = $( '<select/>' );
        $qSelect.data( 'div', [ this ] ).on( 'change', filterChartByQuestion );
        $qSelect.append( '<option value="">Filter by question</option>' );
        _.forEach( data.survey.pages, function( page ) {
            var inputs = [];

            _.forEach( page.fields, function( field ) {
                if( field.type === 'gridselect' ) {
                    _.forEach( field.options, function( value, key ) {
                        inputs.push( '<option value="' + key + '">' + ( value.positive ? value.positive : value ) + '</option>' );
                    } );
                }
            } );

            if( inputs.length ) {
                $qSelect.append( '<option value="" disabled>' + page.title + '</option>' );
                $qSelect.append( inputs );
            }
        } );
        $qSelect.prependTo( this );

        $( '.data-placeholder--box', this ).remove();

        charts.push( [ chart, this ] );
    } );
};
