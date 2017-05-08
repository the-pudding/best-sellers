(function() {
	var colors = ['#0C4B4A','#1D5560','#3A5C74','#5B6283','#7F658B','#A3678C','#C26B86','#DB717A','#EC7E6B']
	var colorF = colors[0]
	var colorM = colors[8]
	// var colorFText = d3.color(colors[0]).brighter(10)
	// var colorMText = d3.color(colors[8]).darker(10)

	var tableData = null
	var tableCols = ["name", "gender", "genre", "rank", "count"]
	var chart = d3.select('.chart__tables')

	function cleanRow(row) {
		var target = {
			rank: +row.Rank,
			decade: +row.Decade,
			count: +row.Count,
			name: row.Name,
			gender: row.Gender,
			genre: row["Primary Genre"],
		}
		return target
	}

	function loadData(cb) {
		d3.tsv('assets/table_data.tsv', cleanRow, function(err, data) {
			tableData = d3.nest()
				.key(function(d) { return d.decade })
				.entries(data)
				.reverse()
			cb()
		});
	}

	function setupElements(){
		var dataToPass = null
		var tables = chart.select('.tables__container').selectAll('table')
				.data(tableData)
			.enter()
				.append('table')
				.attr('class', function(d) { return 'table-' + d.key })
				.classed('is-active', function(d, i) { return !i })

		tables.append('caption')
			.text(function(d) {return 'Top authors in the ' + d.key + 's by number of books' })
			.attr('class', 'x-small')

		var tableToggle = chart.select('.tables__toggle')
		var tableHead = tables.append('thead')
		var tableBody = tables.append('tbody')

		var tableRow = tableBody.selectAll('tr')
				.data(function(d) {return d.values;})
				.enter()
				.append('tr')

		tableCols.map(function(k) {
			tableHead.append('th')
				.classed('is-number', function(d) { return k === 'rank' || k === 'count' })
				.text(k)

			var td = tableRow.append('td')
				.classed('is-number', function(d) { return k === 'rank' || k === 'count' })
				.text(function(d){ return d[k]})

			if (k === 'name') {
				// td.style('background-color', function(d) {
				// 	return d.gender === 'Male' ? colorM : colorF;
				// })
				td.style('color', function(d) {
					return d.gender === 'Male' ? colorM : colorF;
				})
				td.style('font-weight', 'bold')
			}

							
		})

		var li = tableToggle.selectAll('li')
			.data(tableData)
		.enter().append('li')
		
		li.append('button')
			.attr('class', 'btn toggle__button xxx-small')
			.attr('value', function(d) { return d.key })
			.text(function(d) { return d.key })
			.classed('is-active', function(d, i) { return !i })
	}

	function handleToggle() {
		chart.selectAll('.toggle__button')
			.classed('is-active', false)

		d3.select(this).classed('is-active', true)
		
		chart.selectAll('table')
			.classed('is-active', false)

		chart.select('.table-' + this.value)
			.classed('is-active', true)
	}

	function setupEvents() {
		chart.selectAll('.toggle__button').on('click', handleToggle)
	}

	function init() {
		loadData(function() {
			setupElements()
			setupEvents()
		})
	}
	init()
})()