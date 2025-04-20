/**
 * Global Configuration
 * Contains API endpoints, WebSocket URLs, and other important settings.
 * Modify this file when deploying to different environments.
 */

const CONFIG = {
  // API base URL (using a relative path for local data)
  apiBaseUrl: '../data',

  // WebSocket URL (uses a custom format in websocket-client.js, this is for other scripts)
  wsUrl: location.protocol === 'https:'
      ? `wss://${location.host}/ws/`
      : `ws://${location.host}/ws/`,

  // File upload settings
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 10,
    postsPerPage: 9,
  },

  // Product categories
  categories: {
    phone: '手机科技',
    computer: '电脑配件',
    digital: '数码产品',
    ai: 'AI技术',
    ml: '机器学习',
    'deep-learning': '深度学习',
  },

  // Site information
  site: {
    name: 'AI科技库',
    description: '探索最新的人工智能、区块链、物联网和大数据技术，了解前沿科技发展动态',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/2103/2103652.png',
    copyright: `© ${new Date().getFullYear()} AI科技库`,
  },

  // Contact details
  contact: {
    email: 'contact@example.com',
    phone: '+86 123 4567 8901',
    address: '北京市朝阳区科技园区888号',
    social: {
      weibo: 'https://weibo.com/',
      wechat: 'ai_tech_lib',
      github: 'https://github.com/',
    },
  },

  // Development mode flag
  isDev: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
};

Object.freeze(CONFIG);

// Expose the configuration globally
window.CONFIG = CONFIG;

// Output environment information (in development mode only)
if (CONFIG.isDev) {
  console.info(`Running in DEVELOPMENT mode`);
  console.info('API URL:', CONFIG.apiBaseUrl);
  console.info('WebSocket URL:', CONFIG.wsUrl);
}

// Helper function to access nested configuration values
window.getConfig = (path, defaultValue = null) => {
  try {
    return path.split('.').reduce((obj, key) => obj?.[key], CONFIG) ?? defaultValue;
  } catch (error) {
    console.error('Error getting configuration:', error);
    return defaultValue;
  }
};

// Set up site title, logo, and footer on page load
document.addEventListener('DOMContentLoaded', () => {
  // Set page title if not already set
  if (!document.title) {
    document.title = CONFIG.site.name;
  }

  // Set site logo (favicon) if not already present
  if (!document.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = CONFIG.site.logoUrl;
    favicon.type = 'image/png';
    document.head.appendChild(favicon);
  }

  // Add copyright to footer if present
  const footer = document.querySelector('footer');
  if (footer) {
    footer.insertAdjacentHTML('beforeend', `<div class="copyright">${CONFIG.site.copyright}</div>`);
    }
});