import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// ---------- Data loading & processing ----------

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;

      const ret = {
        id: commit,
        // TODO: replace YOUR_REPO with owner/repo to make links work
        url: 'https://github.com/YOUR_REPO/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      // keep the raw lines but don’t clutter the console
      Object.defineProperty(ret, 'lines', {
        value: lines,
        configurable: true,
        writable: true,
        enumerable: false,
      });

      return ret;
    });
}

// ---------- Tooltip helpers ----------

function renderTooltipContent(commit) {
  if (!commit) return;
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
}

function updateTooltipVisibility(isVisible) {
  const t = document.getElementById('commit-tooltip');
  t.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const t = document.getElementById('commit-tooltip');
  t.style.left = `${event.clientX}px`;
  t.style.top = `${event.clientY}px`;
}

// ---------- Selection helpers (used by brush) ----------

let xScale, yScale; // shared with brush logic

function isCommitSelected(selection, d) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const px = xScale(d.datetime);
  const py = yScale(d.hourFrac);
  return x0 <= px && px <= x1 && y0 <= py && py <= y1;
}

function renderSelectionCount(selection, commits) {
  const selected = selection ? commits.filter(d => isCommitSelected(selection, d)) : [];
  const el = document.querySelector('#selection-count');
  el.textContent = `${selected.length || 'No'} commits selected`;
  return selected;
}

function renderLanguageBreakdown(selection, commits) {
  const selected = selection ? commits.filter(d => isCommitSelected(selection, d)) : commits;
  const lines = selected.flatMap(d => d.lines);
  const container = document.getElementById('language-breakdown');

  if (selected.length === 0) {
    container.innerHTML = '';
    return;
  }

  const breakdown = d3.rollup(
    lines,
    v => v.length,
    d => d.type // file "type" from your CSV (html, css, js, etc.)
  );

  const total = lines.length;
  let html = '';
  for (const [language, count] of breakdown) {
    const p = d3.format('.1%')(count / total);
    html += `<dt>${language}</dt><dd>${count} lines (${p})</dd>`;
  }
  container.innerHTML = html;
}

// ---------- Main chart ----------

async function renderScatterPlot() {
  const data = await loadData();
  const commits = processCommits(data);

  const width = 1000;
  const height = 600;

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // margins & inner area
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };
  const usable = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // scales (stored globally for brush computations)
  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usable.left, usable.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usable.bottom, usable.top]);

  // axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g')
     .attr('transform', `translate(0, ${usable.bottom})`)
     .call(xAxis);

  svg.append('g')
     .attr('transform', `translate(${usable.left}, 0)`)
     .call(yAxis);

  // gridlines (horizontal)
  svg.append('g')
     .attr('class', 'gridlines')
     .attr('transform', `translate(${usable.left}, 0)`)
     .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usable.width));

  // radius scale (area fair)
  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  // draw dots, big first
  const sorted = commits.slice().sort((a, b) => d3.descending(a.totalLines, b.totalLines));
  const dotsLayer = svg.append('g').attr('class', 'dots');

  dotsLayer.selectAll('circle')
    .data(sorted)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r',  d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // brushing
  function brushed(event) {
    const selection = event.selection;
    svg.selectAll('circle')
      .classed('selected', d => isCommitSelected(selection, d));
    renderSelectionCount(selection, commits);
    renderLanguageBreakdown(selection, commits);
  }

  svg.call(d3.brush().on('start brush end', brushed));

  // keep dots above brush overlay so hover works
  svg.selectAll('.dots, .overlay ~ *').raise();
}

renderScatterPlot();
