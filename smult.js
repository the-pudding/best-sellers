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

		var decade = genreEnter.selectAll('.decade')
			.data(function(d) { return d.values; })
    		.enter().append('g')
    			.attr('class', 'decade');

      	decade.append('rect')
      		.attr("class", "bar bar--women");
      	
      	decade.append('rect')
    		.attr("class", "bar bar--men");


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
		var margin = 20;
		var barHeight = 4;
		var genrePadding = 50;
		var decadePadding = 5;
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

		var decade = genre.selectAll(".decade")
			.attr('transform', function(d, i) {
				var index = Math.floor((d.decade - decadeExtent[0]) / 10)
      			var y = index * (barHeight + decadePadding);
      			return "translate(" + 0 + "," + y + ")";
      		})

		decade.selectAll('.bar')
			.attr('y', 0)
      		.attr("height", barHeight);

      	decade.selectAll('.bar--women')
      		.attr('x', function(d) {
      			return scales[state](-d[state + 'W'])
      		})
      		.attr('width', function(d) {
      			return (width / 2) - scales[state](-d[state + 'W'])
      		})
      		.attr('data-w', function(d) { return d.decade + '-' + d.genre })

      	decade.selectAll('.bar--men')
      		.attr('x', width / 2)
      		.attr('width', function(d) {
      			return scales[state](d[state + 'M']) - (width / 2)
      		})

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
