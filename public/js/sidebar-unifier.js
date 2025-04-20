document.addEventListener('DOMContentLoaded', () => {
  initSidebarUnifier();
});

function initSidebarUnifier() {
  const currentPath = window.location.pathname;

  unifyStyles();

  unifyNavItems();

  unifyBehavior();

  highlightCurrentPage(currentPath);
}

/**
 * 统一侧边栏样式
 */
function unifyStyles() {
    // 确保侧边栏容器有正确的类名
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  sidebar.classList.add('unified-sidebar');

  const logoContainer = sidebar.querySelector('.logo-container');
  if (logoContainer) {
    Object.assign(logoContainer.style, {
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    });
  }

  sidebar.querySelectorAll('.category-nav').forEach(nav => {
    nav.style.marginBottom = '24px';
  });

  sidebar.querySelectorAll('.section-title').forEach(title => {
    Object.assign(title.style, {
      fontSize: '0.85rem',
      marginBottom: '16px',
      color: 'var(--text-tertiary)',
      fontWeight: 'var(--font-weight-semibold)',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    });
  });
}

function unifyNavItems() {
  document.querySelectorAll('.category-nav button').forEach(button => {
    button.removeAttribute('style');
    if (!button.hasAttribute('onclick')) return;

    const onclickAttr = button.getAttribute('onclick');
    const hrefMatch = onclickAttr.match(/window\.location\.href=['"]([^'"]+)['"]/);
    if (!hrefMatch || !hrefMatch[1]) return;

    const href = new URL(hrefMatch[1], window.location.origin + window.location.pathname).pathname;

    button.setAttribute('data-href', href);
    button.removeAttribute('onclick');
  });
}

/**
 * 统一侧边栏交互行为
 */
function unifyBehavior() {
    // 获取所有导航按钮
  document.querySelectorAll('.category-nav button').forEach(button => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener('click', handleButtonClick);

    newButton.addEventListener('mousedown', createRippleEffect);
  });

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

/**
 * Handles button click events.
 * @param {Event} event - 点击事件
 */
function handleButtonClick(event) {
    const button = event.currentTarget;
    
    // 如果按钮有特殊处理（如登出按钮），则不进行页面跳转
    if (button.id === 'logout-btn') {
        // 登出功能由auth.js处理
        return;
    }
    
    // 获取按钮的目标URL
    const href = button.getAttribute('data-href');
    
    // 如果有URL，则进行页面跳转
    if (href) {
        window.location.href = href;
    }
}

/**
 * 创建涟漪效果
 * @param {Event} event - 鼠标事件
 */
function createRippleEffect(event) {
    const button = event.currentTarget;
    
    // 移除现有的涟漪效果
    const ripples = button.querySelectorAll('.ripple');
    ripples.forEach(ripple => ripple.remove());
    
    // 创建新的涟漪效果
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    button.appendChild(ripple);
    
    // 设置涟漪效果的位置
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    // 自动移除涟漪效果
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * 高亮当前页面对应的导航项
 * @param {string} currentPath - 当前页面路径
 */
function highlightCurrentPage(currentPath) {
    // 移除所有按钮的active类
    const navButtons = document.querySelectorAll('.category-nav button');
    navButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // 根据当前路径确定应该高亮的按钮
    let activeButton = null;
    
    // 简化路径比较
    const simplePath = currentPath.toLowerCase().replace(/^\/+|\/+$/g, '');
    
    navButtons.forEach(button => {
        const href = button.getAttribute('data-href');
        if (href) {
            const simpleHref = href.toLowerCase().replace(/^\/+|\/+$/g, '');
            
            // 检查路径是否匹配
            if (simplePath === simpleHref || 
                (simplePath === '' && simpleHref === 'index.html') ||
                (simplePath === 'index.html' && simpleHref === '')) {
                activeButton = button;
            }
            
            // 检查文件名是否匹配
            const currentFile = simplePath.split('/').pop();
            const hrefFile = simpleHref.split('/').pop();
            if (currentFile === hrefFile && currentFile !== '') {
                activeButton = button;
            }
        }
    });
    
    // 添加active类到对应按钮
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

/**
 * 切换主题（暗/亮模式）
 */
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    if (body.classList.contains('dark-theme')) {
        // 切换到亮模式
        body.classList.remove('dark-theme');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        // 切换到暗模式
        body.classList.add('dark-theme');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    }
}

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle?.querySelector('i');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }
}

// 初始化主题
initTheme();
