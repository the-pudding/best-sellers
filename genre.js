(function() {

	//VARS
	// var colors = ['#d65454', '#eabc3b', '#7564bc', '#3ca0a0', '#5fa0d6']
	// var colors = ['#eabc3b','#e6a344','#e28a4b','#dc7150','#d65454', '#7564bc','#697ab3','#588eaa','#3ca0a0']
	// var colors = ['#7564bc','#7273c1','#6d83c2','#6d91bc','#7b9ea8','#96a88d','#b3af72','#d0b657','#eabc3b'].reverse()
	var colors = ['#0C4840','#114F53','#265463','#415770','#5F5878','#7C5879','#975875','#AC5A6A','#BB605D']
	var breakpoint = 700;
	var mobile = false;
	var addToOther = ['Historical', 'Domestic'];
	var genderColumns = null;
	var genreData = null;
	var scales = {};
	var margin = { top:10, bottom:25, left:50, right: 130 }
	var width = 0
	var height = 0
	var ratio = 1.75;
	var stack = d3.stack();
	var transitionDuration = 1000;

	var state = 'percent'
	var labels = {'count':'Count of books', 'percent':'Percent of books', 'genrePercent':'Percent of genre books'}

	var chart = d3.select('.chart__genre')
	var svg = chart.select('svg')
	// CLEANING FNS

	function cleanRow(row, i, cols) {
		var target = {};
		var columns = cols.slice(1);

		var values = columns.map(function(columName) {
			return +row[columName];
		})

		var genre_values = columns.map(function(columName) {
			if (columName!='Literary/None') {
				return +row[columName];
			}
		})

		target.total = d3.sum(values)
		target.genre_total = d3.sum(genre_values)

		// create columns with number values
		columns.forEach(function(columName, i) {
			target[columName + '_count'] = values[i];
			target[columName + '_percent'] = values[i] / target.total;
			if(columName != 'Literary/None'){
				target[columName + '_genrePercent'] = values[i] / target.genre_total;
			}
		});

		addToOther.forEach(function(col) {
			target['Other_count'] += target[col + '_count']
		})

		target['Other_percent'] = target['Other_count'] / target.total;

		genderColumns = columns.filter(function(col) {
			// is this colum NOT in addToOthers
			return addToOther.indexOf(col) === -1
		})

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
	function setupColors() {
		var dark = colors.map(function(c) {
			return d3.color(c).brighter(0.7).toString()
		})

		colors = colors.concat(dark)
		console.log(colors)
	}

	function setupScales() {
		var keys = genderColumns;

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


		scales.color = d3.scaleOrdinal().domain(keys).range(colors)
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

		g.append("rect")
	  		.attr("class", "vertical")
  			.attr("width", 1)
  			.attr("x", 0)

  		svg.append("text")
			.attr("class","label--y")
			.attr("text-anchor","middle")

		// russ
		chart.select('.mobile-legend').selectAll('li')
			.data(genderColumns)
		.enter().append('li')
			.attr('class', 'tk-atlas')
			.style('background-color', function(d) {
				return scales.color(d);
			})
			.style('color', function(d, i) {
				var dark = i < colors.length / 2;
				var col = d3.color(scales.color(d));
				return col.brighter(10)
				// return col.darker(5)
			})
			.text(function(d) { return d; })
	}

	// SET UP GENRE



	//UPDATE

	//HELPERS

	function updateScales(width,height){
		scales[state].x.range([0, width]);

		scales[state].y.range([height,0]);
	}

	function drawAxes() {
		var tickCount = mobile ? 5 : 10

		var axisX = d3.axisBottom(scales[state].x)
			.ticks(tickCount)

		svg.select(".axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(axisX)

		var formatter = state === "percent" ? '%' : 'r'
		var axisY = d3.axisLeft(scales[state].y)
			.ticks(tickCount, formatter)

		svg.select(".axis--y")
			.call(axisY)
	}

	function drawLegend(width,height) {
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

		svg.select(".legendOrdinal")
		    .call(legendOrdinal);
	}

	function drawLabels(height) {
		var label = svg.select('.label--y')
			.text(labels[state])
			.transition()
			.duration(transitionDuration)
			.attr("transform", "translate("+ (margin.left/4) +","+(height/2)+")rotate(-90)")
	}

	function updateChart() {
		var svg_width = chart.node().offsetWidth
		var svg_height =  Math.floor(svg_width / ratio)


		margin.right = mobile ? 20 : 130;
			
		svg.select(".legend-container")
			.classed('is-hidden', mobile);


		width = svg_width - margin.left - margin.right;
		height = svg_height - margin.top - margin.bottom;
		
		svg
			.attr('width', svg_width)
			.attr('height', svg_height);

		var translate = "translate(" + margin.left + "," + margin.top + ")"
		var g = svg.select('.container')
				
		g.attr("transform", translate)

		g.attr('width', width)
			.attr('height', height);

		updateScales(width,height)

		g.select(".vertical")
			.attr("height", height)
      		.attr("y", 0)

		var area = d3.area()
		    .x(function(d, i) { return scales[state].x(d.data.dateParsed); })
		    .y0(function(d) { return scales[state].y(d[0]); })
		    .y1(function(d) { return scales[state].y(d[1]); })
		    .curve(d3.curveMonotoneX);

		var keys = genderColumns.map(function(key) {
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

	    drawLabels(height)

	    drawLegend(width, height)
	}

	function handleMouseMove(d) {
		var key = d.key
	    var mouse = d3.mouse(this)
	    var mouseX = mouse[0]
	    var mouseY = mouse[1]
	    var invertedX = scales[state].x.invert(mouseX)

	    var bisectDate = d3.bisector(d => d.dateParsed).left;

	    var index = bisectDate(genreData, invertedX, 1)

		var d0 = genreData[index - 1];
		var d1 = genreData[index];
		
		var d = invertedX - d0.dateParsed > d1.dateParsed - invertedX ? d1 : d0;
		
		chart.select(".vertical")
			.attr("x",(scales[state].x(d.dateParsed)))

		var displayYear = +d3.timeFormat("%Y")(d.dateParsed);
		
		chart.select(".tooltip--year").text(displayYear);


		genreData.map(function(d){
			console.log(d)
			chart.select('.tooltip').append("span")

		})
		
       	var bbox = chart.select('.tooltip').node().getBoundingClientRect()

       	var isLeft = mouseX < width / 2;
       	var isTop = mouseY < height / 2;
       	var xOff = scales[state].x(d.dateParsed);
       	var topOff = isTop ? 0 : -1; 
       	var yOff = mouseY + topOff * bbox.height;
		
       	chart.select('.tooltip')
       		.style("right", isLeft ? 'auto' : width - xOff + margin.right + 'px')
       		.style("left", isLeft ? xOff + margin.left + 'px' : "auto")
       		.style("top", yOff + margin.top + topOff + "px")
	}

	function handleToggle() {
		if (this.value != state) {
			state = this.value
			chart.selectAll('.toggle__button')
				.classed('is-active', false)

			d3.select(this).classed('is-active', true)
			updateChart()
		}
	}

	function setupEvents() {
		chart.selectAll('.toggle__button').on('click', handleToggle);
		chart.selectAll('.area')
			.on('mousemove',handleMouseMove)
	}

	function resize() {
		mobile = d3.select('body').node().offsetWidth < breakpoint
		updateChart()
	}

	function init() {
		loadData(function() {
			// console.log(genreData)
			// setupColors()
			setupScales()
			setupElements()
			resize() // draw chart
			setupEvents()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()