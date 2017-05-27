(function() {

	var mfaData = null
	var mobile = false
	var chartDiv = d3.select('.chart__mfa')
	var svg = chartDiv.select('svg')
	var scales = {}
	var chartWidth = 0
	var chartHeight = 0
	var margin = { top:10, bottom:25, left: 50, right: 15 }
	var ratio = 3.5
	var stack = d3.stack()
	stack.keys(["percent_women","percent_men"])
	var stackedData = null

	var mf_colors = ['#0C4B4A', '#EC7E6B']


	function cleanRow(row) {
		return {
			year: d3.timeParse('%Y')(row.year),
			total: +row.total,
			percent_men: +row.percent_men,
			percent_women: +row.percent_women,
		}
	}

	function loadData(cb) {
		d3.tsv('assets/mfa_data.tsv', cleanRow, function(err,data) {
			mfaData = data
			stackedData = stack(mfaData)
			cb()
		})
	}

	function setupElements() {
		var gLine = svg.select('.container__line');

		gLine.append('g')
		.attr('class', 'line-g')
		.append('path')
		.attr('class', 'line')
		.datum(mfaData)

		gLine.append('g').attr('class', 'axis axis--x axis--x--line');

		gLine.append('g').attr('class', 'axis axis--y axis--y--line');

 
		var gArea = svg.select('.container__area')

		gArea.append('g')
			.attr('class', 'area-g')
			.selectAll('.area')
			.data(stackedData)
			.enter()
			.append('path')
			.attr('class','area');

		gArea.append('g').attr('class', 'axis axis--x axis--x--area');

		gArea.append('g').attr('class', 'axis axis--y axis--y--area');

	}

	function setupScales() {
		scales.x = d3.scaleTime().domain(d3.extent(mfaData, function(d) { return d.year }))
		scales.yLine = d3.scaleLinear().domain([0,d3.max(mfaData, function(d){return d.total})])
		scales.yArea = d3.scaleLinear().domain([0,1])
		scales.color = d3.scaleOrdinal()
			.domain(['percent_women', 'percent_men'])
			.range(mf_colors);
	}

	function resize() {
		var breakpoint = 600;
		mobile = d3.select('body').node().offsetWidth < breakpoint
		updateChart()
	}

	function updateScales(){
		console.log("updateScales")
		scales.x.range([0, chartWidth]);
		scales.yLine.range([chartHeight,0]);
		scales.yArea.range([chartHeight,0]);
	}

	function drawAxes() {
		console.log("updateAxes")
		var xTickCount = mobile ? 3 : 5
		var yTickCount = mobile ? 2 : 4

		var axisX = d3.axisBottom(scales.x)
		.ticks(xTickCount)

		svg.select(".axis--x--line")
			.attr("transform", "translate(0," + chartHeight + ")")
			.call(axisX)

		var axisYLine = d3.axisLeft(scales.yLine)
			.ticks(yTickCount)
			.tickSizeInner(-chartWidth)


		svg.select(".axis--y--line")
			.call(axisYLine)

		svg.select(".axis--x--area")
			.attr("transform", "translate(0," + chartHeight + ")")
			.call(axisX)

		var axisYArea = d3.axisLeft(scales.yArea)
			.ticks(yTickCount)
			.tickSizeInner(-chartWidth)

		svg.select(".axis--y--area")
			.call(axisYArea)

	}


	function updateChart() {
		console.log("updateChart")
		var svgWidth = chartDiv.node().offsetWidth
		var svgHeight =  Math.floor(svgWidth / ratio)

		chartWidth = (svgWidth/2) - margin.left - margin.right
		chartHeight = svgHeight - margin.top - margin.bottom

		svg.attr('width',svgWidth)
			.attr('height',svgHeight)

		var translateLine = "translate(" + margin.left + "," + margin.top +")"
		var gLine = svg.select('.container__line')

		gLine.attr('transform',translateLine)
			.attr('width',chartWidth)
			.attr('height',chartHeight)

		var translateArea = "translate(" + (chartWidth + 2*margin.left + margin.right) + "," + margin.top +")"
		var gArea = svg.select('.container__area')

		gArea.attr('transform',translateArea)
			.attr('width',chartWidth)
			.attr('height',chartHeight)

		updateScales()
		drawAxes()

		var lineFn = d3.area()
		    .x(function(d) { return scales.x(d.year); })
		    .y0(function(d) { return scales.yLine(0) })
    		.y1(function(d) { return scales.yLine(d.total); });
    	
    	var line = gLine.select('.line')
    		.attr('d',lineFn)
    		.attr('stroke','#5B6283')
    		.attr('fill','#7F658B')
    		.attr('opacity','.9')

    	var areaFn = d3.area()
		    .x(function(d, i) { return scales.x(d.data.year); })
		    .y0(function(d) { return scales.yArea(d[0]); })
		    .y1(function(d) { return scales.yArea(d[1]); })
		    .curve(d3.curveMonotoneX);

    	var area = gArea.selectAll('.area')
       		.attr('d', areaFn)
    		.attr("fill", function(d) { 
	      		return scales.color(d.key);
	      	})
	      	.attr('opacity', '.9')
	}


	function init() {
		loadData(function() {
			console.log("inside callback")
			setupElements()
			setupScales()
			console.log(scales)
			resize() // draw chart
//			setupEvents()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()