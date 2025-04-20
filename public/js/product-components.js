/**
 * 产品组件模块 - Product Components Module
 * 提供创建和显示产品卡片的功能
 * 依赖: config.js
 */

// 产品组件命名空间
window.ProductComponents = window.ProductComponents || {};

// 创建产品卡片
ProductComponents.createProductCard = function(product, options = {}) {
    // 默认选项
    const defaultOptions = {
        showBadge: true,
        showRating: true,
        showActions: true,
        truncateDescription: true,
        imageSize: 'medium', // small, medium, large
        linkToDetail: true,
        badges: {
            'new': '新品',
            'sale': '促销',
            'hot': '热门'
        }
    };
    
    const settings = { ...defaultOptions, ...options };
    
    // 创建卡片元素
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // 构建卡片HTML结构
    let html = `
        <div class="product-image-container">
            ${product.image 
                ? `<img src="${product.image}" alt="${product.name}" class="product-image"${settings.lazy ? ' loading="lazy"' : ''}>`
                : `<div class="image-placeholder"><i class="fas fa-image"></i></div>`
            }
            ${settings.showBadge && product.badge ? `<div class="product-badge badge-${product.badge}">${settings.badges[product.badge] || product.badge}</div>` : ''}
        </div>
        <div class="product-content">
            <div class="product-category">${product.category || '未分类'}</div>
            <h3 class="product-title">${product.name}</h3>
            ${product.description 
                ? `<p class="product-description${settings.truncateDescription ? ' truncate' : ''}">${product.description}</p>`
                : ''
            }
            ${product.specs && product.specs.length 
                ? `<div class="product-features">
                    ${product.specs.map(spec => `<span class="feature-tag">${spec}</span>`).join('')}
                  </div>`
                : ''
            }
            <div class="product-footer">
                ${product.price 
                    ? `<div class="product-price">
                        ${product.originalPrice ? `<span class="original-price">¥${product.originalPrice}</span>` : ''}
                        ¥${product.price}
                      </div>`
                    : '<div class="product-price">价格待定</div>'
                }
                ${settings.showRating && product.rating 
                    ? `<div class="product-rating">
                        <div class="rating-stars">
                            ${this.generateRatingStars(product.rating)}
                        </div>
                        ${product.reviewCount ? `<span class="rating-count">(${product.reviewCount})</span>` : ''}
                      </div>`
                    : ''
                }
            </div>
            ${settings.showActions 
                ? `<div class="product-actions">
                    <button class="action-button" title="收藏" data-action="favorite" data-product-id="${product.id}">
                        <i class="far fa-heart"></i>
                    </button>
                    <button class="action-button" title="比较" data-action="compare" data-product-id="${product.id}">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button class="action-button" title="分享" data-action="share" data-product-id="${product.id}">
                        <i class="fas fa-share-alt"></i>
                    </button>
                  </div>`
                : ''
            }
            ${settings.linkToDetail 
                ? `<div style="text-align: right; margin-top: 12px;">
                    <a href="/html/product.html?id=${product.id}" class="view-details">查看详情 <i class="fas fa-arrow-right"></i></a>
                  </div>`
                : ''
            }
        </div>
    `;
    
    // 如果设置了链接到详情页
    if (settings.linkToDetail) {
        const link = document.createElement('a');
        link.href = `/html/product.html?id=${product.id}`;
        link.className = 'product-link';
        link.innerHTML = html;
        card.appendChild(link);
    } else {
        card.innerHTML = html;
    }
    
    // 添加事件监听
    if (settings.showActions) {
        setTimeout(() => {
            this.attachActionListeners(card, product.id);
        }, 0);
    }
    
    return card;
};

// 生成星级评分
ProductComponents.generateRatingStars = function(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    
    // 添加满星
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // 添加半星
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // 添加空星
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
};

// 附加操作按钮事件监听器
ProductComponents.attachActionListeners = function(cardElement, productId) {
    const actionButtons = cardElement.querySelectorAll('.action-button');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const action = button.dataset.action;
            
            switch (action) {
                case 'favorite':
                    this.handleFavorite(button, productId);
                    break;
                case 'compare':
                    this.handleCompare(button, productId);
                    break;
                case 'share':
                    this.handleShare(button, productId);
                    break;
            }
        });
    });
};

// 处理收藏
ProductComponents.handleFavorite = function(button, productId) {
    // 检查用户是否已登录
    if (!window.auth || !window.auth.isAuthenticated()) {
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification('请先登录后再收藏商品', 'info');
        }
        return;
    }
    
    // 切换按钮激活状态
    button.classList.toggle('active');
    
    if (button.classList.contains('active')) {
        button.innerHTML = '<i class="fas fa-heart"></i>';
        // 添加到收藏
        this.addToFavorites(productId);
    } else {
        button.innerHTML = '<i class="far fa-heart"></i>';
        // 从收藏中移除
        this.removeFromFavorites(productId);
    }
};

// 处理对比
ProductComponents.handleCompare = function(button, productId) {
    button.classList.toggle('active');
    
    // 获取当前比较列表
    let compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    
    if (button.classList.contains('active')) {
        // 添加到比较列表
        if (!compareList.includes(productId)) {
            if (compareList.length >= 4) {
                if (window.UI && window.UI.showNotification) {
                    window.UI.showNotification('最多只能比较4个产品', 'warning');
                }
                button.classList.remove('active');
                return;
            }
            
            compareList.push(productId);
            if (window.UI && window.UI.showNotification) {
                window.UI.showNotification('已添加到比较列表', 'success');
            }
        }
    } else {
        // 从比较列表移除
        compareList = compareList.filter(id => id !== productId);
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification('已从比较列表移除', 'info');
        }
    }
    
    // 更新本地存储
    localStorage.setItem('compareList', JSON.stringify(compareList));
    
    // 更新比较图标和计数
    this.updateCompareCount(compareList.length);
};

// 处理分享
ProductComponents.handleShare = function(button, productId) {
    const productUrl = `${window.location.origin}/html/product.html?id=${productId}`;
    
    // 检查是否支持Web Share API
    if (navigator.share) {
        navigator.share({
            title: '查看这个产品',
            text: '我发现了一个很棒的产品，来看看吧！',
            url: productUrl
        })
        .then(() => {
            console.log('分享成功');
        })
        .catch(error => {
            console.error('分享失败:', error);
            this.fallbackShare(productUrl);
        });
    } else {
        this.fallbackShare(productUrl);
    }
};

// 备用分享方法
ProductComponents.fallbackShare = function(url) {
    // 创建临时输入框
    const tempInput = document.createElement('input');
    tempInput.value = url;
    document.body.appendChild(tempInput);
    
    // 选择并复制文本
    tempInput.select();
    document.execCommand('copy');
    
    // 移除临时输入框
    document.body.removeChild(tempInput);
    
    // 显示提示
    if (window.UI && window.UI.showNotification) {
        window.UI.showNotification('链接已复制到剪贴板', 'success');
    }
};

// 添加到收藏
ProductComponents.addToFavorites = function(productId) {
    // 检查用户是否登录
    if (!window.auth || !window.auth.isAuthenticated()) {
        return;
    }
    
    // 调用API添加收藏
    window.API.post('/user/favorites', { productId })
        .then(response => {
            if (window.UI && window.UI.showNotification) {
                window.UI.showNotification('成功添加到收藏', 'success');
            }
        })
        .catch(error => {
            console.error('添加收藏失败:', error);
        });
};

// 从收藏中移除
ProductComponents.removeFromFavorites = function(productId) {
    // 检查用户是否登录
    if (!window.auth || !window.auth.isAuthenticated()) {
        return;
    }
    
    // 调用API移除收藏
    window.API.delete(`/user/favorites/${productId}`)
        .then(response => {
            if (window.UI && window.UI.showNotification) {
                window.UI.showNotification('已从收藏中移除', 'info');
            }
        })
        .catch(error => {
            console.error('移除收藏失败:', error);
        });
};

// 更新比较计数
ProductComponents.updateCompareCount = function(count) {
    // 查找比较按钮
    const compareBtn = document.querySelector('.compare-btn');
    
    if (compareBtn) {
        // 更新计数徽章
        let countBadge = compareBtn.querySelector('.compare-count');
        
        if (!countBadge && count > 0) {
            countBadge = document.createElement('span');
            countBadge.className = 'compare-count';
            compareBtn.appendChild(countBadge);
        }
        
        if (countBadge) {
            if (count > 0) {
                countBadge.textContent = count;
                countBadge.style.display = 'inline-flex';
            } else {
                countBadge.style.display = 'none';
            }
        }
    }
};

// 创建加载中卡片
ProductComponents.createLoadingCard = function() {
    const card = document.createElement('div');
    card.className = 'product-card loading';
    
    card.innerHTML = `
        <div class="product-image-container"></div>
        <div class="product-content">
            <div class="product-title"></div>
            <div class="product-description"></div>
            <div class="product-footer">
                <div class="product-price"></div>
            </div>
        </div>
    `;
    
    return card;
};

// 显示产品列表
ProductComponents.renderProductList = function(products, container, options = {}) {
    // 清空容器
    if (options.clear !== false) {
        container.innerHTML = '';
    }
    
    // 检查是否有产品
    if (!products || products.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-products';
        emptyMessage.innerHTML = `
            <div class="empty-icon"><i class="fas fa-box-open"></i></div>
            <h3>暂无产品</h3>
            <p>该分类下暂时没有产品，请稍后再来查看。</p>
        `;
        container.appendChild(emptyMessage);
        return;
    }
    
    // 添加产品卡片
    products.forEach(product => {
        const card = this.createProductCard(product, options);
        container.appendChild(card);
    });
};

// 初始化比较功能
ProductComponents.initCompare = function() {
    // 获取比较列表
    const compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    
    // 更新比较计数
    this.updateCompareCount(compareList.length);
    
    // 初始化产品卡片上的比较按钮
    document.querySelectorAll('.action-button[data-action="compare"]').forEach(button => {
        const productId = button.dataset.productId;
        
        if (compareList.includes(productId)) {
            button.classList.add('active');
        }
    });
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化比较功能
    ProductComponents.initCompare();
    
    // 如果存在比较按钮，添加事件监听
    const compareBtn = document.querySelector('.compare-btn');
    if (compareBtn) {
        compareBtn.addEventListener('click', function() {
            window.location.href = '/html/compare.html';
        });
    }
}); 