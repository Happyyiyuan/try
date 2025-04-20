/**
 * UI Component Library - Provides reusable UI elements
 */

document.addEventListener('DOMContentLoaded', initializeComponents);

/**
 * Initializes all UI components.
 */
function initializeComponents() {
    setupMobileNavigationComponent();
    setupThemeToggleComponent();
    setupNotificationsComponent();
    setupModalHandlersComponent();
    setupTooltipsComponent();
    setupImageLazyLoadingComponent();
}

// 响应式导航
function setupMobileNavigation() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay') || createOverlay();
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
            overlay.classList.toggle('active');
        });
        
        // 点击遮罩层关闭侧边栏
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            document.body.classList.remove('no-scroll');
            overlay.classList.remove('active');
        });
        
        // 监听窗口尺寸变化
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                document.body.classList.remove('no-scroll');
                overlay.classList.remove('active');
            }
        });
    }
}

// 创建遮罩层
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    return overlay;
}

// 主题切换
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const storedTheme = localStorage.getItem('theme');
    
    // 初始化主题
    if (storedTheme === 'dark' || (storedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-theme');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            themeToggle.innerHTML = isDark 
                ? '<i class="fas fa-sun"></i>' 
                : '<i class="fas fa-moon"></i>';
        });
    }
}

// 通知系统
function setupNotificationsComponent() {
    if (!window.UI) {
        window.UI = {};
    }
    
    // 通知容器
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // 显示通知
    window.UI.showNotification = function(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = 'info-circle';
        switch (type) {
            case 'success': icon = 'check-circle'; break;
            case 'error': icon = 'times-circle'; break;
            case 'warning': icon = 'exclamation-triangle'; break;
        }
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        notificationContainer.appendChild(notification);
        
        // 添加关闭按钮事件
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', function() {
            notification.classList.add('notification-hiding');
            setTimeout(() => {
                notificationContainer.removeChild(notification);
            }, 300);
        });
        
        // 自动关闭
        setTimeout(function() {
            if (notification.parentNode === notificationContainer) {
                notification.classList.add('notification-hiding');
                setTimeout(() => {
                    if (notification.parentNode === notificationContainer) {
                        notificationContainer.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
        
        return notification;
    };
}

// 模态框处理
function setupModalHandlersComponent() {
    if (!window.UI) {
        window.UI = {};
    }
    
    window.UI.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('modal-active');
            document.body.classList.add('no-scroll');
        }
    };
    
    window.UI.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('modal-active');
            document.body.classList.remove('no-scroll');
        }
    };
    
    // 绑定所有模态框关闭按钮
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(element => {
        element.addEventListener('click', function(e) {
            if (e.target === this) {
                const modal = this.closest('.modal');
                if (modal) {
                    window.UI.closeModal(modal.id);
                }
            }
        });
    });
    
    // ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal.modal-active');
            activeModals.forEach(modal => {
                window.UI.closeModal(modal.id);
            });
        }
    });
}

// 提示工具
function setupTooltipsComponent() {
    // 基于data-tooltip属性创建提示
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip-popup';
            tooltip.textContent = this.getAttribute('data-tooltip');
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            
            // 定位提示
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
            
            // 检查是否超出视窗
            const tooltipRect = tooltip.getBoundingClientRect();
            if (tooltipRect.left < 0) {
                tooltip.style.left = '5px';
            } else if (tooltipRect.right > window.innerWidth) {
                tooltip.style.left = window.innerWidth - tooltipRect.width - 5 + 'px';
            }
            
            if (tooltipRect.top < 0) {
                tooltip.style.top = rect.bottom + 10 + 'px';
            }
            
            tooltip.classList.add('tooltip-active');
            
            this.addEventListener('mouseleave', function() {
                tooltip.classList.remove('tooltip-active');
                setTimeout(() => {
                    if (tooltip.parentNode) {
                        document.body.removeChild(tooltip);
                    }
                }, 300);
            });
        });
    });
}

// 图片懒加载
function setupImageLazyLoadingComponent() {
    // 检查浏览器是否支持 Intersection Observer API
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        img.classList.add('fade-in');
                    }
                    
                    observer.unobserve(img);
                }
            });
        });
        
        // 观察所有带有data-src属性的图片
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // 回退方案：直接加载所有图片
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });
    }
}

// 动态添加CSS
function addCSS(cssCode) {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(cssCode));
    document.head.appendChild(style);
}

// 添加必要的CSS样式
const componentCSS = `
.overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 90;
    transition: opacity 0.3s ease;
    opacity: 0;
}

.overlay.active {
    display: block;
    opacity: 1;
}

.no-scroll {
    overflow: hidden;
}

.tooltip-popup {
    position: fixed;
    background-color: var(--text-color);
    color: var(--card-bg);
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    max-width: 200px;
    text-align: center;
}

.tooltip-popup::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px 5px 0;
    border-style: solid;
    border-color: var(--text-color) transparent transparent;
}

.tooltip-active {
    opacity: 0.9;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.fade-in {
    animation: fadeIn 0.5s ease-in;
}
`;

// 添加CSS
addCSS(componentCSS);

// 导出UI命名空间
if (!window.UI) {
    window.UI = {};
}

window.UI.initializeComponents = initializeComponents;