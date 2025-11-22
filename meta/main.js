import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale, yScale;
let commitProgress = 100;
let timeScale;
let commitMaxTime;

let commits = [];
let filteredCommits = [];

// ---------- Load CSV ----------
async function loadData() {
  return d3.csv("loc.csv", row => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime)
  }));
}

// ---------- Group by commit ----------
function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([id, lines]) => {
    const first = lines[0];
    const datetime = first.datetime;

    const commit = {
      id,
      url: "https://github.com/YOUR_REPO/commit/" + id,
      author: first.author,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length
    };

    Object.defineProperty(commit, "lines", {
      value: lines,
      enumerable: false
    });

    return commit;
  });
}

// ---------- Tooltip ----------
function renderTooltipContent(commit) {
  document.getElementById("commit-link").href = commit.url;
  document.getElementById("commit-link").textContent = commit.id;
  document.getElementById("commit-date").textContent =
    commit.datetime.toLocaleString("en", {
      dateStyle: "full",
      timeStyle: "short"
    });
}

function updateTooltipVisibility(v) {
  document.getElementById("commit-tooltip").hidden = !v;
}

function updateTooltipPosition(e) {
  const t = document.getElementById("commit-tooltip");
  t.style.left = `${e.clientX}px`;
  t.style.top = `${e.clientY}px`;
}

// ---------- Scatter Plot ----------
function renderScatterPlot(commits) {
  const width = 1000, height = 600;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  const margin = { top: 10, right: 10, bottom: 30, left: 40 };
  const usable = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usable.left, usable.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usable.bottom, usable.top]);

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${usable.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${usable.left},0)`)
    .call(
      d3.axisLeft(yScale)
        .tickFormat(d => String(d).padStart(2, "0") + ":00")
    );

  svg.append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${usable.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat("").tickSize(-usable.width));

  svg.append("g").attr("class", "dots");

  updateScatterPlot(commits);
}

function updateScatterPlot(commitsToShow) {
  const svg = d3.select("#chart svg");

  xScale.domain(d3.extent(commitsToShow, d => d.datetime));
  svg.select(".x-axis").call(d3.axisBottom(xScale));

  const [minLines, maxLines] = d3.extent(commitsToShow, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  svg.select(".dots")
    .selectAll("circle")
    .data(commitsToShow, d => d.id)
    .join("circle")
    .attr("cx", d => xScale(d.datetime))
    .attr("cy", d => yScale(d.hourFrac))
    .attr("r", d => rScale(d.totalLines))
    .attr("fill", "steelblue")
    .style("fill-opacity", 0.7)
    .on("mouseenter", (e, d) => {
      d3.select(e.currentTarget).style("fill-opacity", 1);
      renderTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(e);
    })
    .on("mousemove", updateTooltipPosition)
    .on("mouseleave", (e) => {
      d3.select(e.currentTarget).style("fill-opacity", 0.7);
      updateTooltipVisibility(false);
    });
}

// ---------- Step 2.1: File visualization ----------
function updateFileDisplay(commitsToShow) {
  const lines = commitsToShow.flatMap(d => d.lines);

  let files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  let container = d3.select("#files")
    .selectAll("div")
    .data(files, d => d.name)
    .join(enter => {
      enter.append("div").call(div => {
        div.append("dt").append("code");
        div.append("dd");
      });
    });

  container.select("dt > code").text(d => d.name);

  container.select("dd")
    .selectAll("div")
    .data(d => d.lines)
    .join("div")
    .attr("class", d => `loc type-${d.type}`);
}

// ---------- Slider ----------
function onTimeSliderChange() {
  commitProgress = +document.getElementById("commit-progress").value;
  commitMaxTime = timeScale.invert(commitProgress);

  document.getElementById("commit-time").textContent =
    commitMaxTime.toLocaleString("en", {
      dateStyle: "long",
      timeStyle: "short"
    });

  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  updateScatterPlot(filteredCommits);
  updateFileDisplay(filteredCommits);
}

// ---------- Step 3.2: Generate Scrollytelling Text ----------
function renderStoryText(commits) {
  d3.select("#scatter-story")
    .selectAll(".step")
    .data(commits)
    .join("div")
    .attr("class", "step")
    .html(d => `
      <p><strong>${d.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}</strong></p>
      <p>I made <a href="${d.url}" target="_blank">${d.id}</a>, editing ${d.totalLines} lines.</p>
      <p>It affected ${d3.rollups(d.lines, v => v.length, d => d.file).length} files.</p>
    `);
}

// ---------- Step 3.3: Scrollama ----------
function setupScrollama() {
  function onStepEnter(response) {
    const commit = response.element.__data__;
    updateScatterPlot([commit]);
  }

  const scroller = scrollama();
  scroller
    .setup({
      container: "#scrolly-1",
      step: "#scrolly-1 .step"
    })
    .onStepEnter(onStepEnter);
}

// ---------- Init ----------
(async function init() {
  const raw = await loadData();
  commits = processCommits(raw);

  timeScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([0, 100]);

  filteredCommits = commits;

  renderScatterPlot(commits);
  updateFileDisplay(commits);
  renderStoryText(commits);

  document.getElementById("commit-progress")
    .addEventListener("input", onTimeSliderChange);

  setupScrollama();
})();
