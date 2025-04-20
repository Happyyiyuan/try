/**
 * Manages sidebar navigation functionality, handling button clicks,
 * page transitions, and visual feedback (ripples, active state).
 */

document.addEventListener('DOMContentLoaded', () => {
  initSidebarNavigation();
});

/**
 * Initializes the sidebar navigation by attaching event listeners
 * to all category buttons for click handling and visual effects.
 */
function initSidebarNavigation() {
  const sidebarButtons = document.querySelectorAll('.category-nav button');

  sidebarButtons.forEach((button) => {
    // Migrate inline onclick attributes to data-href
    if (button.hasAttribute('onclick')) {
      const match = button
        .getAttribute('onclick')
        .match(/window\.location\.href='([^']+)'/);
      if (match && match[1]) {
        button.setAttribute('data-href', match[1]);
        button.removeAttribute('onclick');
      }
    }

    button.addEventListener('click', handleSidebarButtonClick);
    button.addEventListener('mousedown', createRippleEffect);
  });

  highlightCurrentPageButton();
}

/**
 * Handles clicks on sidebar buttons, navigating to the appropriate
 * page or refreshing the current one if the active button is clicked.
 * @param {MouseEvent} event - The click event.
 */
function handleSidebarButtonClick(event) {
  const button = event.currentTarget;

  // Special handling for the logout button (handled in auth.js)
  if (button.id === 'logout-btn') {
    return;
  }

  const href = button.getAttribute('data-href');

  if (href) {
    window.location.href = href;
  } else if (button.classList.contains('active')) {
    window.location.reload();
  }
}

/**
 * Creates a visual ripple effect on the clicked button.
 * @param {MouseEvent} event - The mousedown event.
 */
function createRippleEffect(event) {
  const button = event.currentTarget;

  // Remove existing ripples
  button.querySelectorAll('.ripple').forEach((ripple) => ripple.remove());

  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  button.appendChild(ripple);

  // Calculate ripple position and size
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;

  // Remove ripple after animation
  setTimeout(() => ripple.remove(), 600);
}

/**
 * Highlights the sidebar button corresponding to the current page.
 */
function highlightCurrentPageButton() {
  const currentPath = window.location.pathname;
  const sidebarButtons = document.querySelectorAll('.category-nav button');

  // Remove active class from all buttons
  sidebarButtons.forEach((button) => button.classList.remove('active'));

  // Add active class to the button matching the current path
  sidebarButtons.forEach((button) => {
    const href = button.getAttribute('data-href');
    const isHomepageButton = currentPath === '/' && button.textContent.includes('全部内容');

    if ((href && currentPath === href) || isHomepageButton) {
      button.classList.add('active');
    }
  });
}
