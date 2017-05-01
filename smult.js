(function() {

	//VARS
	var smultData = null;
	var width = 0;
	var height = 0;
	var scales = {};
	var chart = d3.select('.chart__smult');


	// CLEANING FNS
 	function cleanRow(row) {
 		var target = {}
		count_women = +row.count;
		genre_total = count_women/(+row.percent);
	  	if ((row.genre!="zz_needs label") && (genre_total > 10)) {
	    	target["percent_w"] = +row.percent;
	    	target["percent_m"] = 1 - +row.percent;
			target["decade"] = d3.timeParse('%Y')(row.decade);
			target["genre"] = row.genre;
	  		return target
	  	}
	}


	// LOAD THE DATA
	function loadData(cb) {
		d3.tsv('assets/smult_data.tsv', cleanRow, function(err, data) {
			smultData = data
			cb()
		});
	}


	//SETUP
	//SMULT HELPERS

	function setupScales() {
		scales.y = d3.scaleTime().domain([d3.timeParse("%Y")("1945"),d3.timeParse("%Y")("2025")]);
  		scales.x = d3.scaleLinear().domain(d3.extent([-1, 1]));
	}

	function setupChart() {
		var genres = d3.nest().key(function(d){ return d.genre}).entries(smultData);
		setupScales()
		console.log("genres",genres)	
		makeChartElements(genres)
		
	}

	function makeChartElements(genres) {
		var svg = chart.selectAll("svg.mult")
 			.data(genres)
			.enter()
			.append("svg")
			.attr("class","mult")
			.append("g")
			.attr("class","container")


		var bars = svg.selectAll(".bar")
      		.data(function(d) { return d.values;})
    		.enter();

		bars.append("rect")
      		.attr("class", "bar women")
      	bars.append("rect")
    		.attr("class", "bar men")


    	//ADD LABEL FOR EACH SVG

    	svg.append("text")
			.attr("class","genre__label")
			.style("text-anchor", "end")
			.style("font-weight","bold")
			.text(function(d) { 
				console.log(d)
				return d.key; 
			});


    	//ADD VALUE LABELS
    	bars.append("text")
		    .attr("class", "smult__value")
		    .text(function(d){
		        if (d.percent_w >= d.percent_m){
		          return d3.format(".0%")(d.percent_w);
		        } else {
		          return d3.format(".0%")(d.percent_m);
		        }
		    })
		    .attr("text-anchor", function(d){
		      	if (d.percent_w >= d.percent_m){
		          return "end";
		        } else {
		          return "start";
		        }
		    })


		//ADD AXES
		svg.append("g")
    		.attr("class", "axis axis--y")

    	svg.append("g")
 			.attr("class", "axis axis--x")

 		svg.append("line")
 			.attr("class", "zero")

	}


	//UPDATE
	function getBandwidth() {
		var dom = scales.y
      	r = dom(d3.timeParse("%Y")("2025")) - dom(d3.timeParse("%Y")("1945"));
    	return Math.abs(r/9);
  	}

	function updateScales(width,height){
		scales.x.range([0, width]);
		scales.y.range([0, height]);
	}

	function drawAxes(g){
		g.select('.axis--y')
	    	.call(d3.axisLeft(scales.y).ticks(7));

  		g.select('.axis--x')
		    .call(d3.axisTop(scales.x).ticks(6, "%"));
	}

	function updateChart() {
		var margin = {top:25,bottom:10,left:33,right:20} //figure out how to get these from the css/dom
		const ratio = 1.5;
		svg_width = (chart.node().offsetWidth)/4.5;
		svg_height = svg_width;
		width = svg_width - margin.left - margin.right
		height = svg_height - margin.top - margin.bottom

		
		var svg = chart.selectAll('svg.mult');
		svg.attr('width', svg_width) // not sure how margin works, still...
			.attr('height', svg_height)

		var g = svg.select(".container")
		.attr("height",height)
		.attr("width",width)
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

      	updateScales(width,height)

		var bars = g.selectAll(".bar")
			.attr("y", function(d) { return scales.y(d.decade);})
      		.attr("height", getBandwidth()) // MAKE A BANDWIDTH FN

      	var wbars = g.selectAll(".bar.women")
      		.attr("x", function(d) { return scales.x(0); })
      		.attr("width", function(d) { return Math.abs(scales.x(0) - scales.x(d.percent_w)); });
	
      	var mbars = g.selectAll(".bar.men")
	      	.attr("x", function(d) { return scales.x(-1*d.percent_m); })
    		.attr("width", function(d) { return Math.abs(scales.x(0) - scales.x(d.percent_m)); });

    	g.selectAll(".smult__value")
    		.attr("y", function(d) { return (scales.y(d.decade) + getBandwidth()/2 +5);})
		    .attr("x", function(d) {
		        if (d.percent_w >= d.percent_m){
		          return scales.x((+d.percent_w - .04));
		        } else {
		          return scales.x(-1*(+d.percent_m - .04));
		        }
		    })

		drawAxes(g)

		g.selectAll(".genre__label")
			.attr("y", height)
			.attr("x", width)

		g.select(".zero")
			.attr("y1", scales.y(d3.timeParse("%Y")("1945")))
			.attr("x1", scales.x(0))
			.attr("y2", scales.y(d3.timeParse("%Y")("2025")))
			.attr("x2", scales.x(0))
			.style("stroke", "black");

	}

	function setup() {
		setupChart()	
	}

	function resize() {
		updateChart()
	}

	function init() {
		loadData(function() {
			console.log("smult",smultData)
			setup()
			resize()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()
