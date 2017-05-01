(function() {

	//VARS
	var genderData = null;
	var scales = {};
	var stack = d3.stack();
	var margin = { top:10, bottom:25, left:50, right:10 };
	var width = 0;
	var height = 0;
	var ratio = 1.5;
	var transitionDuration = 1000;
	var mouseTransitionDuration = 50
	var tooltipTransitionDuration = 500

	var state = 'percent';
	var labels = {'count':'Count of books', 'percent':'Percent of books'}
	
	var chart = d3.select('.chart__gender');
	var svg = chart.select('svg');

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
			.range(['#ccc', '#666']);
		
	}

	function setupElements() {
		var g = svg.select('.container');

		g.append('g').attr('class', 'area-container');

		g.append('g').attr('class', 'axis axis--x');

		g.append('g').attr('class', 'axis axis--y');

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
			.text("Men");

		g.append("text")
			.attr("class","area__label area__label--women")
			.style("text-anchor", "end")
			.text("Women");

		g.append("line")
			.attr("class","fifty-percent")

		g.append("text")
			.attr("class","fifty-percent-label")
			.text("Gender Equality (50%)")

	}
	
	//UPDATE
	function updateScales(width, height){
		scales.count.x.range([0, width]);
		scales.percent.x.range([0, width]);
		scales.count.y.range([height, 0]);
		scales.percent.y.range([height, 0]);
	}


	function drawAxes(g, height){
		g.select(".axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(scales[state].x))

		g.select(".axis--y")
			.transition()
			.duration(transitionDuration)
			.call(d3.axisLeft(scales[state].y).ticks(10))
	}

	function xToD(x,data){
		var invertedX = scales[state].x.invert(x)

	    var bisectDate = d3.bisector(d => d.date).left;

	    var index = bisectDate(data, invertedX, 1)

		var d0 = data[index - 1];
		var d1 = data[index];
		
		var d = invertedX - d0.date > d1.date - invertedX ? d1 : d0;

		return d
	}

	//this is needlessly complicated but works for now

	function setLabelY(key,width,height){

		if(state == "percent"){
			if(key == "male"){
				return scales[state].y(.55)
			}else{
				return scales[state].y(.05)
			}
		}
		var d = xToD(.9*width,genderData)

		k = key+"_count"

		console.log(k,d[k])

		if(key == "male"){
			return scales[state].y((d["female_"+state]+d[k]/2))
		} else {
			return scales[state].y((d[k]/2))
		}
	}

	function drawLabels(g, width, height) {
		svg.select('.label--y')
			.text(labels[state])
		.transition()
			.duration(transitionDuration)
			.attr("transform", "translate("+ (margin.left/4) +","+(height/2)+")rotate(-90)")

		var yMen = setLabelY("male",width,height)
		var yWomen = setLabelY("female",width,height)

		g.select(".area__label--women")
			.transition()
			.duration(transitionDuration)
			.attr("x", .9 * width)
			.attr("y", yWomen)
			.style("text-anchor", "middle")

		g.select(".area__label--men")
			.transition()
			.duration(transitionDuration)
			.attr("x", .9 * width)
			.attr("y", yMen)
			.style("text-anchor", "middle")
	}

	function handleMouseMove(d) {
		var key = d.key
	    var mouse = d3.mouse(this)
	    var mouseX = mouse[0]
	    var mouseY = mouse[1]
	    var invertedX = scales[state].x.invert(mouseX)

	    var bisectDate = d3.bisector(d => d.date).left;

	    var index = bisectDate(genderData, invertedX, 1)

		var d0 = genderData[index - 1];
		var d1 = genderData[index];
		
		var d = invertedX - d0.date > d1.date - invertedX ? d1 : d0;
		
		chart.select(".vertical")
			.attr("x",(scales[state].x(d.date)));

		var val = d[key];
		var displayValue = state === 'percent' ? d3.format(".0%")(val) : val;
		var displayYear = +d3.timeFormat("%Y")(d.date);
		var displayGender = key.split('_')[0];
		
		chart.select(".tooltip--gender").text(displayGender);
		chart.select(".tooltip--year").text(displayYear);
		chart.select(".tooltip--value").text(displayValue);
       	
       	var isLeft = mouseX < width / 2
       	var xOff = scales[state].x(d.date)
       	var yOff = mouseY + margin.top
       	chart.select('.tooltip')
       		.style("right", isLeft ? 'auto' : width - xOff + margin.right + 'px')
       		.style("left", isLeft ? xOff + margin.left + 'px' : "auto")
       		.style("top",  yOff + "px");
	}

	function handleMouseOut() {
		// chart.select(".vertical")
		// 	.transition()
		// 	.duration(transitionDuration)
		// 	.style("opacity",0)

		// chart.select(".tooltip")
		// 	.transition()
		// 	.duration(tooltipTransitionDuration)
		// 	.style("opacity",0)
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

		drawAxes(g, height)
		drawLabels(g, width, height)

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

	    console.log("1950",(d3.timeParse("%Y")("1950")))

	    var opacity = state === 'percent' ? 1 : 0;
      	g.select(".fifty-percent")
      		.attr("x1",scales["percent"].x(d3.timeParse("%Y")("1950")))
        	.attr("y1",scales["percent"].y(.5))
        	.attr("x2",scales["percent"].x(d3.timeParse("%Y")("2017")))
        	.attr("y2",scales["percent"].y(.5))
      		.transition()
      		.duration(transitionDuration)
      		.style("opacity",opacity)

      	g.select(".fifty-percent-label")
      		.attr("x",width/2)
      		.attr("y",scales["percent"].y(.5))
      		.attr("text-anchor","middle")
      		.transition()
      		.duration(transitionDuration)
      		.style("opacity",opacity)
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
		
		chart.selectAll('.area')
			.on('mousemove',handleMouseMove)
			.on('mouseout',handleMouseOut)
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
			window.addEventListener('resize', resize)
		})
	}

	init()
})()
