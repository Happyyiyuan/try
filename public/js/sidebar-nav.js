/**
 * 侧边栏导航功能
 * 统一处理侧边栏按钮的跳转和样式
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化侧边栏导航
    initSidebarNavigation();
});

/**
 * 初始化侧边栏导航
 * 为所有侧边栏按钮添加统一的事件处理和样式
 */
function initSidebarNavigation() {
    // 获取所有侧边栏按钮
    const sidebarButtons = document.querySelectorAll('.category-nav button');
    
    // 为每个按钮添加点击事件和悬停效果
    sidebarButtons.forEach(button => {
        // 移除可能存在的内联onclick属性
        if (button.hasAttribute('onclick')) {
            const url = button.getAttribute('onclick').match(/window\.location\.href='([^']+)'/);
            if (url && url[1]) {
                button.setAttribute('data-href', url[1]);
                button.removeAttribute('onclick');
            }
        }
        
        // 添加点击事件
        button.addEventListener('click', handleSidebarButtonClick);
        
        // 添加涟漪效果
        button.addEventListener('mousedown', createRippleEffect);
    });
    
    // 高亮当前页面对应的按钮
    highlightCurrentPageButton();
}

/**
 * 处理侧边栏按钮点击
 * @param {Event} event - 点击事件
 */
function handleSidebarButtonClick(event) {
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
    } else if (button.classList.contains('active')) {
        // 如果点击的是当前页面的按钮，刷新页面
        window.location.reload();
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
 * 高亮当前页面对应的按钮
 */
function highlightCurrentPageButton() {
    const currentPath = window.location.pathname;
    const sidebarButtons = document.querySelectorAll('.category-nav button');
    
    // 移除所有按钮的active类
    sidebarButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // 为当前页面对应的按钮添加active类
    sidebarButtons.forEach(button => {
        const href = button.getAttribute('data-href');
        if (href && currentPath === href) {
            button.classList.add('active');
        } else if (currentPath === '/' && button.textContent.includes('全部内容')) {
            // 首页特殊处理
            button.classList.add('active');
        }
    });
}
