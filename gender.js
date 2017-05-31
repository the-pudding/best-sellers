(function() {

	//VARS
	var colors = ['#0C4B4A','#1D5560','#3A5C74','#5B6283','#7F658B','#A3678C','#C26B86','#DB717A','#EC7E6B']

	var colorF = colors[0]
	var colorM = colors[8]
	var colors = [colorF, colorM]
	var mobile = false;
	var genderData = null;
	var scales = {};
	var stack = d3.stack();
	var margin = { top:10, bottom:25, left:50, right:10 };
	var width = 0;
	var height = 0;
	var ratio = 1.75;
	var transitionDuration = 1000;
	var mouseTransitionDuration = 50
	var tooltipTransitionDuration = 500

	var state = 'percent';
	var labels = {'count':'Number of books', 'percent':'Percent of books'}

	var chart = d3.select('.chart__gender');
	var svg = chart.select('svg');

	function formatPercent(num) {
		return d3.format(".0%")(num);
	}

	// CLEANING FNS
	function cleaRow(row) {
		var female = +row.Female;
		var male = +row.Male;
		var total = male + female;

		return {
			dateStr: row.date,
			date: d3.timeParse('%Y')(row.date),
			male_count: male,
			female_count: female,
			total: total,
			male_percent: male / total,
			female_percent: female / total
		}
	}

	// LOAD THE DATA
	function loadData(cb) {
		d3.tsv('assets/gender_count.tsv', cleaRow, function(err, data) {
			genderData = data
			cb()
		});
	}

	//SETUP
	//GENDER HELPERS
	function setupScales() {
		var maxCount = d3.max(genderData,function(d) { return d.total; });

		var countX = d3.scaleTime()
			.domain(d3.extent(genderData, function(d) { return d.date; }));

		var countY = d3.scaleLinear()
			.domain([0, maxCount]);

		scales.count = { x: countX,  y: countY };

		var percentX = d3.scaleTime()
			.domain(d3.extent(genderData, function(d) { return d.date; }));

		var percentY = d3.scaleLinear();

		scales.percent = { x: percentX,  y: percentY };

		scales.color = d3.scaleOrdinal()
			.domain(['male_count', 'female_count'])
			.range(colors);

	}

	function setupElements() {
		var g = svg.select('.container');

		g.append('g').attr('class', 'axis axis--x');

		g.append('g').attr('class', 'axis axis--y');

		g.append('g').attr('class', 'area-container');

		g.append("rect")
	  		.attr("class", "vertical")
  			.attr("width", 1)
  			.attr("x", 0)

  		svg.append("text")
			.attr("class","label--y")
			.attr("text-anchor","middle")

		svg.append("text")
			.attr("class","label--x")
			.attr("text-anchor","middle")

		g.append("text")
			.attr("class","area__label area__label--men")
			.style("text-anchor", "end")
			.style('fill', d3.color(colorM).darker(1.5))
			.text("Men");

		g.append("text")
			.attr("class","area__label area__label--women")
			.style("text-anchor", "end")
			.style('fill', d3.color(colorF).brighter(2))
			.text("Women");

		g.append("line")
			.attr("class","fifty-percent fifty-percent-line")

		g.append("text")
			.attr("class","fifty-percent fifty-percent-label")
			.attr('alignment-baseline', 'baseline')
			.attr('text-anchor', 'middle')
			.text("Gender Equality (50%)")

		g.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('class', 'interaction')

	}

	//UPDATE
	function updateScales(width, height){
		scales.count.x.range([0, width]);
		scales.percent.x.range([0, width]);
		scales.count.y.range([height, 0]);
		scales.percent.y.range([height, 0]);
	}


	function drawAxes(g) {
		var tickCount = mobile ? 5 : 10

		var axisX = d3.axisBottom(scales[state].x)
			.ticks(tickCount)

		g.select(".axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(axisX)

		var formatter = state === "percent" ? '%' : 'r'
		var axisY = d3.axisLeft(scales[state].y)
			.ticks(tickCount, formatter)
			.tickSizeInner(-width)

		g.select(".axis--y")
			.transition()
			.duration(transitionDuration)
			.call(axisY)
	}

	function xToData(x) {
		var invertedX = scales[state].x.invert(x)

	    var bisectDate = d3.bisector(d => d.date).left;

	    var index = bisectDate(genderData, invertedX, 1)

		var d0 = genderData[index - 1];
		var d1 = genderData[index];

		var d = invertedX - d0.date > d1.date - invertedX ? d1 : d0;

		return d
	}

	//this is needlessly complicated but works for now

	function setLabelY(key,width,height){

		if (key === 'male') return height * 0.4
		return height * 0.9
	}

	function drawLabels(g) {
		svg.select('.label--y')
			.text(labels[state])
		.transition()
			.duration(transitionDuration)
			.attr("transform", "translate("+ (margin.left/4) +","+(height/2)+")rotate(-90)")

		var yMen = setLabelY("male", width,height)
		var yWomen = setLabelY("female", width,height)

		g.select(".area__label--women")
			.transition()
			.duration(transitionDuration)
			.attr("x", .95 * width)
			.attr("y", yWomen)
			.style("text-anchor", "end")

		g.select(".area__label--men")
			.transition()
			.duration(transitionDuration)
			.attr("x", .95 * width)
			.attr("y", yMen)
			.style("text-anchor", "end")
	}

	function handleMouseMove() {
	    var mouse = d3.mouse(this)
	    var mouseX = mouse[0]
	    var mouseY = mouse[1]

	    var d = xToData(mouseX)

		chart.select(".vertical")
			.attr("x",(scales[state].x(d.date)));

		var valM = d['male_' + state]
		var valF = d['female_' + state]
		var displayM = state === 'percent' ? formatPercent(valM) : valM;
		var displayF = state === 'percent' ? formatPercent(valF) : valF;
		var displayYear = +d3.timeFormat("%Y")(d.date);

		chart.select(".tooltip--year").text(displayYear);
		chart.select(".tooltip--male span").text(displayM);
		chart.select(".tooltip--female span").text(displayF);

       	var bbox = chart.select('.tooltip').node().getBoundingClientRect()

       	var isLeft = mouseX < width / 2;
       	var isTop = mouseY < height / 2;
       	var xOff = scales[state].x(d.date);
       	var topOff = isTop ? 0 : -1;
       	var yOff = mouseY + (topOff * bbox.height);

       	chart.select('.tooltip')
       		.style('visibility', 'visible')
       		.style("right", isLeft ? 'auto' : width - xOff + margin.right + 'px')
       		.style("left", isLeft ? xOff + margin.left + 'px' : "auto")
       		.style("top", yOff + margin.top + "px")

       	chart.select('.vertical')
			.style('visibility', 'visible');
	}

	function handleMouseOut() {
		chart.select('.tooltip')
			.style('visibility', 'hidden');

		chart.select('.vertical')
			.style('visibility', 'hidden');
	}

	function updateChart() {
		var w = chart.node().offsetWidth;
		var h = Math.floor(w / ratio);

		width = w - margin.left - margin.right;
		height = h - margin.top - margin.bottom;

		svg
			.attr('width', w)
			.attr('height', h);

		var translate = "translate(" + margin.left + "," + margin.top + ")";

		var g = svg.select('.container')

		g.attr("transform", translate)

		updateScales(width, height)

		var area = d3.area()
		    .x(function(d) { return scales[state].x(d.data.date); })
		    .y0(function(d) { return scales[state].y(d[0]); })
		    .y1(function(d) { return scales[state].y(d[1]); })
		    .curve(d3.curveMonotoneX)

		stack.keys(['female_' + state, 'male_' + state])

		var stackedData = stack(genderData)

		var container = chart.select('.area-container')

		var layer = container.selectAll('.area')
			.data(stackedData)

		layer.exit().remove()

		var enterLayer = layer.enter()
			.append('path')
			.attr('class', 'area')

		drawAxes(g)
		drawLabels(g)

		vertical = g.select(".vertical")
			.attr("height", height)
      		.attr("y", 0)

	    layer.merge(enterLayer)
	    	.transition()
	    	.duration(transitionDuration)
	    	.attr('d', area)
	      	.style("fill", function(d) {
	      		var key = d.key.split('_')[0]
	      		return scales.color(key);
	      	})

	    //drawFiftyPercent()

	    var opacity = state === 'percent' ? 0.75 : 0;
      	g.select(".fifty-percent-line")
      		.attr("x1",scales["percent"].x(d3.timeParse("%Y")("1950")))
        	.attr("y1",scales["percent"].y(.5))
        	.attr("x2",scales["percent"].x(d3.timeParse("%Y")("2017")))
        	.attr("y2",scales["percent"].y(.5))

      	g.select(".fifty-percent-label")
      		.attr("x", width / 2)
      		.attr("y",(scales["percent"].y(0.5) - 5))
      		// .attr("text-anchor","start")


      	g.selectAll(".fifty-percent")
      		.transition()
      		.duration(transitionDuration)
      		.style("opacity",opacity)

      	g.select('.interaction')
      		.attr('width', width)
      		.attr('height', height)
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
		chart.selectAll('.toggle__button').on('click', handleToggle)
		chart.selectAll('.toggle__button')
			.classed("front-curve",function(d,i){
				if(i==0){
					return true;
				}
				return false;
			})
			.classed("back-curve",function(d,i){
				if(i==1){
					return true;
				}
				return false;
			})

		chart.selectAll('.interaction')
			.on('mousemove',handleMouseMove)
			.on('mouseout', handleMouseOut)
	}

	function resize() {
		var breakpoint = 600;
		var w = d3.select('body').node().offsetWidth;
		mobile = w < breakpoint;
		updateChart()
	}

	function init() {
		loadData(function() {
			setupElements()
			setupScales()
			resize() // draw chart
			setupEvents()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()
