/**
 * Main Application Script
 * Handles interactions and data loading for the homepage and product listing pages.
 * Dependencies: config.js, api-client.js, components.js, product-components.js
 */

// Note: WebSocket connection is now managed by websocket-client.js.
// The following code has been commented out to avoid duplicate connections.

let reconnectAttempts = 0;

// 禁用原有WebSocket初始化，由websocket-client.js管理
function initWebSocket() {
    // 什么也不做，仅保留函数以避免其他代码调用时出错
    console.log('WebSocket连接现在完全由websocket-client.js管理');
    return;
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'ping':
            // ws.send(JSON.stringify({ type: 'pong' }));
            break;
        case 'update':
            if (typeof window.handleDataUpdate === 'function') {
                window.handleDataUpdate(data.data);
            }
            break;
        default:
            console.log('Received WebSocket message:', data);
    }
}


// 获取产品数据
async function fetchProducts(retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 1000;

    try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);

        if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return fetchProducts(retryCount + 1);
        }
        // Display error to user if retries fail
        displayDataLoadError();
        throw error;
    }
}

// Display data loading error message
function displayDataLoadError() {
    const featuredContent = document.getElementById('featured-content');
    if (featuredContent) {
        featuredContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i> Sorry, there was a problem loading product data. Please try again later.
            </div>`;
    }

}

// 更新连接状态UI
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('ws-connection-status');
    if (!statusElement) {
        // 如果状态元素不存在，创建一个
        const statusDiv = document.createElement('div');
        statusDiv.id = 'ws-connection-status';
        statusDiv.style.position = 'fixed';
        statusDiv.style.bottom = '10px';
        statusDiv.style.right = '10px';
        statusDiv.style.padding = '5px 10px';
        statusDiv.style.borderRadius = '4px';
        statusDiv.style.fontSize = '12px';
        statusDiv.style.zIndex = '9999';
        document.body.appendChild(statusDiv);
    }   
    const status = document.getElementById('ws-connection-status');
    if (connected) {
        status.textContent = 'Real-time connection established';
        status.style.backgroundColor = '#4CAF50';
        status.style.color = 'white';
        
        // Hide the success message after 3 seconds
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000)
    } else {
        status.textContent = '实时连接已断开';
        status.style.backgroundColor = '#F44336';
        status.style.color = 'white';
        status.style.display = 'block';
    }
}

// 显示连接错误
function showConnectionError() {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'connection-error';
    errorContainer.innerHTML = ` 
        <div style="padding: 15px; background-color: #ffebee; border-left: 4px solid #f44336; margin: 10px 0;">
            <h3 style="margin-top: 0; color: #d32f2f;">连接错误</h3>
            <p>无法连接到实时服务器。部分功能可能不可用。</p>
            <button id="retry-connection" style="background-color: #d32f2f; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">重试连接</button>
        </div>
    `;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertBefore(errorContainer, mainContent.firstChild);
    } else {
        document.body.insertBefore(errorContainer, document.body.firstChild);
    }
    
    document.getElementById('retry-connection').addEventListener('click', function() {
        errorContainer.remove();
        reconnectAttempts = 0;
        initWebSocket();
    });
}



// --- NEW CODE FOR INDEX.HTML SEARCH, FILTER, AND PAGINATION --- 

let allProducts = []; // Store all fetched products
let currentFilter = 'all'; // Track the current filter
let currentSearchTerm = ''; // Track the current search term
let currentPage = 1; // Track the current page
const productsPerPage = 9; // Number of products per page

// Render products based on current filter/search and page
function renderProducts(productsToRender) {
    const featuredContent = document.getElementById('featured-content');
    const paginationContainer = document.getElementById('pagination-controls');
    
    if (!featuredContent || !paginationContainer) return; // Ensure elements exist

    featuredContent.innerHTML = ''; // Clear previous content
    paginationContainer.innerHTML = ''; // Clear previous pagination

    if (productsToRender.length === 0) {
        featuredContent.innerHTML = '<p class="no-products">No products found matching the criteria.</p>';
        return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(productsToRender.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = productsToRender.slice(startIndex, endIndex);

    // Render product cards
    paginatedProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'featured-card knowledge-card'; // Use both classes for styling consistency
        const imageElement = product.image
            ? `<img src="${product.image}" alt="${product.name}" class="card-image">`
            : '<div class="card-image-placeholder">No Image</div>';

        const description = product.description
            ? product.description.substring(0, 100) + '...'
            : 'No description available';

        card.innerHTML = `
            ${imageElement}
            <div class="card-content">
                <span class="card-category">${product.category || '未知分类'}</span>
                <h3 class="card-title">${product.name}</h3>
                <p class="card-description">${description}</p>
                <div class="card-footer">
                    ${product.price ? `<span class="card-price">$${product.price}</span>` : '<span></span>'}
                    <a href="/html/product.html?id=${product.id}" class="card-link">View Details <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>`;
        featuredContent.appendChild(card);
    });

    // Render pagination controls
    renderPagination(totalPages);
}

// Render pagination buttons
function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer || totalPages <= 1) return; // Don't render if only one page
  
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            filterAndSearchProducts();
        }
    });
  

    // Page number buttons (simplified for brevity, could add ellipsis for many pages)
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => {
            currentPage = i;
            filterAndSearchProducts();
        });

    }
  
  
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            filterAndSearchProducts();
        }
    })
    paginationContainer.appendChild(nextButton);
}

// Filter and search products
function filterAndSearchProducts() {
    let filtered = allProducts;

    // Apply category filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => p.category === currentFilter);
    }

    // Apply search term
    if (currentSearchTerm) {
        const lowerCaseSearch = currentSearchTerm.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(lowerCaseSearch) || 
            (p.description && p.description.toLowerCase().includes(lowerCaseSearch)) ||
            p.category.toLowerCase().includes(lowerCaseSearch)
        );
    }

    renderProducts(filtered);
}

// Event listeners for filter buttons
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-button');
    const searchInput = document.querySelector('.search-container input');

    // Create pagination container if it doesn't exist
    let paginationDiv = document.getElementById('pagination-controls');
    if (!paginationDiv) {
        paginationDiv = document.createElement('div');
        paginationDiv.id = 'pagination-controls';
        paginationDiv.className = 'pagination'; // Add class for styling
        const featuredContent = document.getElementById('featured-content');
        if (featuredContent && featuredContent.parentNode) {
            // Insert after the featured content grid
            featuredContent.parentNode.insertBefore(paginationDiv, featuredContent.nextSibling);
        }
    } 

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.getAttribute('onclick')) return; //Don't process clicks on the submit button
          
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.category;
            currentPage = 1; // Reset to page 1 on filter change
            filterAndSearchProducts();
        });
    });

    // Event listener for search input
    if (searchInput) {   
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            currentPage = 1; // Reset to page 1 on search change
            filterAndSearchProducts();
        });
    }

    // Initial load
    fetchProducts()
        .then(data => {
            if (data && data.products) {
                allProducts = data.products; 
                currentPage = 1; // Ensure starting on page 1
                filterAndSearchProducts(); // Initial render
            } else {
                console.error('Fetched data is not in expected format:', data);
                displayDataLoadError();
            }
        })
        .catch(error => {
            console.error('Error fetching initial products:', error);
            // Error already displayed by fetchProducts
        });
});

// --- END OF NEW CODE ---

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
}


function setupScrollToTop() {
    let backToTopButton = document.querySelector('.back-to-top');
    if (!backToTopButton) {
        backToTopButton = document.createElement('div');
        backToTopButton.classList.add('back-to-top');
        backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
        backToTopButton.setAttribute('title', 'Back to Top');
        document.body.appendChild(backToTopButton);
        const style = document.createElement('style');
        style.textContent = `
            .back-to-top {
                position: fixed;
                right: 20px;
                bottom: 20px;
                width: 40px;
                height: 40px;
                background: var(--primary-color);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease;
                z-index: 999;
                box-shadow: 0 4px 10px rgba(80, 72, 229, 0.3);
            }
            
            .back-to-top.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .back-to-top:hover {
                transform: translateY(-5px);
                background: var(--primary-dark);
                box-shadow: 0 6px 15px rgba(80, 72, 229, 0.4);
            }
            
            @media (max-width: 768px) {
                .back-to-top {
                    right: 15px;
                    bottom: 15px;
                    width: 35px;
                    height: 35px;
                }
            }
        `;
        document.head.appendChild(style);
    }
  
    window.addEventListener('scroll', () => {
        backToTopButton.classList.toggle('visible', window.pageYOffset > 300);
    });
  
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}


// 改进的侧边栏切换功能
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    // 创建遮罩层
    let overlay = document.getElementById('overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay';
        overlay.className = 'overlay';

    }
    
    // 侧边栏切换
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });
        
        // 点击遮罩层关闭侧边栏
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }
    
    // 添加ESC键关闭侧边栏
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    });
    
    // 监听页面尺寸变化
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    });
}

// 添加加载指示器
function addLoadingIndicator() {
    const style = document.createElement('style');
    style.textContent = `
        .page-loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(to right, var(--primary-light), var(--primary-color));
            z-index: 9999;
            opacity: 0;
            transform: translateY(-3px);
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .page-loading.active {
            opacity: 1;
            transform: translateY(0);
            animation: loading-animation 2s infinite;
        }
        
        @keyframes loading-animation {
            0% { width: 0; left: 0; }
            50% { width: 100%; left: 0; }
            100% { width: 0; left: 100%; }
        }
    `;
    document.head.appendChild(style);
    
    const loadingBar = document.createElement('div');
    loadingBar.className = 'page-loading';
    document.body.appendChild(loadingBar);
    
    // 页面加载开始
    window.addEventListener('beforeunload', function() {
        loadingBar.classList.add('active');
    });
    
    // 页面完全加载
    window.addEventListener('load', function() {
        setTimeout(() => {
            loadingBar.classList.remove('active');
        }, 500);
    });
    
    // 自定义AJAX请求前后的加载状态
    window.showPageLoading = function() {
        loadingBar.classList.add('active');
    };
    
    window.hidePageLoading = function() {
        loadingBar.classList.remove('active');
    };
}

// 扩展initApp函数，添加新功能
function initApp() {
    // 加载产品数据
    loadFeaturedProducts();
    
    // 设置分类过滤器
    setupCategoryFilters();
    
    // 设置搜索功能
    setupSearch();
    
    // 设置分页功能
    setupPagination();
    
    // 设置跟随滚动的返回顶部按钮
    setupScrollToTop();
    
    // 设置移动端侧边栏切换
    setupSidebarToggle();
    
    // 添加加载指示器
    addLoadingIndicator();
    
    // 设置主题切换
    setupThemeToggle();
    

}

document.addEventListener('DOMContentLoaded', initApp); 