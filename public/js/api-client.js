/**
 * API Client Module - Handles all communication with the backend API.
 * Provides a unified interface for data requests, handling errors, authentication, etc.
 * Depends on: config.js
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!window.CONFIG) {
        console.error('Error: Global configuration not loaded. api-client.js requires config.js to be loaded first.');
    }
    console.log('API Client initialized.');
});

class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL || window.CONFIG?.API_BASE_URL || '/api';
        this.activeRequests = new Map(); // 跟踪活动请求
        this.defaultTimeout = 30000; // 默认超时：30秒
    }
    
    async request(endpoint, options = {}) {
        const { method = 'GET',
                data = null,
                headers = {},
                timeout = this.defaultTimeout,
                showLoading = true,
                showError = true } = options;

        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        const requestKey = `${method}:${url}:${JSON.stringify(data)}`;
        
        if (this.activeRequests.has(requestKey)) {
            return this.activeRequests.get(requestKey);
        }

        const requestPromise = this.#makeRequest(url, method, data, headers, timeout, showLoading, showError, requestKey);
        this.activeRequests.set(requestKey, requestPromise);
        return requestPromise;
    }
    async #makeRequest(url, method, data, headers, timeout, showLoading, showError, requestKey){
        const requestHeaders = {
            'Content-Type': 'application/json',
            ...headers
        };
        
        // 添加认证token (如果存在)
        const token = localStorage.getItem('token');
        if (token) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
        }        
        
        // 准备fetch选项
        const fetchOptions = {
            method,
            headers: requestHeaders,
            credentials: 'same-origin'
        };
        
        // 添加请求体（适用于POST, PUT等方法）
        if (['POST', 'PUT', 'PATCH'].includes(method) && data) {
            fetchOptions.body = JSON.stringify(data);
        }
        
        // 显示加载指示器
        let loadingIndicator;
        if (showLoading) {
            loadingIndicator = this.showLoading();
        }
        
        // 创建abort controller用于超时处理
        const controller = new AbortController();
        fetchOptions.signal = controller.signal;
        
        // 设置超时
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // 创建并存储promise
        const requestPromise = (async () => {
            try {
                let urlWithParams = url;
                
                // 对于GET请求，将数据作为查询参数添加
                if (method === 'GET' && data) {
                    const queryParams = new URLSearchParams();
                    Object.entries(data).forEach(([key, value]) => {
                        if (value !== null && value !== undefined) {
                            queryParams.append(key, value);
                        }
                    });
                    const queryString = queryParams.toString();
                    if (queryString) {
                        urlWithParams = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
                    }
                }
                
                // 发起fetch请求
                const response = await fetch(urlWithParams, fetchOptions);
                
                // 清除超时
                clearTimeout(timeoutId);
                
                // 检查响应状态
                if (!response.ok) {
                    // 处理特定状态码
                    if (response.status === 401) {
                        if (window.auth && typeof window.auth.clearSession === 'function') {
                                window.auth.clearSession();
                        }
                        // 如果不是登录页面，重定向到登录
                        if (!window.location.pathname.includes('login.html')) {
                            window.location.href = '/html/login.html';
                        }
                    }
                    
                    // 尝试解析错误响应
                    let errorData;
                    try {
                        errorData = await response.json();
                    } catch (e) {
                        errorData = { error: response.statusText };
                    }
                    
                    throw {
                        status: response.status,
                        statusText: response.statusText,
                        data: errorData
                    };
                }
                
                // 处理不同类型的响应
                let responseData;
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    responseData = await response.json();
                } else if (contentType && contentType.includes('text/')) {
                    responseData = await response.text();
                } else {
                    responseData = await response.blob();
                }
                
                return responseData;
            } catch (error) {
                // 处理abort错误
                if (error.name === 'AbortError') {
                    const timeoutError = {
                        status: 'timeout',
                        statusText: '请求超时',
                        data: { error: '请求时间过长，请稍后再试。' }
                    };
                    
                    if (showError) {
                        this.showErrorNotification(timeoutError);
                    }
                    
                    throw timeoutError;
                }
                
                // 处理网络错误
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    const networkError = {
                        status: 'network_error',
                        statusText: '网络错误',
                        data: { error: '无法连接到服务器，请检查您的网络连接。' }
                    };
                    
                    if (showError) {
                        this.showErrorNotification(networkError);
                    }
                    
                    throw networkError;
                }
                
                // 处理API错误
                if (showError) {
                    this.showErrorNotification(error);
                }
                
                throw error;
            } finally {
                // 隐藏加载指示器
                if (showLoading && loadingIndicator) {
                    this.hideLoading(loadingIndicator);
                }
                
                // 从活动请求中移除
                this.activeRequests.delete(requestKey);
            }
        })();
        
        // 存储请求Promise
        this.activeRequests.set(requestKey, requestPromise);
        
        return requestPromise;
    }
    
    async get(endpoint, params = {}, options = {}) {
        return this.request(endpoint, { method: 'GET', data: params, ...options });
    }
    async post(endpoint, data = {}, options = {}) {
        return this.request(endpoint, { method: 'POST', data, ...options });
    }
    async put(endpoint, data = {}, options = {}) {
        return this.request(endpoint, { method: 'PUT', data, ...options });
    }
    
    // 显示错误通知
    showErrorNotification(error) {
        const errorMessage = error.data?.error || error.data?.message || error.statusText || '发生未知错误';
        
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification(errorMessage, 'error');
        } else {
            console.error('API错误:', errorMessage);
        }
    }
    
    // 显示加载指示器
    showLoading() {
        // 检查是否已存在全局加载指示器
        let indicator = document.getElementById('global-loading-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'global-loading-indicator';
            indicator.innerHTML = `
                <div class="loading-spinner"></div>
            `;
            // 添加必要的CSS
            indicator.style.position = 'fixed';
            indicator.style.top = '20px';
            indicator.style.right = '20px';
            indicator.style.zIndex = '9999';
            indicator.style.background = 'rgba(0, 0, 0, 0.7)';
            indicator.style.borderRadius = '4px';
            indicator.style.padding = '10px';
            indicator.style.color = 'white';
            indicator.style.display = 'flex';
            indicator.style.alignItems = 'center';
            indicator.style.justifyContent = 'center';
            indicator.style.transition = 'opacity 0.3s';
            
            // 添加加载指示器样式
            const spinnerStyle = document.createElement('style');
            spinnerStyle.textContent = `
                .loading-spinner {
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top: 3px solid white;
                    width: 24px;
                    height: 24px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(spinnerStyle);
            
            document.body.appendChild(indicator);
        } else {
            // 如果已存在，增加计数器
            const counter = parseInt(indicator.dataset.counter || '0');
            indicator.setAttribute('data-counter', (counter + 1).toString());
        }
        
        return indicator;
    }
    
    // 隐藏加载指示器
    hideLoading(indicator) {
        if (!indicator) return;
        
        // 减少计数器
        const counter = parseInt(indicator.dataset.counter || '0');
        
        if (counter <= 1) {
            // 如果是最后一个请求，淡出加载指示器
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
            indicator.setAttribute('data-counter', '0');
        } else {
            // 如果还有其他请求，只减少计数器
            indicator.setAttribute('data-counter', (counter - 1).toString());
        }
    }
}

// 创建全局API实例
window.API = new APIClient();