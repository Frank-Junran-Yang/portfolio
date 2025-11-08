console.log('IT’S ALIVE!');

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select id="color-scheme">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// let navLinks = $$("nav a");  // This uses the $$ helper we defined earlier
// console.log(navLinks);


// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );
// console.log("Current link:", currentLink);

// if (currentLink) {
//   // or if (currentLink !== undefined)
//   currentLink?.classList.add('current');
// }


// Step 3: Automatic Navigation Menu

// 1️⃣ List of pages as an array of objects
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'cv.html', title: 'CV' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/Frank-Junran-Yang', title: 'GitHub' }
];

// 2️⃣ Detect environment to build correct base path
const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/'                            // local server
    : '/portfolio/';                 // GitHub Pages repo name
// adjust “portfolio” if your repo name differs

// 3️⃣ Create a <nav> element and add it to the top of <body>
let nav = document.createElement('nav');
document.body.prepend(nav);

// 4️⃣ Generate links dynamically
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Prefix relative links with BASE_PATH
  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }

  // Create <a> element
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // Highlight the current page automatically
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in a new tab
  a.toggleAttribute('target', a.host !== location.host);

  // Add link to the nav bar
  nav.append(a);
}

const select = document.querySelector('#color-scheme');

// 1) Apply saved choice (if any). If none, stay automatic (CSS handles it).
const saved = localStorage.getItem('colorScheme'); // "light" | "dark" | null
if (saved === 'light' || saved === 'dark') {
  document.documentElement.style.setProperty('color-scheme', saved);
  select.value = saved;
} else {
  // No saved preference -> Automatic
  select.value = 'light dark';
  // IMPORTANT: no inline override; let CSS rule html{color-scheme:light dark} decide
  document.documentElement.style.removeProperty('color-scheme');
}

// 2) React to user changes
select.addEventListener('input', (e) => {
  const value = e.target.value; // "light", "dark", or "light dark"

  if (value === 'light dark') {
    // Go back to automatic: remove inline override + forget storage
    document.documentElement.style.removeProperty('color-scheme');
    localStorage.removeItem('colorScheme');
  } else {
    // Force a mode & remember it
    document.documentElement.style.setProperty('color-scheme', value);
    localStorage.setItem('colorScheme', value);
  }
});


// 1) Fetch helper
export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error fetching or parsing JSON data:', err);
    throw err;
  }
}

// 2) Render helper
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement) {
    console.error('renderProjects: container element not found');
    return;
  }
  if (!Array.isArray(projects)) {
    console.error('renderProjects: projects must be an array');
    return;
  }

  containerElement.innerHTML = '';

  for (const project of projects) {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title ?? 'Untitled Project'}</${headingLevel}>
      <img src="${project.image ?? 'https://via.placeholder.com/150'}"
          alt="${project.title ?? ''}" loading="lazy">
      <div class="project-text">
        <p>${project.description ?? 'No description available.'}</p>
        <p class="project-year"><em>c. ${project.year ?? ''}</em></p>
      </div>
    `;
    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

