document.addEventListener('DOMContentLoaded', initializeSidebar);

/**
 * Initializes the sidebar functionality by setting up navigation items
 * and applying styling and event listeners to the buttons.
 */
function initializeSidebar() {
  adjustNavigationItems(window.location.pathname);
  setupSidebarButtons();
}

/**
 * Adjusts the visibility of sidebar navigation items based on the current page.
 * @param {string} currentPath - The current URL path.
 */
function adjustNavigationItems(currentPath) {
  const navItems = document.querySelectorAll('.category-nav button');
  const pageConfig = {
    '/': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml', 'nav-deep-learning'],
    '/index.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml', 'nav-deep-learning'],
    '/html/phone.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml'],
    '/html/computer.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml'],
    '/html/digital.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml'],
    '/html/ai.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml', 'nav-deep-learning'],
    '/html/ml.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml', 'nav-deep-learning'],
    '/html/deep-learning.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml', 'nav-deep-learning'],
  };
  const currentConfig = pageConfig[currentPath] || pageConfig['/'];

  navItems.forEach((item) => {
    const text = item.textContent.trim();
    switch (true) {
      case text.includes('全部内容'):
        item.id = 'nav-all';
        break;
      case text.includes('手机科技'):
        item.id = 'nav-phone';
        break;
      case text.includes('电脑配件'):
        item.id = 'nav-computer';
        break;
      case text.includes('数码产品'):
        item.id = 'nav-digital';
        break;
      case text.includes('AI技术'):
        item.id = 'nav-ai';
        break;
      case text.includes('机器学习'):
        item.id = 'nav-ml';
        break;
      case text.includes('深度学习'):
        item.id = 'nav-deep-learning';
        break;
    }
    item.style.display = item.id && currentConfig.includes(item.id) ? 'flex' : 'none';
  });

  highlightCurrentNavigation(currentPath);
}

/**
 * Highlights the navigation item corresponding to the current page.
 * @param {string} currentPath - The current URL path.
 */
function highlightCurrentNavigation(currentPath) {
  const navButtons = document.querySelectorAll('.category-nav button');
  navButtons.forEach((button) => button.classList.remove('active'));

  let activeButtonSelector = '';
  switch (true) {
    case currentPath === '/' || currentPath === '/index.html':
      activeButtonSelector = '#nav-all';
      break;
    case currentPath.includes('/phone.html'):
      activeButtonSelector = '#nav-phone';
      break;
    case currentPath.includes('/computer.html'):
      activeButtonSelector = '#nav-computer';
      break;
    case currentPath.includes('/digital.html'):
      activeButtonSelector = '#nav-digital';
      break;
    case currentPath.includes('/ai.html'):
      activeButtonSelector = '#nav-ai';
      break;
    case currentPath.includes('/ml.html'):
      activeButtonSelector = '#nav-ml';
      break;
    case currentPath.includes('/deep-learning.html'):
      activeButtonSelector = '#nav-deep-learning';
      break;
  }

  if (activeButtonSelector) {
    const activeButton = document.querySelector(activeButtonSelector);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }
}

/**
 * Sets up the styles and event listeners for the sidebar buttons.
 */
function setupSidebarButtons() {
  const sidebarButtons = document.querySelectorAll('.category-nav button');

  sidebarButtons.forEach((button) => {
    if (button.hasAttribute('onclick')) {
      const onclickAttr = button.getAttribute('onclick');
      const hrefMatch = onclickAttr.match(/window\.location\.href=['"]([^'"]+)['"]/);
      if (hrefMatch && hrefMatch[1]) {
        button.setAttribute('data-href', hrefMatch[1]);
        button.removeAttribute('onclick');
      }
    }
    button.addEventListener('click', handleButtonClick);
    button.addEventListener('mousedown', createRippleEffect);
  });
}

/**
 * Handles a button click event, navigating to a new page if a data-href attribute is present.
 * @param {Event} event - The click event.
 */
function handleButtonClick(event) {
  const button = event.currentTarget;
  const href = button.getAttribute('data-href');
  if (href) {
    window.location.href = href;
  }
}

/**
 * Creates a ripple effect on a button when it is clicked.
 * @param {Event} event - The mousedown event.
 */
function createRippleEffect(event) {
  const button = event.currentTarget;
  button.querySelectorAll('.ripple').forEach((ripple) => ripple.remove());

  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  button.appendChild(ripple);

  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;

  setTimeout(() => ripple.remove(), 600);
}
