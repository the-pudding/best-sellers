(function() {

	var mfaData = null
	var mobile = false
	var chartDiv = d3.select('.chart__mfa')
	var svg = chartDiv.select('svg')
	var scales = {}
	var chartWidth = 0
	var chartHeight = 0
	var margin = { top:25, bottom:25, left: 50, right: 15 }
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
		var gDegrees = svg.select('.container__line');

		gDegrees.append('g')
		.attr('class', 'degrees-g')
		.selectAll('.bar')
		.data(mfaData)
		.enter()
		.append('rect')
		.attr('class','bar')

		gDegrees.append('g').attr('class', 'axis axis--x axis--x--line');

		gDegrees.append('g').attr('class', 'axis axis--y axis--y--line');

		gDegrees.append('text').attr('class','title').text('Degrees Earned (US)')

		var gGenders = svg.select('.container__area')

		var stacks = gGenders.selectAll('g')
			.data(stackedData)
			.enter()
			.append('g')
			.attr('class', 'stack')
			.attr("fill", function(d) { 
	      		return scales.color(d.key);
	      	})
			.selectAll('.bar')
			.data(function(d){ 
				console.log(d) 
				return d 
			})
			.enter()
			.append('rect')
			.attr('class', 'bar')

		gGenders.append('g').attr('class', 'axis axis--x axis--x--area');

		gGenders.append('g').attr('class', 'axis axis--y axis--y--area');
		gGenders.append('text').attr('class','title').text('Gender Ratio of Degree-Earners')

		svg.append("text")
			.attr("class","label--y--line")
			.attr("text-anchor","middle")

		svg.append("text")
			.attr("class","label--y--area")
			.attr("text-anchor","middle")


	}

	function setupScales() {
		scales.x = d3.scaleTime().domain([d3.timeParse("%Y")(1988),d3.timeParse("%Y")(2014)])
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

	function getBandwidth() {
		var dom = scales.x
      	r = dom(d3.timeParse("%Y")("2014")) - dom(d3.timeParse("%Y")("1988"));
    	return Math.abs(r/(2013-1988)-2);
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

		console.log(yTickCount)
		var axisYArea = d3.axisLeft(scales.yArea)
			.ticks(yTickCount,"%")
			.tickSizeInner(-chartWidth)

		svg.select(".axis--y--area")
			.call(axisYArea)


		svg.selectAll(".title")
			.attr("transform", "translate("+ -5 +"," + -10 + ")")
	}

	function drawLabels() {
		svg.select('.label--y--line')
			.text("CW MFAs")
			.attr("transform", "translate("+ (margin.left/5) +","+(chartHeight/2+margin.top)+")rotate(-90)")
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
    	
    	gLine.selectAll('.bar')
    		.attr('x', function(d) { return scales.x(d.year) })
    		.attr('y', function(d) {
    			return scales.yLine(d.total)
    		})
    		.attr('height', function(d) {
    			return chartHeight - scales.yLine(d.total)
    		})
    		.attr('width', getBandwidth())
    		.attr('fill','#7F658B')

    	gArea.selectAll('.bar')
       		.attr('x', function(d){ return scales.x(d.data.year)})
       		.attr('y', function(d){ return scales.yArea(d[1])})
       		.attr('height', function(d) {return scales.yArea(d[0]) - scales.yArea(d[1])} )
	      	.attr('width', getBandwidth())
	}


	function init() {
		loadData(function() {
			console.log("inside callback")
			setupScales()
			setupElements()
			console.log(scales)
			resize() // draw chart
//			setupEvents()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()