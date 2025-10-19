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






// // ---- DEBUG START
// console.log("Hostname:", location.hostname, "Pathname:", location.pathname);
// // ---- DEBUG END

// // Step 3: Automatic Navigation Menu
// let pages = [
//   { url: "", title: "Home" },
//   { url: "projects/", title: "Projects" },
//   { url: "cv.html", title: "CV" },
//   { url: "contact/", title: "Contact" },
//   { url: "https://github.com/Frank-Junran-Yang", title: "GitHub" }
// ];

// const BASE_PATH =
//   location.hostname === "localhost" || location.hostname === "127.0.0.1"
//     ? "/"
//     : "/portfolio/"; // your repo name

// // ---- DEBUG
// console.log("BASE_PATH:", BASE_PATH);
// // ----

// let nav = document.createElement("nav");
// document.body.prepend(nav);

// for (let p of pages) {
//   let url = p.url;
//   let title = p.title;

//   if (!url.startsWith("http")) url = BASE_PATH + url;

//   let a = document.createElement("a");
//   a.href = url;
//   a.textContent = title;

//   a.classList.toggle(
//     "current",
//     a.host === location.host && a.pathname === location.pathname
//   );
//   a.toggleAttribute("target", a.host !== location.host);

//   nav.append(a);
// }

// console.log("Built nav with", nav.querySelectorAll("a").length, "links");
