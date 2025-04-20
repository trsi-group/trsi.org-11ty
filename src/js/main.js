function handleFilterChange(event) {
  const cards = document.querySelectorAll("#feed-wrapper .column");
  const typeFilter = document.getElementById("TypeFilter");
  const platformFilter = document.getElementById("PlatformFilter");

  const selectedType = typeFilter.value;
  const selectedPlatform = platformFilter.value;
  cards.forEach(card => {
    const typeMatch = !selectedType || card.dataset.type === selectedType;
    const platformMatch = !selectedPlatform || card.dataset.platform === selectedPlatform;
  
    const matches = typeMatch && platformMatch;
    card.style.display = matches ? "" : "none";
  })
};

document.addEventListener('DOMContentLoaded', () => {
  console.log("main.js: DOMContentLoaded");

  // register nav menu
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

  $navbarBurgers.forEach( el => {
    el.addEventListener('click', () => {
      const target = el.dataset.target;
      const $target = document.getElementById(target);
      el.classList.toggle('is-active');
      $target.classList.toggle('is-active');
    });
  });

  // register filter components
  const typeFilter = document.getElementById("TypeFilter");
  typeFilter.addEventListener("change", handleFilterChange);
  
  const platformFilter = document.getElementById("PlatformFilter");
  platformFilter.addEventListener("change", handleFilterChange);  
});