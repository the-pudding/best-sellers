(function() {
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
		var tables = chart.selectAll("table")
				.data(tableData)
				.enter()
				.append('table')
		tables.append('caption')
			.text(function(d) {return d.key})
		var tableHead = tables.append('thead')
		var tableBody = tables.append('tbody')

		var tableRow = tableBody.selectAll('tr')
				.data(function(d) {return d.values;})
				.enter()
				.append('tr')

		tableCols.map(function(k){
			tableHead.append('th')
				.classed('is-number', function(d) { return k === 'rank' || k === 'count' })
				.text(k)

			tableRow.append('td')
				.classed('is-number', function(d) { return k === 'rank' || k === 'count' })
				.text(function(d){ return d[k]})
		})

//		tableHead.text(function(d){ return d.key })
	}

	function init() {
		loadData(function() {
			setupElements()
		})
	}
	init()
})()