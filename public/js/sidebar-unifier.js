/**
 * 侧边栏统一器
 * 确保所有页面的侧边栏样式和行为保持一致
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化侧边栏统一器
    initSidebarUnifier();
});

/**
 * 初始化侧边栏统一器
 */
function initSidebarUnifier() {
    // 获取当前页面路径
    const currentPath = window.location.pathname;
    
    // 统一侧边栏样式
    unifyStyles();
    
    // 统一侧边栏导航项
    unifyNavItems();
    
    // 统一侧边栏交互行为
    unifyBehavior();
    
    // 高亮当前页面对应的导航项
    highlightCurrentPage(currentPath);
}

/**
 * 统一侧边栏样式
 */
function unifyStyles() {
    // 确保侧边栏容器有正确的类名
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        // 添加统一的样式类
        sidebar.classList.add('unified-sidebar');
        
        // 确保logo容器样式一致
        const logoContainer = sidebar.querySelector('.logo-container');
        if (logoContainer) {
            logoContainer.style.marginBottom = '24px';
            logoContainer.style.display = 'flex';
            logoContainer.style.alignItems = 'center';
            logoContainer.style.justifyContent = 'space-between';
        }
        
        // 确保所有分类导航样式一致
        const categoryNavs = sidebar.querySelectorAll('.category-nav');
        categoryNavs.forEach(nav => {
            nav.style.marginBottom = '24px';
        });
        
        // 确保所有标题样式一致
        const sectionTitles = sidebar.querySelectorAll('.section-title');
        sectionTitles.forEach(title => {
            title.style.fontSize = '0.85rem';
            title.style.marginBottom = '16px';
            title.style.color = 'var(--text-tertiary)';
            title.style.fontWeight = 'var(--font-weight-semibold)';
            title.style.textTransform = 'uppercase';
            title.style.letterSpacing = '1px';
        });
    }
}

/**
 * 统一侧边栏导航项
 */
function unifyNavItems() {
    // 获取所有导航按钮
    const navButtons = document.querySelectorAll('.category-nav button');
    
    // 为每个按钮添加统一的样式和属性
    navButtons.forEach(button => {
        // 移除可能存在的内联样式
        button.removeAttribute('style');
        
        // 将onclick属性转换为data-href属性
        if (button.hasAttribute('onclick')) {
            const onclickAttr = button.getAttribute('onclick');
            const hrefMatch = onclickAttr.match(/window\.location\.href=['"]([^'"]+)['"]/);
            if (hrefMatch && hrefMatch[1]) {
                // 确保路径格式一致（使用绝对路径）
                let href = hrefMatch[1];
                if (href.startsWith('./') || href.startsWith('../')) {
                    // 转换相对路径为绝对路径
                    const currentPath = window.location.pathname;
                    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
                    href = new URL(href, window.location.origin + currentDir).pathname;
                } else if (!href.startsWith('/')) {
                    href = '/' + href;
                }
                
                button.setAttribute('data-href', href);
                button.removeAttribute('onclick');
            }
        }
    });
}

/**
 * 统一侧边栏交互行为
 */
function unifyBehavior() {
    // 获取所有导航按钮
    const navButtons = document.querySelectorAll('.category-nav button');
    
    // 为每个按钮添加点击事件和涟漪效果
    navButtons.forEach(button => {
        // 移除现有的事件监听器
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // 添加点击事件
        newButton.addEventListener('click', handleButtonClick);
        
        // 添加涟漪效果
        newButton.addEventListener('mousedown', createRippleEffect);
    });
    
    // 添加主题切换功能
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

/**
 * 处理按钮点击事件
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
