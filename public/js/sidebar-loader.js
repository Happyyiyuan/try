/**
 * 侧边栏加载器
 * 根据不同页面动态调整侧边栏导航项
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化侧边栏加载器
    initSidebarLoader();
});

/**
 * 初始化侧边栏加载器
 */
function initSidebarLoader() {
    // 获取当前页面路径
    const currentPath = window.location.pathname;
    
    // 根据当前页面调整侧边栏导航项
    adjustSidebarItems(currentPath);
    
    // 统一处理侧边栏按钮样式和事件
    setupSidebarButtons();
}

/**
 * 根据当前页面调整侧边栏导航项
 * @param {string} currentPath - 当前页面路径
 */
function adjustSidebarItems(currentPath) {
    // 获取所有导航项
    const navItems = document.querySelectorAll('.category-nav button');
    
    // 定义页面特定的导航项配置
    const pageConfig = {
        // 页面路径: 应该显示的导航项ID数组
        '/': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml', 'nav-deep-learning'],
        '/index.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml', 'nav-deep-learning'],
        '/html/phone.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml'],
        '/html/computer.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml'],
        '/html/digital.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml'],
        '/html/ai.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml', 'nav-deep-learning'],
        '/html/ml.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml', 'nav-deep-learning'],
        '/html/deep-learning.html': ['nav-all', 'nav-phone', 'nav-computer', 'nav-digital', 'nav-ai', 'nav-ml', 'nav-deep-learning']
    };
    
    // 获取当前页面的配置，如果没有特定配置则使用默认配置
    const currentConfig = pageConfig[currentPath] || pageConfig['/'];
    
    // 为每个导航项添加ID
    navItems.forEach((item, index) => {
        // 根据按钮文本内容设置ID
        const text = item.textContent.trim();
        if (text.includes('全部内容')) item.id = 'nav-all';
        else if (text.includes('手机科技')) item.id = 'nav-phone';
        else if (text.includes('电脑配件')) item.id = 'nav-computer';
        else if (text.includes('数码产品')) item.id = 'nav-digital';
        else if (text.includes('AI技术')) item.id = 'nav-ai';
        else if (text.includes('机器学习')) item.id = 'nav-ml';
        else if (text.includes('深度学习')) item.id = 'nav-deep-learning';
    });
    
    // 根据配置显示或隐藏导航项
    navItems.forEach(item => {
        if (item.id && currentConfig.includes(item.id)) {
            item.style.display = 'flex';
        } else if (item.id && !currentConfig.includes(item.id)) {
            item.style.display = 'none';
        }
    });
    
    // 高亮当前页面对应的导航项
    highlightCurrentPageNav(currentPath);
}

/**
 * 高亮当前页面对应的导航项
 * @param {string} currentPath - 当前页面路径
 */
function highlightCurrentPageNav(currentPath) {
    // 移除所有按钮的active类
    const navButtons = document.querySelectorAll('.category-nav button');
    navButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // 根据当前路径确定应该高亮的按钮
    let activeButtonSelector = '';
    
    if (currentPath === '/' || currentPath === '/index.html') {
        activeButtonSelector = '#nav-all';
    } else if (currentPath.includes('/phone.html')) {
        activeButtonSelector = '#nav-phone';
    } else if (currentPath.includes('/computer.html')) {
        activeButtonSelector = '#nav-computer';
    } else if (currentPath.includes('/digital.html')) {
        activeButtonSelector = '#nav-digital';
    } else if (currentPath.includes('/ai.html')) {
        activeButtonSelector = '#nav-ai';
    } else if (currentPath.includes('/ml.html')) {
        activeButtonSelector = '#nav-ml';
    } else if (currentPath.includes('/deep-learning.html')) {
        activeButtonSelector = '#nav-deep-learning';
    }
    
    // 添加active类到对应按钮
    if (activeButtonSelector) {
        const activeButton = document.querySelector(activeButtonSelector);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
}

/**
 * 设置侧边栏按钮样式和事件
 */
function setupSidebarButtons() {
    // 获取所有侧边栏按钮
    const sidebarButtons = document.querySelectorAll('.category-nav button');
    
    // 为每个按钮添加点击事件和悬停效果
    sidebarButtons.forEach(button => {
        // 如果按钮有内联onclick属性，将其转换为data-href属性
        if (button.hasAttribute('onclick')) {
            const onclickAttr = button.getAttribute('onclick');
            const hrefMatch = onclickAttr.match(/window\.location\.href=['"]([^'"]+)['"]/);
            if (hrefMatch && hrefMatch[1]) {
                button.setAttribute('data-href', hrefMatch[1]);
                button.removeAttribute('onclick');
            }
        }
        
        // 添加点击事件
        button.addEventListener('click', handleButtonClick);
        
        // 添加涟漪效果
        button.addEventListener('mousedown', createRippleEffect);
    });
}

/**
 * 处理按钮点击事件
 * @param {Event} event - 点击事件
 */
function handleButtonClick(event) {
    const button = event.currentTarget;
    
    // 如果按钮有data-href属性，则进行页面跳转
    const href = button.getAttribute('data-href');
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
