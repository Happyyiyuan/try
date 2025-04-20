/**
 * Authentication Module
 * Provides user login, registration, and logout functionalities.
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

    window.auth = {
        login,
        register,
        logout,
        isAuthenticated,
        getToken,
        getCurrentUser,
    };

    async function login(username, password) {
        return await handleAuthRequest(
            '/auth/login',
            { username, password },
            '登录成功'
        );
    }

    async function register(username, email, password) {
        return await handleAuthRequest(
            '/auth/register',
            { username, email, password },
            '注册成功'
        );
    }

    async function handleAuthRequest(endpoint, data, successMessage) {
        const submitButton = document.querySelector('button[type="submit"]');
        const originalButtonText = submitButton?.innerHTML || '';

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML =
                    '<div class="spinner"></div><span class="btn-text">' +
                    originalButtonText +
                    '</span>';
                submitButton.classList.add('btn-loading');
            }

            const response = await window.API.request(endpoint, {
                method: 'POST',
                data: data,
                showLoading: false,
                showError: true,
            });

            if (endpoint === '/auth/login') {
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
            }

            window.UI?.showNotification(successMessage, 'success');

            return response;
        } catch (error) {
            console.error(`${successMessage.slice(0, 2)}错误:`, error); // Uses first two chars (e.g., "登录" -> "登")
            throw error;
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                submitButton.classList.remove('btn-loading');
            }
        }
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.UI?.showNotification('已成功退出登录', 'info');
        setTimeout(() => {
            window.location.href = '/html/login.html';
        }, 1000);
    } catch (error) {
        console.error('登出错误:', error);
        // 即使出错也尝试跳转
        window.location.href = '/html/login.html';
    }

    function isAuthenticated() {
        try {
            const token = localStorage.getItem('token');
            return isValidToken(token);
        } catch (error) {
            console.error('身份验证检查错误:', error);
            return false;
        }
    }

    function isValidToken(token) {
        if (!token || typeof token !== 'string' || token.trim() === '') {
            localStorage.removeItem('token');
            return false;
        }
        // TODO: Add more validation such as checking token format or expiration
        return true;
    }

    function getToken() {
        try {
            const token = localStorage.getItem('token');
            return isValidToken(token) ? token : null;
        } catch (error) {
            console.error('获取令牌错误:', error);
            return null;
        }
    }

    function getCurrentUser() {
        try {
            const user = localStorage.getItem('user');
            if (!user) return null;
            const userData = JSON.parse(user);
            return userData && typeof userData === 'object' ? userData : null;
        } catch (error) {
            console.error('获取当前用户数据错误:', error);
            localStorage.removeItem('user');
            return null;
        }
    }
});