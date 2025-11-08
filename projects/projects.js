import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let query = '';
let selectedYear = null;   // null = no selection

// --- data ---
const projects = await fetchJSON('../lib/projects.json');

// --- d3 helpers & DOM refs ---
const sliceGenerator = d3.pie().value(d => d.value);
const arcGenerator  = d3.arc().innerRadius(0).outerRadius(50);
const colors        = d3.scaleOrdinal(d3.schemeTableau10);

const svg       = d3.select('#projects-plot');
const legend    = d3.select('.legend');
const container = document.querySelector('.projects');
const titleEl   = document.querySelector('.projects-title');

// group -> [{label: year, value: count}]
function toPieData(arr) {
  const rolled = d3.rollups(arr, v => v.length, d => d.year)
                   .sort((a, b) => +a[0] - +b[0]);
  return rolled.map(([year, count]) => ({ label: String(year), value: count }));
}

// text search across all fields
function getFilteredByText() {
  const q = (query || '').trim().toLowerCase();
  if (!q) return projects;
  return projects.filter(p =>
    Object.values(p).join('\n').toLowerCase().includes(q)
  );
}

// pie + legend from a given array of projects
function renderViz(arr) {
  const data = toPieData(arr);
  const arcs = sliceGenerator(data);

  // PIE
  svg.selectAll('path')
    .data(arcs, d => d.data.label)
    .join(
      enter => enter.append('path')
                    .attr('d', arcGenerator)
                    .style('--color', (d, i) => colors(i))
                    .on('click', (e, d) => {
                      const year = d.data.label;
                      selectedYear = (selectedYear === year ? null : year);
                      renderAll();
                    }),
      update => update.attr('d', arcGenerator),
      exit   => exit.remove()
    )
    .classed('selected', d => d.data.label === selectedYear);

  // LEGEND
  legend.selectAll('li')
    .data(data, d => d.label)
    .join(
      enter => enter.append('li')
                    .attr('class', 'legend-item')
                    .style('--color', (d, i) => colors(i))
                    .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
                    .on('click', (e, d) => {
                      const year = d.label;
                      selectedYear = (selectedYear === year ? null : year);
                      renderAll();
                    }),
      update => update
                  .style('--color', (d, i) => colors(i))
                  .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`),
      exit   => exit.remove()
    )
    .classed('selected', d => d.label === selectedYear);
}

// cards + title
function renderList(arr) {
  renderProjects(arr, container, 'h2');
  if (titleEl) {
    const n = arr.length;
    titleEl.textContent = `${n} Project${n === 1 ? '' : 's'}`;
  }
}

// single entry point
function renderAll() {
  const byText = getFilteredByText();
  const toRender = selectedYear
    ? byText.filter(p => String(p.year) === String(selectedYear))
    : byText;

  renderViz(toRender);
  renderList(toRender);
}

// search input
const searchInput = document.querySelector('.searchBar');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    query = e.target.value;
    renderAll();
  });
}

// initial paint
renderAll();
