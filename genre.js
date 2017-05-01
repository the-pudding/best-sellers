(function() {

	//VARS
	var genreData = null;
	var scales = {};
	var margin = { top:10, bottom:25, left:50, right:120 }
	var ratio = 1.5;
	var stack = d3.stack();
	var transitionDuration = 1000;

	var state = 'percent'

	var chart = d3.select('.chart__genre')
	var svg = chart.select('svg')
	// CLEANING FNS

	function cleanRow(row, i, cols) {
		var target = {}		
		var columns = cols.slice(1)

		var values = columns.map(function(columName) {
			return +row[columName];
		})

		var genre_values = columns.map(function(columName) {
			if(columName!="Literary/None"){
				return +row[columName];
			}
		})

		target.total = d3.sum(values)
		target.genre_total = d3.sum(genre_values)

		// create columns with number values
		columns.forEach(function(columName, i) {
			target[columName + '_count'] = values[i];
			target[columName + '_percent'] = values[i] / target.total;
			if(columName!="Literary/None"){
				target[columName + '_genrePercent'] = values[i] / target.genre_total;
			}
		});

		// update date
		target.dateParsed = d3.timeParse('%Y')(row.date)

		return target
 	}


	// LOAD THE DATA
	function loadData(cb) {
		d3.tsv('assets/genre_count.tsv', cleanRow, function(err, data) {
			genreData = data
			cb()
		});
	}


	//SETUP
	// GENRE HELPERS

	function setupScales() {
		var keys = genreData.columns.slice(1);

		// if (cp=='count') {
		var maxCount = d3.max(genreData,function(d) { return d.total; })

		var countX = d3.scaleTime()
			.domain(d3.extent(genreData, function(d) { return d.dateParsed; }));
		
		var countY = d3.scaleLinear().domain([0,maxCount])

		scales.count = {x:countX, y:countY}

		var percentX = d3.scaleTime()
			.domain(d3.extent(genreData, function(d) { return d.dateParsed; }));

		var percentY = d3.scaleLinear()

		scales.percent = {x:percentX, y:percentY}

		var genrePX = d3.scaleTime()
			.domain(d3.extent(genreData, function(d) { return d.dateParsed; }));

		var genrePY = d3.scaleLinear()

		scales.genrePercent = {x:genrePX, y:genrePY}


		scales.color = d3.scaleOrdinal(d3.schemeCategory20).domain(keys)
	}

	function setupElements() {
		svg.append("g")
	      .attr("class", "legend-container")
	      .append("g")
	      .attr("class", "legendOrdinal");
	      
		var g = svg.select('.container');

		g.append('g').attr('class', 'area-container');

		g.append('g')
			.attr('class', 'axis axis--x');
		g.append('g')
			.attr('class', 'axis axis--y');
	}

	// SET UP GENRE



	//UPDATE

	//HELPERS

	function updateScales(width,height){
		scales[state].x.range([0, width]);

		scales[state].y.range([height,0]);
	}

	function drawAxes(height){
		svg.select(".axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(scales[state].x))

		svg.select(".axis--y")
			.call(d3.axisLeft(scales[state].y).ticks(10))
	}

	function drawLegend(width,height) {
		console.log(width)
		svg.select(".legend-container")
			.attr("visibility","visible")
		  .attr("width",margin.right)
		  .attr("height",height)
	      .attr("transform", "translate("+(width+margin.left+20)+","+(height/4+margin.top)+")")

		var legendOrdinal = d3.legendColor()
	        .shape("path", d3.symbol().type(d3.symbolSquare).size(150)())
	        .shapePadding(10)
	  //use cellFilter to hide the "e" cell
	        .cellFilter(function(d){ 
	        	return d.label !== "e" 
	        })
	        .scale(scales.color)
	        .ascending(true);

	    console.log("legend",legendOrdinal)
		svg.select(".legendOrdinal")
		    .call(legendOrdinal);
	}

	function updateChart() {
		var svg_width = chart.node().offsetWidth
		var svg_height =  Math.floor(svg_width / ratio)

		margin.right = 120
		var useLegend = true
		if(margin.right>=svg_width/6){
			console.log("removing legend")
			margin.right = 10
			useLegend = false
			svg.select(".legend-container")
				.attr("visibility","hidden")
		}
		console.log("svg_width",svg_width)
		console.log("margin.right",margin.right)


		var width = svg_width - margin.left - margin.right;
		var height = svg_height - margin.top - margin.bottom;
		
		svg
			.attr('width', svg_width)
			.attr('height', svg_height);

		var translate = "translate(" + margin.left + "," + margin.top + ")"
		var g = svg.select('.container')
				
		g.attr("transform", translate)

		g.attr('width', width)
			.attr('height', height);

		updateScales(width,height)

		var area = d3.area()
		    .x(function(d, i) { return scales[state].x(d.data.dateParsed); })
		    .y0(function(d) { return scales[state].y(d[0]); })
		    .y1(function(d) { return scales[state].y(d[1]); });

		var keys = genreData.columns.slice(1).map(function(key) {
			return key + '_' + state;
		});

	  	stack.keys(keys)

	  	var stackedData = stack(genreData)

		// redraw elements
		drawAxes(height)
		var container = chart.select('.area-container')

		var layer = container.selectAll('.area')
			.data(stackedData)

		layer.exit().remove()

		var enterLayer = layer.enter()
			.append('path')
			.attr('class', 'area')


		layer.merge(enterLayer)
	    	.transition()
	    	.duration(transitionDuration)
	    	.attr('d', area)
	      	.style("fill", function(d) { 
	      		var key = d.key.split('_')[0]
	      		return scales.color(key);
	      	})
	    if(useLegend === true){
		    drawLegend(width,height)
		}
	}

	function handleToggle() {
		if (this.value != state) {
			state = this.value
			updateChart()
		}
	}

	function setupEvents() {
		chart.selectAll('.toggle__button').on('click', handleToggle);
	}

	function resize() {
		updateChart()
	}

	function init() {
		loadData(function() {
			console.log(genreData)
			setupElements()
			setupScales()
			resize() // draw chart
			setupEvents()
			resize()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()