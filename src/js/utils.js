/**
 * Utility functions to manage Bulma modals.
 *
 * - openModal($el): Activates a specific modal by adding the 'is-active' class.
 * - closeModal($el): Deactivates a specific modal by removing the 'is-active' class.
 * - closeAllModals(): Closes all modals on the page by removing 'is-active' from each.
 *
 * @param {Element} $el - The modal DOM element to open or close.
 */
export function openModal($el) {
  $el.classList.add('is-active');
  document.body.classList.add('modal-open');
}

export function closeModal($el) {
  $el.classList.remove('is-active');
  // Stop YouTube video if present
  const iframe = $el.querySelector('iframe');
  if (iframe) {
    iframe.src = '';
  }
  document.body.classList.remove('modal-open');
}

export function closeAllModals() {
  (document.querySelectorAll('.modal') || []).forEach(($modal) => {
    closeModal($modal);
  });
}

/**
 * Populates the modal with dynamic content based on provided data.
 *
 * This function:
 * - Displays either a YouTube video (`iframe`) or an image in the modal, depending on availability.
 * - Dynamically configures action buttons (YouTube, Demozoo, Pouet, Download) based on provided URLs.
 * - Injects description text and formatted credits if available.
 * - Hides elements gracefully when corresponding data is missing.
 *
 * @param {Object} data - The content data to populate the modal.
 * @param {string} [data.youtube]     - YouTube video URL (if present, video is shown).
 * @param {string} [data.image]       - Image URL fallback if no video is available.
 * @param {string} [data.description] - Description text to display.
 * @param {Array}  [data.credits]     - List of credit entries, formatted via `formatCredits()`.
 * @param {string} [data.demozoo]     - Demozoo URL for button link.
 * @param {string} [data.csdb]        - CSDB URL for button link.
 * @param {string} [data.pouet]       - Pouet URL for button link.
 * @param {string} [data.download]    - Download URL for button link.
 *
 * Note:
 * - Buttons are hidden if their corresponding data is not provided.
 * - Assumes presence of modal elements with IDs:
 *   - #modal-video, #modal-image, #modal-description, #modal-credits, and buttons inside #modal-overlay.
 */
export function populateModal(data) {
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
    } else if (text === 'csdb' && data.csdb) {
      button.style.display = 'flex';
      button.onclick = () => window.open(data.csdb, '_blank');
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
    description.innerText = data.description;
  } else {
    description.style.display = 'none';
  }

  const credits = document.getElementById('modal-credits');
  if (data.credits) {
    credits.innerText = formatCredits(data.credits);
  } else {
    credits.style.display = 'none';
  }
}

/**
 * Formats an array of credit entries into a readable string grouped by contribution type.
 *
 * This function:
 * - Groups contributors by their `contribution` role.
 * - Outputs a string where each line lists a role followed by contributor names.
 * - Example output:
 *     Code: Alice, Bob
 *     Music: Charlie
 *
 * @param {Array<Object>} creditsArray - Array of credit objects.
 * @param {string} creditsArray[].name - Contributor's name.
 * @param {string} creditsArray[].contribution - Type of contribution (e.g., "Code", "Music").
 *
 * @returns {string} A formatted string grouping contributors by role.
 *
 * Note:
 * - Removes any trailing newline at the end of the string.
 */
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

/**
 * Handles filtering of cards based on selected type and platform filters.
 *
 * This function listens to changes in the filter dropdowns (#TypeFilter and #PlatformFilter)
 * and dynamically shows or hides cards within the #feed-wrapper based on matching 
 * data attributes (`data-type` and `data-platform`).
 *
 * @param {Event} event - The change event triggered by the filter dropdowns.
 *
 * Behavior:
 * - If no filter is selected, all cards are shown.
 * - If one or both filters are selected, only cards matching the selected criteria are displayed.
 * - Cards that don't match the filter criteria are hidden via `display: none`.
 */
export function handleFilterChange(event) {
  const cards = document.querySelectorAll("#feed-wrapper .column");
  const typeFilter = document.getElementById("TypeFilter");
  const platformFilter = document.getElementById("PlatformFilter");

  const selectedType = typeFilter.value;
  const selectedPlatform = platformFilter.value;
  
  cards.forEach(card => {
    const typeMatch = !selectedType || card.dataset.type === selectedType;
    const platformMatch = !selectedPlatform || card.dataset.platform === selectedPlatform;
    const matches = typeMatch && platformMatch;
    card.style.display = matches ? '' : 'none';
  })
};
