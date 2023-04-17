const API_KEY =
  "28DlyyeGXK7wNNsF0NZUfPHVUnNdkEvb3muP_fnv9fZ3u4U1FSDFrLvu2QUEpudM";

// Add the chart ID's under `id` ↓
const charts = [
  {
    id: "13041152",
    dataset: 1,
    container: "#chart-4",
    fl_data_name: "rows",
    visual: null,
    options: null,
  },
  {
    id: "13041358",
    dataset: 2,
    container: "#chart-0",
    fl_data_name: "rows",
    visual: null,
    options: null,
  },
  {
    id: "13041369",
    dataset: 3,
    container: "#chart-1",
    fl_data_name: "rows",
    visual: null,
    options: null,
  },
  {
    id: "13289586",
    dataset: 4,
    container: "#chart-2",
    fl_data_name: "rows",
    visual: null,
    options: null,
  },
  {
    id: "13289612",
    dataset: 5,
    container: "#chart-3",
    fl_data_name: "rows",
    visual: null,
    options: null,
  },
];

// Filter variables.
const filters = [
  { name: "year", column: "Year", label: "Year", filter_value: "" },
  { name: "annex", column: "Annex", label: "Annex", filter_value: "" },
];

// Helpers.
function slugify(string) {
  const a =
    "àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;";
  const b =
    "aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------";
  const p = new RegExp(a.split("").join("|"), "g");

  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

// Build charts.
function filterByValues(data, chart_info) {
  // Get data via the dataset column (that should be in the data).
  const dataset = data
    .filter((d) => d.dataset === chart_info.dataset)
    .filter((d) => {
			// Get values based on all filters.
			const check_filters = filters.map(dd => d[dd.column] === dd.filter_value);
			return check_filters.every(bool => bool);
		});

  return dataset;
}

function toggleChartContainer(container, dataLength) {
  d3.select(container).style('display', dataLength ? 'block' : 'none')
}

function updateCharts(data) {
  charts.forEach((chart) => {
    // Get data.
    const dataset = filterByValues(data, chart);

    // Update chart.
    chart.options.data = { [chart.fl_data_name]: dataset };
    chart.visual.update(chart.options);

    // Hide chart if no data.
    toggleChartContainer(chart.container, dataset.length)
  });
}

function buildCharts(data, base_charts) {
  base_charts.forEach((base_chart, i) => {
    // Get chart info.
    const chart = charts[i];

    // Get data.
    const dataset = filterByValues(data, chart);

    // Augment API props.
    chart.options = base_chart;
    chart.options.api_key = API_KEY;
    chart.options.container = chart.container;
    chart.options.data = { [chart.fl_data_name]: dataset };

    // Build visual.
    chart.visual = new Flourish.Live(chart.options);

    // Hide chart if no data.
    toggleChartContainer(chart.container, dataset.length)
  });
}

// Build controls.
function controlStructure(column, label) {
  const parent = d3
    .select("#controls")
    .append("div")
    .attr("id", `${slugify(column)}`)
    .attr("class", 'control');

	parent.append("h3").attr("class", "control-header").html(label);

	return parent.append("div").attr("class", "control-body");
}

function buildDropdowns(data) {
  filters.forEach((filter) => {
		// Get dropdown values and set initial filter value.
		const values = [...new Set(data.map((d) => d[filter.column]))];
		filter.filter_value = values[0];
		console.log(filter.filter_value);
	
		// Build dropdown.
		const body = controlStructure(filter.column, filter.label);

		const dropdown = body
			.append("select")
			.attr('data-column', filter.column);
	
		dropdown
			.selectAll("option")
			.data(values)
			.join("option")
			.attr("value", (d) => d)
			.html((d) => d);
	
		// Dropdown listener.
		dropdown.on("change", function () {
			// Set the new filter value of the chosen filter object.
			filters.filter(d => d.column === this.dataset.column)[0].filter_value = this.value;
			// Update the chart (which will filter based on all set filters).
			updateCharts(data);
		});
	});
}

// Build size controls

// Main function.
function main(data, base_charts) {
  buildDropdowns(data);
  buildCharts(data, base_charts);
}

// Fetch data and base chart info.
const data_promise = d3.csv("data/eba-data.csv", d3.autoType);
const chart_promises = charts.map((chart) =>
  d3.json(
    `https://public.flourish.studio/visualisation/${chart.id}/visualisation-object.json`
  )
);

Promise.all([data_promise, ...chart_promises]).then((res) =>
  main(res[0], res.slice(1))
);

// ----------------------------------------------
// Note, we can build in size controls controling
// the width (width of the container) and
// the height (chart.options.height) separately.
