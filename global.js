console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let navLinks = $$("nav a");  // This uses the $$ helper we defined earlier
console.log(navLinks);

currentLink?.classList.add("current");