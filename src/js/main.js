// filters for content feeds
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

function populateProductionsModal(data) {
  const modalVideo = document.getElementById('modal-video');
  if (data.youtube) {
    modalVideo.src = data.youtube;
  } else {
    modalVideo.src = '';  // Clear if no video
  }

  const buttons = document.querySelectorAll('#modal-overlay .button');

  buttons.forEach(button => {
    const text = button.innerText.toLowerCase();

    if (text === 'youtube' && data.youtube) {
      button.style.display = 'flex';
      button.onclick = () => window.open(data.youtube, '_blank');
    } else if (text === 'demozoo' && data.demozoo) {
      button.style.display = 'flex';
      button.onclick = () => window.open(data.demozoo, '_blank');
    } else if (text === 'pouet' && data.pouet) {
      button.style.display = 'flex';
      button.onclick = () => window.open(data.pouet, '_blank');
    } else {
      button.style.display = 'none';
    }
  });

  // 3️⃣ Update NFO Text (optional)
  const nfoText = document.getElementById('nfo_text');
  if (data.nfo) {
    nfoText.innerText = data.nfo;
  } else {
    nfoText.innerText = 'No additional info available.';
  }
}

// navbar menu
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
  ["TypeFilter", "PlatformFilter"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", handleFilterChange);
    }
  });
});

// modal dialogs
document.addEventListener('DOMContentLoaded', () => {
  // Functions to open and close a modal
  function openModal($el) {
    $el.classList.add('is-active');
  }

  function closeModal($el) {
    $el.classList.remove('is-active');
  }

  function closeAllModals() {
    (document.querySelectorAll('.modal') || []).forEach(($modal) => {
      closeModal($modal);
    });
  }

  // Add a click event on buttons to open a specific modal
  (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
    const modal = $trigger.dataset.target;
    const $target = document.getElementById(modal);

    $trigger.addEventListener('click', (event) => {
      const clickedButton = event.currentTarget;
      const cardElement = clickedButton.closest('.card');

      const cardData = {
        download: cardElement.dataset.download || null,
        youtube: cardElement.dataset.youtube || null,
        demozoo: cardElement.dataset.demozoo || null,
        pouet: cardElement.dataset.pouet || null,
        image: cardElement.querySelector('.card-image img').src,
        title: cardElement.querySelector('.card-content .title')?.innerText,
        subtitle: cardElement.querySelector('.card-content .subtitle')?.innerText
      };

      // 4️⃣ Inject data and open modal
      populateProductionsModal(cardData);
      openModal($target);
    });
  });

  // Add a click event on various child elements to close the parent modal
  (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
    const $target = $close.closest('.modal');

    $close.addEventListener('click', () => {
      closeModal($target);
    });
  });

  // Add a keyboard event to close all modals
  document.addEventListener('keydown', (event) => {
    if(event.key === "Escape") {
      closeAllModals();
    }
  });
});