import { describe, it, expect, beforeEach, vi } from 'vitest';
import { openModal, closeModal, getDataFromCard, populateModal, handleFilterChange } from '../../src/js/utils.js';

describe('Modal Utils', () => {
  beforeEach(() => {
    // Set up basic modal HTML structure
    document.body.innerHTML = `
      <div class="modal">
        <div class="modal-background"></div>
        <div class="modal-content">
          <div id="modal-overlay">
            <button class="button">YouTube</button>
            <button class="button">Demozoo</button>
            <button class="button">CSDB</button>
            <button class="button">Pouet</button>
            <button class="button">Download</button>
          </div>
          <figure class="image">
            <iframe id="modal-video" src=""></iframe>
          </figure>
          <figure class="image">
            <img id="modal-image" src="" alt="">
          </figure>
          <div id="modal-description"></div>
          <div id="modal-credits"></div>
        </div>
      </div>
    `;
    
    // Reset scroll position
    window.scrollY = 0;
  });

  describe('openModal', () => {
    it('should activate modal and prevent body scroll', () => {
      window.scrollY = 100;
      
      openModal();
      
      const modal = document.querySelector('.modal');
      expect(modal).toHaveClass('is-active');
      expect(document.body).toHaveClass('modal-open');
      expect(document.body.style.top).toBe('-100px');
    });
  });

  describe('closeModal', () => {
    it('should deactivate modal and restore scroll', () => {
      const modal = document.querySelector('.modal');
      const iframe = document.querySelector('#modal-video');
      
      // Set up modal as active
      modal.classList.add('is-active');
      document.body.classList.add('modal-open');
      iframe.src = 'https://example.com/video';
      window.location.hash = '#test';
      
      closeModal();
      
      expect(modal).not.toHaveClass('is-active');
      expect(document.body).not.toHaveClass('modal-open');
      expect(iframe.src).toBe('');
      expect(window.location.hash).toBe('');
    });
  });

  describe('getDataFromCard', () => {
    it('should extract all data attributes from card element', () => {
      const cardHTML = `
        <div class="card" 
          data-slug="test-production"
          data-description="Test description"
          data-youtube="https://youtube.com/test"
          data-download="https://download.com/test"
          data-credits='[{"name":"Test User","contribution":"Code"}]'>
          <div class="card-content">
            <div class="title">Test Title</div>
            <div class="subtitle">Test Subtitle</div>
          </div>
          <div class="card-image">
            <img src="/test-image.jpg" alt="test">
          </div>
        </div>
      `;
      
      document.body.innerHTML = cardHTML;
      const card = document.querySelector('.card');
      
      const data = getDataFromCard(card);
      
      expect(data.title).toBe('Test Title');
      expect(data.subtitle).toBe('Test Subtitle');
      expect(data.slug).toBe('test-production');
      expect(data.description).toBe('Test description');
      expect(data.youtube).toBe('https://youtube.com/test');
      expect(data.download).toBe('https://download.com/test');
      expect(data.credits).toEqual([{"name":"Test User","contribution":"Code"}]);
      expect(data.card_image).toBe('/test-image.jpg');
    });
  });

  describe('populateModal', () => {
    it('should display YouTube video when available', () => {
      const data = {
        title: 'Test Title',
        youtube: 'https://youtube.com/embed/test',
        image: '/test-image.jpg'
      };
      
      populateModal(data);
      
      const modalVideo = document.getElementById('modal-video');
      const figureVideo = modalVideo.closest('figure');
      const modalImage = document.getElementById('modal-image');
      const figureImage = modalImage.closest('figure');
      
      expect(modalVideo.src).toBe('https://youtube.com/embed/test');
      expect(figureVideo.style.display).toBe('block');
      expect(figureImage.style.display).toBe('none');
    });

    it('should display image when no YouTube video available', () => {
      const data = {
        title: 'Test Title',
        image: '/test-image.jpg'
      };
      
      populateModal(data);
      
      const modalVideo = document.getElementById('modal-video');
      const figureVideo = modalVideo.closest('figure');
      const modalImage = document.getElementById('modal-image');
      const figureImage = modalImage.closest('figure');
      
      expect(modalImage.src).toBe('/test-image.jpg');
      expect(figureImage.style.display).toBe('block');
      expect(figureVideo.style.display).toBe('none');
    });

    it('should configure action buttons based on available data', () => {
      const data = {
        youtube: 'https://youtube.com/test',
        demozoo: 'https://demozoo.org/test',
        download: 'https://download.com/test'
      };
      
      populateModal(data);
      
      const buttons = document.querySelectorAll('#modal-overlay .button');
      const youtubeBtn = Array.from(buttons).find(btn => btn.innerText.toLowerCase() === 'youtube');
      const demozooBtn = Array.from(buttons).find(btn => btn.innerText.toLowerCase() === 'demozoo');
      const csdbBtn = Array.from(buttons).find(btn => btn.innerText.toLowerCase() === 'csdb');
      
      expect(youtubeBtn.style.display).toBe('flex');
      expect(demozooBtn.style.display).toBe('flex');
      expect(csdbBtn.style.display).toBe('none');
    });
  });
});

describe('Filter Utils', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="TypeFilter">
        <option value="">All Types</option>
        <option value="demo">Demo</option>
        <option value="intro">Intro</option>
      </select>
      <select id="PlatformFilter">
        <option value="">All Platforms</option>
        <option value="amiga">Amiga</option>
        <option value="c64">C64</option>
      </select>
      <div id="feed-wrapper">
        <div class="column" data-type="demo" data-platform="amiga">Demo 1</div>
        <div class="column" data-type="intro" data-platform="c64">Intro 1</div>
        <div class="column" data-type="demo" data-platform="c64">Demo 2</div>
      </div>
    `;
  });

  describe('handleFilterChange', () => {
    it('should show only matching cards when type filter is selected', () => {
      const typeFilter = document.getElementById('TypeFilter');
      typeFilter.value = 'demo';
      
      const event = new Event('change');
      handleFilterChange(event);
      
      const cards = document.querySelectorAll('#feed-wrapper .column');
      expect(cards[0].style.display).toBe(''); // demo + amiga
      expect(cards[1].style.display).toBe('none'); // intro + c64
      expect(cards[2].style.display).toBe(''); // demo + c64
    });

    it('should show only matching cards when platform filter is selected', () => {
      const platformFilter = document.getElementById('PlatformFilter');
      platformFilter.value = 'c64';
      
      const event = new Event('change');
      handleFilterChange(event);
      
      const cards = document.querySelectorAll('#feed-wrapper .column');
      expect(cards[0].style.display).toBe('none'); // demo + amiga
      expect(cards[1].style.display).toBe(''); // intro + c64
      expect(cards[2].style.display).toBe(''); // demo + c64
    });

    it('should show only cards matching both filters', () => {
      const typeFilter = document.getElementById('TypeFilter');
      const platformFilter = document.getElementById('PlatformFilter');
      typeFilter.value = 'demo';
      platformFilter.value = 'c64';
      
      const event = new Event('change');
      handleFilterChange(event);
      
      const cards = document.querySelectorAll('#feed-wrapper .column');
      expect(cards[0].style.display).toBe('none'); // demo + amiga
      expect(cards[1].style.display).toBe('none'); // intro + c64
      expect(cards[2].style.display).toBe(''); // demo + c64
    });

    it('should show all cards when filters are cleared', () => {
      const typeFilter = document.getElementById('TypeFilter');
      const platformFilter = document.getElementById('PlatformFilter');
      typeFilter.value = '';
      platformFilter.value = '';
      
      const event = new Event('change');
      handleFilterChange(event);
      
      const cards = document.querySelectorAll('#feed-wrapper .column');
      cards.forEach(card => {
        expect(card.style.display).toBe('');
      });
    });
  });
});
