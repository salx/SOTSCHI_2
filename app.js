/*
ToDo:
Stacked Layout
delete all countries with none (now deleted in data)
implement calculation for rankings 

Sonderzeichen?

    . nach sort domain x neu setzen
    . transition select all .weightedBar
*/

(function(){
	var margin = {top: 60, right: 110, bottom: 80, left: 90},
        width = 763 - margin.left - margin.right,
        height = 509 - margin.top - margin.bottom
        half = width/2-1;

    //ordinal scale for countries
    var y = d3.scale.ordinal()
        .rangeRoundBands([height, 0], 0.2);

    //vertikal scale for score
    var x = d3.scale.linear()
    	.range([half, 0]);

    var x1 = d3.scale.linear()
        .range([0, half])

    //xAxis(Score, medals)
    var xAxis = d3.svg.axis()
    	.scale(x)
    	.orient("top");

    var xAxis1 = d3.svg.axis()
        .scale(x1)
        .orient("top");

    //later: tip, medals, country etc.
    var tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-10,0])
        .html( function(d){return "<text>" + d.Deutsche_Bezeichnung + ":</br>" + d.Gold + " Gold, " 
            + d.Silber + " Silber, " + d.Bronze + " Bronze, </br> Medaillen: "
            + d.Summe + "</br>Medaillen-Punkte: " + d.Score + "</text>"})

    var svg = d3.select("body")
    	.append("svg")
    	.attr("width", width + margin.left + margin.right)
    	.attr("height", height + margin.top + margin.bottom)
    	.append("g")
    	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.call(tip);

    var data;
    var input = "offiziell";

    function weightedAxis( label ){
        d3.selectAll(".weightedAxis")
            .remove();

        svg.append("g")
            .attr("class", "x axis weightedAxis")
            .attr('transform', 'translate('+ (half + margin.left )+ ',' + (height +30)+')')
            .call(xAxis1)
            .append("text")
            .attr("x", 260)
            .attr("y", 10)
            .attr("dy", "0.71em")
            .style("text-anchor", "end")
            .text(label);
    }

    function sortData( ) {
      data.sort(function(a, b) {
        if (input === 'offiziell') {
          return b["Offizieller Rang"]-a["Offizieller Rang"];
        } else if( input === "gdp" ) {
            return b["GDP_gew_Rang"]-a["GDP_gew_Rang"];
        } else if ( input === "team"){
            return b["Teilnehmer gew Rang"]-a["Teilnehmer gew Rang"];
        } else if( input === "population" ){
            return b["Bev_gew_Rang"]-a["Bev_gew_Rang"];
        }
      });
    }

    d3.csv("Sotschi.csv", function(error, result){
        data = result;
        var numberKeys="Gold,Silber,Bronze,Summe,Score,Offizieller Rang,Teilnehmer gew Rang,GDP_gew_Rang,Bev_gew_Rang,Bevoelkerung,Teilnehmer".split(",");

        data.forEach( function(d){ 
            numberKeys.forEach( function(key){ d[key] = parseInt(d[key]) } );   
            d.GDP = parseInt( d.GDP.replace(/\./g, ''));
            d.weightedGDP = (d.Score/d.GDP *1000000000);
            d.weightedTeam =(d.Score/d.Teilnehmer);
            d.weightedPopulation = (d.Score/d.Bevoelkerung)*100000;
            console.log( d.Teilnehmer, d.weightedTeam)
        } );


      sortData( );

    	//set the domains
    	y.domain(data.map(function(d) { return d.Deutsche_Bezeichnung } ));

    	function key( name ) {
    		return function(d) {
    			return d[name];
    		}
    	}

    	var scores = data.map( key("Score") );
    	x.domain([0, d3.max(scores)]);
        x1.domain([0, d3.max(scores)]);

    	svg.append("g")
    		.attr("class", "x axis")
            .attr('transform', 'translate(' + margin.left + ',' + (height +30)+')')
    		.call(xAxis)
    		.append("text")
    		.attr("x", 60)
            .attr("y", 10)
    		.attr("dy", "0.71em")
    		.style("text-anchor", "end")
    		.text("Medaillen-Punkte");

        weightedAxis( 'initial label' );

    	var countries = svg.selectAll(".countries")
    		.data(data)
    		.enter()
    		.append("g")
    		.attr("class", "countries")
    		.attr("transform", function(d){ return "translate(0," + y(d.Deutsche_Bezeichnung) + ")" })
            .on("mouseover", tip.show)
            .on("mouseout", tip.hide);

    	countries
    		.append("rect")
            .attr("class", "bar")
    		.attr("height", y.rangeBand())
    		.attr("x", function(d) {
                return 0 + margin.left+(half-x1(d.Score))
            })
    		.attr("width", function(d){
    			return x1(d.Score);
    		})
    		.attr("fill", "#6b486b");
            
        countries.append("rect")
            .attr("class", "bar weightedBar")
            .attr("height", y.rangeBand())
            .attr("x", half + margin.left )
            .attr("width", function(d){
                return half-x(d.Score);
            })
            .attr("fill", "#6b486b");

    	countries.append( 'text' )
    	    .attr( 'class', 'label' )
    	    .attr( 'y', y.rangeBand() )
            .attr( 'x', -30 )
    	    .attr("text-anchor", "start")
    	    .text( function(d) { return d.Deutsche_Bezeichnung } );

        d3.selectAll("li").on("click", change);

    })

    function change(){
        input = this.id;
        d3.selectAll("li.selected")
            .attr("class", "");
        d3.select(this)
            .attr("class", "selected");
        sortData( );

        y.domain(data.map(function(d) { return d.Deutsche_Bezeichnung } ));

        var weightedScores = data.map( function(d){
            if(input === "gdp"){
                return d.weightedGDP;
            } else if(input === "team"){
                return d.weightedTeam;
            }else if(input === "population"){
                return d.weightedPopulation;
            }

        } );
        x.domain([0, d3.max(weightedScores)]);
        xAxis1.scale(x);

        var transition = svg.transition().duration(750),
            delay = function(d,i){ return i * 50 };

        transition.selectAll(".countries")
            .delay(delay)
            .attr("transform", function(d){ return "translate(0," + y(d.Deutsche_Bezeichnung) + ")" });

        transition.selectAll(".weightedBar")
            //.delay(delay)
            .attr("width", function(d){
                var width;
                if(input === "gdp"){
                   width = d.weightedGDP;
                }else if (input === "team"){
                    width = d.weightedTeam;
                }else if(input == "population"){
                    width = d.weightedPopulation;
                }
                return half - x(width);

            })
        var label;
        if( input === 'gdp') {
            label = 'blabla'
        }
        weightedAxis(label);

    }

})();
