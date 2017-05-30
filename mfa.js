(function() {

	var mfaData = null
	var mobile = false
	var chartDiv = d3.select('.chart__mfa')
	var svgDegrees = chartDiv.select('.container__line')
	var svgGenders = chartDiv.select('.container__area')
	var scales = {}
	var chartWidth = 0
	var chartHeight = 0
	var margin = { top:25, bottom:25, left: 40, right: 20 }
	var ratio = 3.50
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
		var gDegrees = svgDegrees.append('g')
		.attr('class', 'degrees-g')

		gDegrees.selectAll('.bar')
		.data(mfaData)
		.enter()
		.append('rect')
		.attr('class','bar')

		gDegrees.append('g').attr('class', 'axis axis--x axis--x--line');

		gDegrees.append('g').attr('class', 'axis axis--y axis--y--line');

		gDegrees.append('text').attr('class','title').text('CW MFA Degrees Earned (US)')

		var gGenders = svgGenders.append('g')
			.attr('class', 'genders-g')

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
		gGenders.append('text').attr('class','title').text('Gender Ratio of CW MFA-Earners')

		gDegrees.append("text")
			.attr("class","label--y--line")
			.attr("text-anchor","middle")

		gGenders.append("text")
			.attr("class","label--y--area")
			.attr("text-anchor","middle")

		gGenders.append("text")
			.attr("class", "label label--men")
			.attr("text-anchor","middle")
			.text("Men")

		gGenders.append("text")
			.attr("class", "label label--women")
			.attr("text-anchor","middle")
			.text("Women")

		gDegrees.append("text")
			.attr("class", "label label--no-data")
			.attr("text-anchor","middle")
			.text("No data")


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
		var yTickCount = mobile ? 3 : 5

		var axisX = d3.axisBottom(scales.x)
		.ticks(xTickCount)

		svgDegrees.select(".axis--x--line")
			.attr("transform", "translate(0," + chartHeight + ")")
			.call(axisX)

		var axisYLine = d3.axisLeft(scales.yLine)
			.ticks(yTickCount)
			.tickSizeInner(-chartWidth)

		svgDegrees.select(".axis--y--line")
			.call(axisYLine)

		svgGenders.select(".axis--x--area")
			.attr("transform", "translate(0," + chartHeight + ")")
			.call(axisX)

		console.log(yTickCount)
		var axisYArea = d3.axisLeft(scales.yArea)
			.ticks(yTickCount,"%")
			.tickSizeInner(-chartWidth)

		svgGenders.select(".axis--y--area")
			.call(axisYArea)

		svgDegrees.select(".title")
			.attr("transform", "translate("+ -5 +"," + -10 + ")")
		svgGenders.select(".title")
			.attr("transform", "translate("+ -5 +"," + -10 + ")")
	}

	function drawLabels() {
		svgDegrees.select(".label--no-data")
			.attr('x',scales.x(d3.timeParse('%Y')(1992)))
			.attr('y',scales.yLine('200'))
			.style('fill',"#CFCFCF")

		svgGenders.select(".label--men")
			.attr('x',scales.x(d3.timeParse('%Y')(1992)))
			.attr('y',scales.yArea('.8'))
			.style('fill',scales.color('percent_men'))
		svgGenders.select(".label--women")
			.attr('x',scales.x(d3.timeParse('%Y')(1992)))
			.attr('y',scales.yArea('.3'))
			.style('fill',scales.color('percent_women'))

	}



	function updateChart() {
		console.log("updateChart")
		var divWidth = chartDiv.node().offsetWidth
		var divHeight =  Math.floor(divWidth / ratio)

		svgWidth = mobile?divWidth:(divWidth/2)
		svgHeight = mobile?(2*divHeight):divHeight

		chartWidth = svgWidth - margin.left - margin.right
		chartHeight = svgHeight - margin.top - margin.bottom

		console.log("svgHeight",svgHeight)
		console.log("chartHeight",chartHeight)

		var translateLine = "translate(" + margin.left + "," + margin.top +")"
		gLine = svgDegrees.select('.degrees-g')

		svgDegrees.attr('width',svgWidth)
			.attr('height',svgHeight)

		svgGenders.attr('width',svgWidth)
			.attr('height',svgHeight)

		gLine.attr('transform',translateLine)


		var translateArea = "translate(" + margin.left + "," + margin.top +")"
		
		var gArea = svgGenders.select('.genders-g')

		gArea.attr('transform',translateArea)
			

		updateScales()
		drawAxes()
    	drawLabels()

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