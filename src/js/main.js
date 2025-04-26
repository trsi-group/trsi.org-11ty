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

function populateModal(data) {
  const modalVideo = document.getElementById('modal-video');
  const figureVideo = modalVideo.closest('figure.image');
  const modalImage = document.getElementById('modal-image');
  const figureImage = modalImage.closest('figure.image');
  if (data.youtube) {
    modalVideo.src = data.youtube;
    figureVideo.style.display = 'block';
    figureImage.style.display = 'none';
  } else {
    modalImage.src = data.image;
    figureImage.style.display = 'block';
    figureVideo.style.display = 'none';
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
    } else if (text === 'download' && data.download) {
      button.style.display = 'flex';
      button.onclick = () => window.open(data.download, '_blank');
    } else {
      button.parentElement.style.display = 'none';
      button.style.display = 'none';
    }
  });

  const description = document.getElementById('modal-description');
  if (data.description) {
    description.innerText = formatCredits(data.credits);
  }

  const nfoText = document.getElementById('modal-nfo_text');
  if (data.credits) {
    nfoText.innerText = formatCredits(data.credits);
  } else {
    nfoText.innerText = 'No additional info available.';
  }
}

function formatCredits(creditsArray) {
  // Group contributors by contribution type
  const grouped = {};

  creditsArray.forEach(person => {
    const role = person.contribution;
    if (!grouped[role]) {
      grouped[role] = [];
    }
    grouped[role].push(person.name);
  });

  // Build the formatted string
  let formatted = '';
  for (const role in grouped) {
    formatted += `${role}: ${grouped[role].join(', ')}\n`;
  }

  return formatted.trim();  // Remove trailing newline
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
        credits: cardElement.dataset.credits ? JSON.parse(cardElement.dataset.credits) : [],
        card_image: cardElement.querySelector('.card-image img').src,
        image: cardElement.dataset.image || null,
        title: cardElement.querySelector('.card-content .title')?.innerText,
        subtitle: cardElement.querySelector('.card-content .subtitle')?.innerText
      };
      populateModal(cardData);
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