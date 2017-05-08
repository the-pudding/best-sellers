(function() {
	var tableData = null
	var tableCols = null
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
		if(tableCols === null){
			tableCols = Object.keys(target)
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
		console.log("inside setup")
		var tables = chart.selectAll("table")
				.data(tableData)
				.enter()
				.append('table')
		tables.append('caption')
			.text(function(d) {return d.key})
		var tableHead = tables.append('thead')
		var tableRow = tables.selectAll('tbody')
				.data(function(d) {return d.values;})
				.enter()
				.append('tr')

		tableCols.map(function(k){
			if(k!="decade"){
				tableHead.append('th')
					.text(k)
				tableRow.append('td')
					.text(function(d){ return d[k]})
			}
		})

//		tableHead.text(function(d){ return d.key })
	}

	function init() {
		loadData(function() {
			console.log(tableData)
			setupElements()
		})
	}
	init()
})()