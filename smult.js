(function() {

	//VARS
	var mobile = false;
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

	var annotations = [{
		note: {
			// title: "Tk annotation goes here I think",
			label: "1/4 of female-authored Horror/Paranormal fiction in the 2010s is also Romance",
			wrap: 180,
		},
		data: { genre: 'Horror/Paranormal', decade: 2010, percent: 0.52 },
		px: 15,
		py: -2
	}, {
		note: {
			// title: "Tk annotation goes here I think",
			label: "Most Mystery books by women on the list in the 1970s were by Agatha Christie",
			wrap: 180,
		},
		data: { genre: 'Mystery', decade: 1970, percent: 0.4 },
		px: 12,
		py: 3
	}]

	var annotations2 = [{
		note: {
			// title: "Tk annotation goes here I think",
			label: "Consistently male-dominated genres",
			wrap: 120,
		},
		data: { genreFrom: 'Spy/Politics', genreTo: 'Suspense', decadeFrom: 1950, decadeTo: 2010, percent: 0.3, dir: 1 },
		px: 3,
		py: 3
	},  {
		note: {
			// title: "Tk annotation goes here I think",
			label: "Relatively small genres, but gender balanced or female-dominated",
			wrap: 120,
		},
		data: { genreFrom: 'Historical', genreTo: 'Domestic', decadeFrom: 1950, decadeTo: 2010, percent: -0.7, dir: -1 },
		px: -2,
		py: -3
	}, {
		note: {
			// title: "Tk annotation goes here I think",
			label: "Most best-selling books are in this category, and it closely matches the overall gender ratio",
			wrap: 120,
		},
		data: { genreFrom: 'Literary/None', genreTo: 'Literary/None', decadeFrom: 1950, decadeTo: 2010, percent: -0.73, dir: -1 },
		px: -2,
		py: -3,
	}]


	function formatPercent(num) {
		return d3.format('.0%')(num);
	}

 	function cleanRowNew(row) {
 		var percentW = +row.women_count/row.total_count;
 		var percentM = 1 - percentW;
 		var countW = +row.women_count;
 		var countTotal = row.total_count;
 		var countM = row.total_count - row.women_count;
		
		var out = {
			percentW: percentW,
	 		percentM: percentM,
	 		countW: countW,
	 		countTotal: countTotal,
	 		countM: countM,
			decade: +row.decade,
			genre: row.genre,
		}

		return out;
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
			decade: +row.decade,
			genre: row.genre,
		}

		return out;
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

		d3.tsv('assets/smult_data_2.tsv', cleanRowNew, function(err, data) {

			var filtered = data.filter(function(d) { return d.countTotal > 10 })

			decadeExtent = d3.extent(filtered, function(d) { return d.decade })
			countMax = d3.max(filtered, function(d) { return d.countM })
			smultData = d3.nest()
				.key(function(d) { return d.genre })
				.entries(filtered)
				.sort(sortGenres)
				.map(fillEmptyDecades)
				.filter(function(d) { return d.key !== 'Other' });

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

    	g.append('g')
    		.attr('class', 'annotations-1')

    	g.append('g')
    		.attr('class', 'annotations-2')
      	
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
		var margin = { top: 30, left: mobile ? 30 : 100 };
		var barHeight = fontSize / 2;
		var genrePadding = fontSize * 5;
		var decadePadding = fontSize / 1.25;
		var textWidth = 20;
		var titleOffset = 18;

		var numDecades = Math.floor((decadeExtent[1] - decadeExtent[0]) / 10);

		var svgWidth = chart.node().offsetWidth;
		var decadeHeight = numDecades * (barHeight + decadePadding);
		var svgHeight = (decadeHeight + genrePadding) * smultData.length + (margin.top * 2);
		
		width = svgWidth - margin.left * 2;
		height = svgHeight - margin.top * 2;

		svg
			.attr('width', svgWidth)
			.attr('height', svgHeight)

		var g = svg.select(".container")
		
		g.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

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

      	// updateAnnotations
      	var type = d3.annotationCallout

      	var offset = Math.round(width * 0.01)
      	annotations.forEach(function(d) {
      		d.dx = offset * d.px
      		d.dy = offset * d.py
      	})

		var makeAnnotations = d3.annotation()
		  .editMode(false)
		  .type(type)
		  .accessors({
		    x: function(d) {
		    	var x = scales.percent(d.percent)
		    	var buffer = d.percent ? 0 : textWidth * 3 * d.dir
		    	return x + buffer
		    },
		    y: function(d) {
		    	var i = smultData.findIndex(function(v) { return v.key === d.genre })
		    	var y = i * (decadeHeight + genrePadding);
		    	var index = Math.floor((d.decade - decadeExtent[0]) / 10)
      			var off = index * (barHeight + decadePadding) + titleOffset;
		    	return y + off;
		    },
		  })
		  .annotations(annotations)

		// console.log("annotations-1",mobile)
		svg.select('.annotations-1')
			.call(makeAnnotations)
			.classed('is-hidden', mobile)




			// updateAnnotations2
      	var type2 = d3.annotationXYThreshold

      	// var offset = Math.round(width * 0.01)
      	annotations2.forEach(function(d) {
      		var x = scales.percent(d.data.percent) + textWidth * 3 * d.data.dir
      		var i1 = smultData.findIndex(function(v) { return v.key === d.data.genreFrom })
	    	var y1 = i1 * (decadeHeight + genrePadding);
	    	var index1 = Math.floor((d.data.decadeFrom - decadeExtent[0]) / 10)
  			var off1 = index1 * (barHeight + decadePadding) + titleOffset;
  			
  			var i2 = smultData.findIndex(function(v) { return v.key === d.data.genreTo })
	    	var y2 = i2 * (decadeHeight + genrePadding);
	    	var index2 = Math.floor((d.data.decadeTo - decadeExtent[0]) / 10)
  			var off2 = index2 * (barHeight + decadePadding) + titleOffset;

      		d.subject = {
      			x1: x,
      			y1: y1 + off1,
      			x2: x,
      			y2: y2 + off2,
      		}

      		d.dx = offset * d.px
      		d.dy = offset * d.py

      		// console.log(d)
      	})

		var makeAnnotations2 = d3.annotation()
		  .editMode(false)
		  .type(type2)
		  .accessors({
		    x: function(d) {
		    	var x = scales.percent(d.percent)
		    	var buffer = textWidth * 3 * d.dir
		    	return x + buffer
		    },
		    y: function(d) {
		    	var i1 = smultData.findIndex(function(v) { return v.key === d.genreFrom })
		    	var y1 = i1 * (decadeHeight + genrePadding);
		    	var index1 = Math.floor((d.decadeFrom - decadeExtent[0]) / 10)
		    	var off1 = index1 * (barHeight + decadePadding) + titleOffset;

		    	var i2 = smultData.findIndex(function(v) { return v.key === d.genreTo })
		    	var y2 = i2 * (decadeHeight + genrePadding);
		    	var index2 = Math.floor((d.decadeTo - decadeExtent[0]) / 10)
		    	var off2 = index2 * (barHeight + decadePadding) + titleOffset;
      		
      			var half = (y2 + off2 - y1 + off1) / 2
		    	return y1 + half
		    },
		  })
		  .annotations(annotations2)

		svg.select('.annotations-2')
			.call(makeAnnotations2)
			.classed('is-hidden', mobile)



	}

	function setup() {
		setupChart()	
	}

	function resize() {
		var breakpoint = 800;
		var w = d3.select('body').node().offsetWidth;
		mobile = w < breakpoint;
		updateChart()
	}

	function init() {
		loadData(function() {
			setup()
			resize()
			window.addEventListener('resize', resize)
		})
	}

	init()
})()