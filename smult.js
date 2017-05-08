(function() {

	//VARS
	var smultData = null;
	var decadeExtent = null;
	var countMax = 0;
	var width = 0;
	var height = 0;
	var scales = {};
	var chart = d3.select('.chart__smult');
	var svg = chart.select('svg');
	var state = 'percent';
	var fontSize = 12;

	function formatPercent(num) {
		return d3.format('.0%')(num);
	}

	// CLEANING FNS
 	function cleanRow(row) {
 		var percentW = +row.percent;
 		var percentM = 1 - percentW;
 		var countW = +row.count;
 		var countTotal = Math.round((1 / percentW) * countW);
 		var countM = Math.round(percentM * countTotal);
		
		var out = {
			percentW: percentW,
	 		percentM: percentM,
	 		countW: countW,
	 		countTotal: countTotal,
	 		countM: countM,
			// decade: d3.timeParse('%Y')(row.decade),
			decade: +row.decade,
			genre: row.genre,
		}

		return out;
	  // 	if ((row.genre!="zz_needs label") && (genre_total > 10)) {
	  //   	target["percent_w"] = +row.percent;
	  //   	target["percent_m"] = 1 - +row.percent;
			// target["decade"] = d3.timeParse('%Y')(row.decade);
			// target["genre"] = row.genre;
	  // 		return target
	  // 	}
	}


	function sortGenres(a, b) {
		var meanA = d3.mean(a.values, function(d) { return d.percentW })
		var meanB = d3.mean(b.values, function(d) { return d.percentW })
		return d3.ascending(meanA, meanB)
	}

	function fillEmptyDecades(d) {
		var years = d3.range(decadeExtent[0], decadeExtent[1] + 10, 10);
		var values = years.map(function(y) {
			return d.values.find(function(d) { return d.decade === y }) ||
			{
				decade: y,
				percentW: 0,
				percentM: 0,
			}
		})
		return { 
			key: d.key,
			values: values,
		}
	}

	// LOAD THE DATA
	function loadData(cb) {

		d3.tsv('assets/smult_data_2.tsv', cleanRow, function(err, data) {

			var filtered = data.filter(function(d) { return d.countTotal > 10 })

			decadeExtent = d3.extent(filtered, function(d) { return d.decade })
			countMax = d3.max(filtered, function(d) { return d.countM })
			smultData = d3.nest()
				.key(function(d) { return d.genre })
				.entries(filtered)
				.sort(sortGenres)
				.map(fillEmptyDecades);

			console.log(smultData)
			cb()
		});
	}


	//SETUP
	//SMULT HELPERS

	function makeChartElements() {

		var g = svg.select('.container')

		var genreEnter = g.selectAll('.genre').data(smultData)
		 	.enter().append('g')
				.attr('class', 'genre');

		genreEnter.append('text')
			.attr('class', 'genre__title')
			.attr('text-anchor', 'middle')
    		.attr('alignment-baseline', 'middle')
			.text(function(d) { return d.key })

		var decade = genreEnter.selectAll('.decade')
			.data(function(d) { return d.values; })
    		.enter().append('g')
    			.attr('class', 'decade');

    	decade.append('text')
    		.attr('class', 'decade__year')
    		.attr('text-anchor', 'middle')
    		.attr('alignment-baseline', 'middle')
    		.text(function(d) { return d.decade });

      	decade.append('rect')
      		.attr("class", "bar bar--women");
      	
      	decade.append('rect')
    		.attr("class", "bar bar--men");

		decade.append('text')
      		.attr('class', 'decade__percent decade__percent--women')
    		.attr('text-anchor', 'start')
    		.attr('alignment-baseline', 'middle')
    		.classed('is-visible', function(d) { return d.percentW })
    		.text(function(d) { return formatPercent(d.percentW) });
      	
      	decade.append('text')
      		.attr('class', 'decade__percent decade__percent--men')
    		.attr('text-anchor', 'end')
    		.attr('alignment-baseline', 'middle')
    		.classed('is-visible', function(d) { return d.percentW })
    		.text(function(d) { return formatPercent(d.percentM) });
      	



  //   	//ADD LABEL FOR EACH SVG

  //   	svg.append("text")
		// 	.attr("class","genre__label")
		// 	.style("text-anchor", "end")
		// 	.style("font-weight","bold")
		// 	.text(function(d) { 
		// 		// console.log(d)
		// 		return d.key; 
		// 	});


  //   	//ADD VALUE LABELS
  //   	bars.append("text")
		//     .attr("class", "smult__value")
		//     .text(function(d){
		//         if (d.percent_w >= d.percent_m){
		//           return d3.format(".0%")(d.percent_w);
		//         } else {
		//           return d3.format(".0%")(d.percent_m);
		//         }
		//     })
		//     .attr("text-anchor", function(d){
		//       	if (d.percent_w >= d.percent_m){
		//           return "end";
		//         } else {
		//           return "start";
		//         }
		//     })


		// //ADD AXES
		// svg.append("g")
  //   		.attr("class", "axis axis--y")

  //   	svg.append("g")
 	// 		.attr("class", "axis axis--x")

 	// 	svg.append("line")
 	// 		.attr("class", "zero")

	}

	function setupScales() {
		// scales.y = d3.scaleTime().domain([d3.timeParse("%Y")("1945"),d3.timeParse("%Y")("2025")]);
  		scales.count = d3.scaleLinear().domain([-countMax, countMax])
  		scales.percent = d3.scaleLinear().domain([-1, 1])
	}

	function setupChart() {
		setupScales()
		makeChartElements()
		
	}

	//UPDATE
	function getBandwidth() {
		var dom = scales.y
      	r = dom(d3.timeParse("%Y")("2025")) - dom(d3.timeParse("%Y")("1945"));
    	return Math.abs(r/9);
  	}

	function updateScales(){
		scales.count.range([0, width]);
		scales.percent.range([0, width]);
		// scales.y.range([0, height]);
	}

	function drawAxes(g){
		g.select('.axis--y')
	    	.call(d3.axisLeft(scales.y).ticks(7));

  		g.select('.axis--x')
		    .call(d3.axisTop(scales.x).ticks(6, "%"));
	}

	function updateChart() {
		// var margin = {top:25,bottom:10,left:33,right:20}
		// const ratio = 1.5;
		var margin = 30;
		var barHeight = fontSize / 2;
		var genrePadding = fontSize * 5;
		var decadePadding = fontSize / 1.25;
		var textWidth = 20;
		var titleOffset = 18;

		var numDecades = Math.floor((decadeExtent[1] - decadeExtent[0]) / 10);

		var svgWidth = chart.node().offsetWidth;
		var decadeHeight = numDecades * (barHeight + decadePadding);
		var svgHeight = (decadeHeight + genrePadding) * smultData.length + (margin * 2);
		
		width = svgWidth - margin * 2;
		height = svgHeight - margin * 2;

		svg
			.attr('width', svgWidth)
			.attr('height', svgHeight)

		var g = svg.select(".container")
		
		g.attr("transform", "translate(" + margin + "," + margin + ")")

      	updateScales()

      	var genre = g.selectAll('.genre')
      		.attr('transform', function(d, i) {
      			var y = i * (decadeHeight + genrePadding);
      			return "translate(" + 0 + "," + y + ")";
      		})

      	genre.select('.genre__title')
      		.attr('x', width / 2)

		var decade = genre.selectAll(".decade")
			.attr('transform', function(d, i) {
				var index = Math.floor((d.decade - decadeExtent[0]) / 10)
      			var y = index * (barHeight + decadePadding) + titleOffset;
      			return "translate(" + 0 + "," + y + ")";
      		})

		decade.selectAll('.bar')
			.attr('y', -fontSize / 3)
      		.attr("height", barHeight);

      	decade.select('.bar--women')
      		.attr('x', width / 2 + textWidth)
      		.attr('width', function(d) {
      			var v = scales[state](d[state + 'W']) - (width / 2)
      			return Math.max(v, 0)
      		})

      	decade.select('.decade__percent--women')
      		.attr('x', function(d) { 
      			return scales[state](d[state + 'W']) + textWidth * 1.25
      		})
      	

      	decade.select('.bar--men')
      		.attr('x', function(d) {
      			return scales[state](-d[state + 'M'])
      		})
      		.attr('width', function(d) {
      			var v = (width / 2) - scales[state](-d[state + 'M']) - textWidth
      			return Math.max(v, 0)
      		})
      	
      	decade.select('.decade__percent--men')
      		.attr('x', function(d) {
      			return scales[state](-d[state + 'M']) - textWidth * 0.25
      		})

      	decade.select('.decade__year')
      		.attr('x', width / 2)

  //     	var wbars = g.selectAll(".bar.women")
  //     		.attr("x", function(d) { return scales.x(0); })
  //     		.attr("width", function(d) { return Math.abs(scales.x(0) - scales.x(d.percent_w)); });
	
  //     	var mbars = g.selectAll(".bar.men")
	 //      	.attr("x", function(d) { return scales.x(-1*d.percent_m); })
  //   		.attr("width", function(d) { return Math.abs(scales.x(0) - scales.x(d.percent_m)); });

  //   	g.selectAll(".smult__value")
  //   		.attr("y", function(d) { return (scales.y(d.decade) + getBandwidth()/2 +5);})
		//     .attr("x", function(d) {
		//         if (d.percent_w >= d.percent_m){
		//           return scales.x((+d.percent_w - .04));
		//         } else {
		//           return scales.x(-1*(+d.percent_m - .04));
		//         }
		//     })

		// drawAxes(g)

		// g.selectAll(".genre__label")
		// 	.attr("y", height)
		// 	.attr("x", width)

		// g.select(".zero")
		// 	.attr("y1", scales.y(d3.timeParse("%Y")("1945")))
		// 	.attr("x1", scales.x(0))
		// 	.attr("y2", scales.y(d3.timeParse("%Y")("2025")))
		// 	.attr("x2", scales.x(0))
		// 	.style("stroke", "black");

	}

	function setup() {
		setupChart()	
	}

	function resize() {
		updateChart()
	}

	function init() {
		loadData(function() {
			// console.log("smult",smultData)
			// console.log(countMax)
			setup()
			resize()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()
