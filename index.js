// index.js (root)
import { fetchJSON, renderProjects } from './global.js';
import { fetchGitHubData } from './global.js';
const githubData = await fetchGitHubData('Frank-Junran-Yang');
console.log(githubData);
const profileStats = document.querySelector('#profile-stats');
if (profileStats) {
  profileStats.innerHTML = `
    <dl>
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
    </dl>
  `;
}

try {
  // 1) Load all projects (path is from the ROOT page)
  const projects = await fetchJSON('./lib/projects.json');

  // 2) Pick the first 3 (assumes newest are first in the JSON)
  const latestProjects = projects.slice(0, 3);

  // 3) Find the container on the homepage
  const homeContainer = document.querySelector('.projects');

  // 4) Render them
  renderProjects(latestProjects, homeContainer, 'h2');

  // 5) Optional: add a small heading count on the home page (if you add one)
  const titleEl = document.querySelector('.latest-projects-title');
  if (titleEl) {
    titleEl.textContent = `Latest ${latestProjects.length} Projects`;
  }
} catch (err) {
  console.error('Failed to render latest projects on home:', err);
}
