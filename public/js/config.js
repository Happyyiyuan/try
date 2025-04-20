/**
 * 全局配置文件
 * 包含API地址、WebSocket URL和其他重要配置
 * 在部署到不同环境时，只需修改这个文件
 */

// 全局配置对象
window.CONFIG = {
    // API 基础URL - 使用本地路径
    API_BASE_URL: '../data', // 使用相对路径指向本地数据文件夹
    
    // WebSocket URL - 使用本地WebSocket或禁用
    // 注意：websocket-client.js使用自己的URL格式，这里的配置仅供其他脚本使用
    WS_URL: location.protocol === 'https:' 
        ? `wss://${location.host}/ws/` 
        : `ws://${location.host}/ws/`,
    
    // 上传文件配置
    UPLOAD: {
        MAX_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
    
    // 分页配置
    PAGINATION: {
        DEFAULT_LIMIT: 10,
        POSTS_PER_PAGE: 9,
    },
    
    // 产品类别
    CATEGORIES: {
        'phone': '手机科技',
        'computer': '电脑配件',
        'digital': '数码产品',
        'ai': 'AI技术',
        'ml': '机器学习',
        'deep-learning': '深度学习'
    },
    
    // 网站信息
    SITE: {
        NAME: 'AI科技库',
        DESCRIPTION: '探索最新的人工智能、区块链、物联网和大数据技术，了解前沿科技发展动态',
        LOGO_URL: 'https://cdn-icons-png.flaticon.com/512/2103/2103652.png',
        COPYRIGHT: `© ${new Date().getFullYear()} AI科技库`
    },
    
    // 联系信息
    CONTACT: {
        EMAIL: 'contact@example.com',
        PHONE: '+86 123 4567 8901',
        ADDRESS: '北京市朝阳区科技园区888号',
        SOCIAL: {
            WEIBO: 'https://weibo.com/',
            WECHAT: 'ai_tech_lib',
            GITHUB: 'https://github.com/'
        }
    },
    
    // 开发模式标志
    isDev: location.hostname === 'localhost' || location.hostname === '127.0.0.1'
};

// 输出运行环境信息（仅在开发模式下）
if (window.CONFIG.isDev) {
    console.log(`Running in ${window.CONFIG.isDev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
    console.log('API URL:', window.CONFIG.API_BASE_URL);
    console.log('WebSocket URL:', window.CONFIG.WS_URL);
}

// 获取配置的便捷方法
window.getConfig = function(path, defaultValue = null) {
    try {
        const keys = path.split('.');
        let result = window.CONFIG;
        
        for (const key of keys) {
            if (result === undefined || result === null) return defaultValue;
            result = result[key];
        }
        
        return result !== undefined ? result : defaultValue;
    } catch (error) {
        console.error('获取配置错误:', error);
        return defaultValue;
    }
};

// 在页面加载时设置网站标题和Logo
document.addEventListener('DOMContentLoaded', function() {
    // 设置页面标题
    if (!document.title || document.title === '') {
        document.title = window.CONFIG.SITE.NAME;
    }
    
    // 设置网站Logo
    const favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = window.CONFIG.SITE.LOGO_URL;
        newFavicon.type = 'image/png';
        document.head.appendChild(newFavicon);
    }
    
    // 添加版权信息到页脚
    const footers = document.getElementsByTagName('footer');
    if (footers.length > 0) {
        const copyright = document.createElement('div');
        copyright.className = 'copyright';
        copyright.textContent = window.CONFIG.SITE.COPYRIGHT;
        footers[0].appendChild(copyright);
    }
});

// 导出配置
console.log('全局配置已加载');