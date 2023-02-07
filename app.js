const API_KEY = '<PLEASE ADD YOUR API KEY HERE>';

// Add the chart ID's under `id` ↓
const charts = [
  { id: '12637163', dataset: 1, container: '#chart-0', visual: null, options: null },
  { id: '12106443', dataset: 2, container: '#chart-1', visual: null, options: null },
  { id: '12105881', dataset: 2, container: '#chart-2', visual: null, options: null },
  { id: '12106012', dataset: 3, container: '#chart-3', visual: null, options: null },
];

// Filter variables.
const FILTER_COLUMN = 'NRI-FORMAT';
let initial_filter_value = '';

// Helpers.
function slugify(string) {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
  const p = new RegExp(a.split('').join('|'), 'g');

  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

// Build charts.
function filterByValue(data, chart_info, filter_value) {
  // Get data via the dataset column (that should be in the data).
  const dataset = data
    .filter(d => d.dataset === chart_info.dataset)
    .filter(d => d[FILTER_COLUMN] === filter_value);

  return dataset;
}

function updateCharts(data, filter_value) {
  charts.forEach(chart => {
    // Get data.
    const dataset = filterByValue(data, chart, filter_value);

    // Update chart.
    chart.options.data = { data: dataset };
    chart.visual.update(chart.options);
  });
}

function buildCharts(data, base_charts) {
  base_charts.forEach((base_chart, i) => {
    // Get chart info.
    const chart = charts[i];

    // Get data.
    const dataset = filterByValue(data, chart, initial_filter_value);

    // Augment API props.
    chart.options = base_chart;
    chart.options.api_key = API_KEY;
    chart.options.container = chart.container;
    chart.options.data = { data: dataset }; // Assuming a single Flourish dataset named `data`.

    // Build visual.
    chart.visual = new Flourish.Live(chart.options);
  });
}

// Build controls.
function controlStructure(column) {
  const parent = d3
    .select('#controls')
    .append('div')
    .attr('class', `${slugify(column)} control`);
  parent.append('h3').attr('class', 'control-header').html(column);
  return parent.append('div').attr('class', 'control-body');
}

function buildSimpleDropdown(data) {
  // Get dropdown values and set initial filter value.
  const values = [...new Set(data.map(d => d[FILTER_COLUMN]))];
  initial_filter_value = values[0];
  console.log(initial_filter_value);

  // Build dropdown.
  const body = controlStructure(FILTER_COLUMN);
  const dropdown = body.append('select');

  dropdown
    .selectAll('option')
    .data(values)
    .join('option')
    .attr('value', d => d)
    .html(d => d);

  dropdown.on('change', function () {
    updateCharts(data, this.value);
  });
}

// Build size controls

// Main function.
function main(data, base_charts) {
  buildSimpleDropdown(data);
  buildCharts(data, base_charts);
}

// Fetch data and base chart info.
const data_promise = d3.csv('data/eba-data.csv', d3.autoType);
const chart_promises = charts.map(chart =>
  d3.json(`https://public.flourish.studio/visualisation/${chart.id}/visualisation-object.json`)
);

Promise.all([data_promise, ...chart_promises]).then(res => main(res[0], res.slice(1)));

// ----------------------------------------------
// Note, we can build in size controls controling
// the width (width of the container) and
// the height (chart.options.height) separately.
