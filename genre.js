(function() {

	//VARS
	var genreData = null;
	var scales = {};
	var margin = { top:10, bottom:25, left:50, right:10 }
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

		target.total = d3.sum(values)

		// create columns with number values
		columns.forEach(function(columName, i) {
			target[columName + '_count'] = values[i];
			target[columName + '_percent'] = values[i] / target.total;
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



		scales.color = d3.scaleOrdinal(d3.schemeCategory20).domain(keys)
	}

	function setupElements() {
		var g = svg.select('.container');

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

	function updateChart() {
		var svg_width = chart.node().offsetWidth
		var svg_height =  Math.floor(svg_width / ratio)

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

		var layer = g.selectAll('.area')
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
