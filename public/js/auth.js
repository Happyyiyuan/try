/**
 * 认证模块 - Authentication Module
 * 提供用户登录、注册、退出等认证功能
 * 依赖: config.js, api-client.js, ui-components.js
 */

// 确保必要的依赖已加载
document.addEventListener('DOMContentLoaded', () => {
    // 验证全局配置是否可用
    if (!window.CONFIG) {
        console.error('错误: 全局配置未加载，auth.js需要config.js先加载');
    }
    
    // 验证API客户端是否可用
    if (!window.API) {
        console.error('错误: API客户端未加载，auth.js需要api-client.js先加载');
    }
    
    // 验证UI组件是否可用
    if (!window.UI) {
        console.warn('警告: UI组件未加载，通知功能可能无法正常工作');
    }
});

// 认证相关函数
async function login(username, password) {
    try {
        // 显示加载状态
        const loginButton = document.querySelector('button[type="submit"]');
        let originalButtonText = '';
        
        if (loginButton) {
            originalButtonText = loginButton.innerHTML;
            loginButton.disabled = true;
            loginButton.innerHTML = '<div class="spinner"></div><span class="btn-text">' + originalButtonText + '</span>';
            loginButton.classList.add('btn-loading');
        }
        
        try {
            // 使用API客户端发送请求
            const data = await window.API.request('/auth/login', {
                method: 'POST',
                data: { username, password },
                showLoading: false, // 我们已经自己显示了按钮加载状态
                showError: true
            });
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // 显示成功消息
            if (window.UI && window.UI.showNotification) {
                window.UI.showNotification('登录成功', 'success');
            }
            
            return data;
        } finally {
            // 无论成功或失败，都恢复按钮状态
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.innerHTML = originalButtonText;
                loginButton.classList.remove('btn-loading');
            }
        }
    } catch (error) {
        console.error('登录错误:', error);
        throw error;
    }
}

async function register(username, email, password) {
    try {
        // 显示加载状态
        const registerButton = document.querySelector('button[type="submit"]');
        let originalButtonText = '';
        
        if (registerButton) {
            originalButtonText = registerButton.innerHTML;
            registerButton.disabled = true;
            registerButton.innerHTML = '<div class="spinner"></div><span class="btn-text">' + originalButtonText + '</span>';
            registerButton.classList.add('btn-loading');
        }
        
        try {
            // 使用API客户端发送请求
            const data = await window.API.request('/auth/register', {
                method: 'POST',
                data: { username, email, password },
                showLoading: false, // 我们已经自己显示了按钮加载状态
                showError: true
            });
            
            // 显示成功消息
            if (window.UI && window.UI.showNotification) {
                window.UI.showNotification('注册成功', 'success');
            }
            
            return data;
        } finally {
            // 无论成功或失败，都恢复按钮状态
            if (registerButton) {
                registerButton.disabled = false;
                registerButton.innerHTML = originalButtonText;
                registerButton.classList.remove('btn-loading');
            }
        }
    } catch (error) {
        console.error('注册错误:', error);
        throw error;
    }
}

function logout() {
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 显示成功消息
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification('已成功退出登录', 'info');
        }
        
        // 延迟跳转，让用户看到通知
        setTimeout(() => {
            window.location.href = '/html/login.html';
        }, 1000);
    } catch (error) {
        console.error('登出错误:', error);
        // 即使出错也尝试跳转
        window.location.href = '/html/login.html';
    }
}

function isAuthenticated() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        // 检查token是否为有效字符串
        if (typeof token !== 'string' || token.trim() === '') {
            localStorage.removeItem('token');
            return false;
        }
        
        // 可以在这里添加更多验证，如检查token格式或过期时间
        // 目前只做基本检查，后续可扩展
        
        return true;
    } catch (error) {
        console.error('身份验证检查错误:', error);
        return false;
    }
}

function getToken() {
    try {
        const token = localStorage.getItem('token');
        
        // 检查token是否存在并有效
        if (!token || typeof token !== 'string' || token.trim() === '') {
            return null;
        }
        
        return token;
    } catch (error) {
        console.error('获取令牌错误:', error);
        return null;
    }
}

function getCurrentUser() {
    try {
        const user = localStorage.getItem('user');
        if (!user) return null;
        
        // 安全地解析用户数据
        const userData = JSON.parse(user);
        
        // 检查解析出的对象是否有效
        if (!userData || typeof userData !== 'object') {
            console.warn('存储的用户数据格式无效');
            return null;
        }
        
        return userData;
    } catch (error) {
        console.error('获取当前用户数据错误:', error);
        // 数据损坏情况下，清除存储并返回null
        localStorage.removeItem('user');
        return null;
    }
}

// 导出认证函数
window.auth = {
    login,
    register,
    logout,
    isAuthenticated,
    getToken,
    getCurrentUser
};