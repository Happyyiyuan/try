// public/js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirect to login page if not logged in
        // window.location.href = '/html/login.html'; 
        console.warn('User not logged in. Profile functionality disabled.');
        // Optionally disable form fields or show a message
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.style.display = 'none';
            const messageDiv = document.createElement('div');
            messageDiv.innerHTML = '<p style="color: var(--text-secondary);">请<a href="/html/login.html">登录</a>以查看和编辑您的个人资料。</p>';
            profileForm.parentNode.insertBefore(messageDiv, profileForm);
        }
        return;
    }

    // Fetch user profile data and initial submissions
    fetchUserProfile(token);
    fetchProfileStats(token); // Fetch stats
    fetchSubmissionsByStatus('all', token); // Fetch initial 'My Posts'

    // Add event listener for profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Add event listener for avatar upload
    const avatarInput = document.getElementById('avatar-upload');
    const customAvatarContainer = document.getElementById('custom-avatar-container');
    const avatarPreview = document.getElementById('avatar-preview');

    if (avatarInput && customAvatarContainer && avatarPreview) {
        customAvatarContainer.addEventListener('click', () => avatarInput.click());

        avatarInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                handleAvatarUpload(file, token);
            }
        });

        // Optional: Add drag and drop support
        setupDragAndDrop(customAvatarContainer, avatarInput, token);
    }
    
    // Setup tabs if they exist
    setupProfileTabs(token);
});

async function fetchUserProfile(token) {
    try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token might be invalid or expired
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/html/login.html?message=session_expired';
            }
            throw new Error(`获取用户信息失败: ${response.status}`);
        }

        const userData = await response.json();
        populateProfileData(userData);

    } catch (error) {
        console.error('获取用户信息时出错:', error);
        showNotification('获取用户信息失败，请稍后重试。', 'error');
    }
}

// New function to fetch profile stats
async function fetchProfileStats(token) {
    try {
        // Assume an endpoint like /api/submissions/me/stats exists
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/submissions/me/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`获取统计数据失败: ${response.status}`);
        }
        const stats = await response.json();
        populateProfileStats(stats);
    } catch (error) {
        console.error('获取统计数据时出错:', error);
        // Don't show notification for stats error, maybe just log it
    }
}

function populateProfileData(userData) {
    // Populate header section in profile page
    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');
    const avatarPreviewElement = document.getElementById('avatar-preview'); // Use the preview ID

    if (userNameElement) userNameElement.textContent = userData.username || '用户名';
    if (userEmailElement) userEmailElement.textContent = userData.email || '邮箱地址';
    if (avatarPreviewElement) avatarPreviewElement.src = userData.avatar || '/public/images/default-avatar.png';

    // Populate edit modal form fields
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        if (editProfileForm.elements['edit-username']) editProfileForm.elements['edit-username'].value = userData.username || '';
        if (editProfileForm.elements['edit-email']) editProfileForm.elements['edit-email'].value = userData.email || '';
        if (editProfileForm.elements['edit-bio']) editProfileForm.elements['edit-bio'].value = userData.bio || '';
        // Do NOT populate password fields
    }

    // Update header avatar if it exists globally (e.g., in main layout)
    updateHeaderAvatar(userData.avatar || '/public/images/default-avatar.png');
}

// New function to populate stats
function populateProfileStats(stats) {
    document.getElementById('posts-count').textContent = stats.all || 0;
    document.getElementById('approved-count').textContent = stats.approved || 0;
    document.getElementById('pending-count').textContent = stats.pending || 0;
    document.getElementById('rejected-count').textContent = stats.rejected || 0;
}

// Updated handler to work with the modal form
async function handleProfileUpdate(event) {
    event.preventDefault();
    const form = event.target; // Should be edit-profile-form
    const formData = new FormData(form);
    const token = localStorage.getItem('token');

    // Get data from modal form fields
    const username = formData.get('edit-username');
    const email = formData.get('edit-email');
    const bio = formData.get('edit-bio');
    const currentPassword = formData.get('edit-current-password');
    const newPassword = formData.get('edit-new-password');
    const confirmPassword = formData.get('edit-confirm-password');

    if (!username || !email) {
        showNotification('用户名和邮箱不能为空。', 'error');
        return;
    }

    const updateData = {
        username: username,
        email: email,
        bio: bio
    };

    // Add password fields only if they are filled and match
    if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
            showNotification('新密码和确认密码不匹配。', 'error');
            return;
        }
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
    } else if (currentPassword || newPassword || confirmPassword) {
        // If any password field is filled, require current and new password
        if (!currentPassword || !newPassword) {
            showNotification('要更改密码，请输入当前密码和新密码。', 'error');
            return;
        }
    }

    try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `更新失败: ${response.status}`);
        }

        showNotification('个人资料更新成功！', 'success');
        fetchUserProfile(token); // Re-fetch profile data to update display
        // fetchProfileStats(token); // Stats likely don't change on profile update

        // Close the modal
        const editModal = document.getElementById('edit-profile-modal');
        if (editModal) {
            editModal.style.display = 'none';
        }

        // Clear password fields in the modal form after successful update
        if (form.elements['edit-current-password']) form.elements['edit-current-password'].value = '';
        if (form.elements['edit-new-password']) form.elements['edit-new-password'].value = '';
        if (form.elements['edit-confirm-password']) form.elements['edit-confirm-password'].value = '';

    } catch (error) {
        console.error('更新个人资料时出错:', error);
        showNotification(`更新失败: ${error.message}`, 'error');
    }
}

async function handleAvatarUpload(file, token) {
    const formData = new FormData();
    formData.append('avatar', file);

    const uploadStatusDiv = document.getElementById('upload-status');
    const progressBar = document.getElementById('upload-progress-bar');
    const statusMessage = document.getElementById('upload-status-message');
    const avatarPreview = document.getElementById('avatar-preview'); // Target the preview image

    if (!uploadStatusDiv || !progressBar || !statusMessage || !avatarPreview) {
        console.error('Avatar upload UI elements not found.');
        return;
    }

    uploadStatusDiv.style.display = 'block';
    progressBar.style.width = '0%';
    progressBar.style.backgroundColor = 'var(--primary-color)'; // Reset color
    statusMessage.textContent = '正在上传...';

    try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${window.CONFIG.API_BASE_URL}/upload/avatar`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressBar.style.width = percentComplete + '%';
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const result = JSON.parse(xhr.responseText);
                statusMessage.textContent = '上传成功！';
                progressBar.style.width = '100%';
                avatarPreview.src = result.avatarUrl; // Update profile page avatar preview

                // Update user data in localStorage
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.avatar = result.avatarUrl;
                localStorage.setItem('user', JSON.stringify(user));

                // Update avatar in the main header (if exists)
                updateHeaderAvatar(result.avatarUrl);

                setTimeout(() => { uploadStatusDiv.style.display = 'none'; }, 3000);
            } else {
                let errorMsg = `上传失败: ${xhr.status}`;
                try {
                    const errorResult = JSON.parse(xhr.responseText || '{}');
                    errorMsg = errorResult.message || errorMsg;
                } catch (e) { /* Ignore parsing error */ }
                throw new Error(errorMsg);
            }
        };

        xhr.onerror = () => {
            throw new Error('网络错误，上传失败。');
        };

        xhr.send(formData);

    } catch (error) {
        console.error('上传头像时出错:', error);
        statusMessage.textContent = `上传失败: ${error.message}`; // Show specific error
        progressBar.style.width = '100%'; // Show full bar but in error color
        progressBar.style.backgroundColor = 'var(--error-color)'; // Indicate error
        setTimeout(() => {
            uploadStatusDiv.style.display = 'none';
            progressBar.style.backgroundColor = 'var(--primary-color)'; // Reset color
        }, 5000);
    }
}

function setupDragAndDrop(container, inputElement, token) {
    container.addEventListener('dragover', (event) => {
        event.preventDefault();
        container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', () => {
        container.classList.remove('drag-over');
    });

    container.addEventListener('drop', (event) => {
        event.preventDefault();
        container.classList.remove('drag-over');
        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) { // Basic type check
            inputElement.files = event.dataTransfer.files; // Assign files to input
            handleAvatarUpload(file, token);
        } else if (file) {
            showNotification('请上传图片文件。', 'error');
        }
    });
}

function setupProfileTabs(token) {
    const tabContainer = document.querySelector('.profile-tabs');
    if (!tabContainer) return;

    const tabItems = tabContainer.querySelectorAll('.tab-navigation .tab-item');
    const tabContents = tabContainer.querySelectorAll('.tab-content');

    if (tabItems.length === 0 || tabContents.length === 0) return;

    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab; // e.g., 'my-posts', 'approved'
            const apiStatus = targetId === 'my-posts' ? 'all' : targetId; // Map tab ID to API status parameter

            // Deactivate all tabs and content
            tabItems.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activate clicked tab and corresponding content
            tab.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
                // Fetch data for the activated tab only if it's not the initial load or already loaded
                // For simplicity, we fetch every time now, but could add caching later.
                fetchSubmissionsByStatus(apiStatus, token);
            } else {
                console.warn(`Tab content not found for ID: ${targetId}`);
            }
        });
    });

    // Initial fetch is handled in DOMContentLoaded
}

// Updated function to fetch submissions by status using new IDs
async function fetchSubmissionsByStatus(status, token) {
    // Map API status ('all', 'approved', etc.) to the corresponding container and empty state IDs
    const baseId = status === 'all' ? 'my-posts' : status;
    const containerId = `${baseId}-submissions-container`;
    const emptyStateId = `${baseId}-empty-state`;

    const container = document.getElementById(containerId);
    const emptyState = document.getElementById(emptyStateId);

    if (!container) {
        console.warn(`Submission container not found for ID: ${containerId}`);
        return;
    }
    if (!emptyState) {
        console.warn(`Empty state element not found for ID: ${emptyStateId}`);
        // Continue without empty state handling if it's missing
    }

    // Show loading state
    container.innerHTML = '<div class="loading-spinner"></div>'; // Use a spinner class
    container.style.display = 'grid'; // Ensure container is visible for loading spinner
    if (emptyState) emptyState.style.display = 'none';

    try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/submissions/me?status=${status}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/html/login.html?message=session_expired';
                return; // Stop execution after redirect
            }
            throw new Error(`获取内容失败: ${response.status}`);
        }

        const submissions = await response.json();
        renderSubmissions(submissions, container, emptyState);

    } catch (error) {
        console.error(`获取状态为 ${status} 的内容时出错:`, error);
        container.innerHTML = `<p class="error-message">加载失败: ${error.message}</p>`;
        if (emptyState) emptyState.style.display = 'none';
    }
}

// Updated function to render submissions or empty state
function renderSubmissions(submissions, container, emptyState) {
    container.innerHTML = ''; // Clear loading state

    if (!submissions || submissions.length === 0) {
        container.style.display = 'none'; // Hide the grid container
        if (emptyState) {
            emptyState.style.display = 'flex'; // Show the empty state message
        }
    } else {
        container.style.display = 'grid'; // Ensure grid layout is used
        if (emptyState) {
            emptyState.style.display = 'none'; // Hide empty state
        }
        submissions.forEach(submission => {
            const card = createSubmissionCard(submission);
            container.appendChild(card);
        });
    }
}

// Helper function to create a submission card (customize as needed)
function createSubmissionCard(submission) {
    const card = document.createElement('div');
    // Use classes consistent with index.html card styling if possible
    card.className = 'product-card profile-submission-card'; // Add specific class

    const imageUrl = submission.image_url || '/public/images/placeholder.png';
    const title = submission.title || '无标题';
    const statusText = getReadableStatus(submission.status);
    const statusClass = `status-${submission.status}`; // e.g., status-approved

    card.innerHTML = `
        <a href="/html/product.html?id=${submission.id}" class="card-link">
            <div class="card-image-container">
                <img src="${imageUrl}" alt="${title}" class="card-image" loading="lazy">
            </div>
            <div class="card-content">
                <h4 class="card-title">${title}</h4>
                <p class="card-status ${statusClass}">状态: ${statusText}</p>
                ${submission.status === 'rejected' && submission.reject_reason ? `<p class="card-reject-reason">原因: ${submission.reject_reason}</p>` : ''}
            </div>
        </a>
        ${submission.status === 'rejected' ? `<button class="btn btn-secondary btn-sm resubmit-btn" data-id="${submission.id}">重新编辑</button>` : ''}
        ${submission.status === 'pending' || submission.status === 'approved' ? `<button class="btn btn-danger btn-sm delete-btn" data-id="${submission.id}">删除</button>` : ''}
    `;

    // Add event listeners for buttons if needed (e.g., delete, resubmit)
    const resubmitBtn = card.querySelector('.resubmit-btn');
    if (resubmitBtn) {
        resubmitBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent link navigation
            // Redirect to submit page with ID for editing
            window.location.href = `/html/submit.html?edit=${submission.id}`;
        });
    }

    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm(`确定要删除"${title}"吗？此操作无法撤销。`)) {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/submissions/${submission.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(`删除失败: ${response.status}`);
                    }
                    
                    showNotification('内容已成功删除', 'success');
                    // 重新加载当前标签页数据
                    const activeTab = document.querySelector('.tab-navigation .tab-item.active');
                    if (activeTab) {
                        const status = activeTab.dataset.tab === 'my-posts' ? 'all' : activeTab.dataset.tab;
                        fetchSubmissionsByStatus(status, token);
                        // 更新统计数据
                        fetchProfileStats(token);
                    }
                } catch (error) {
                    console.error('删除内容时出错:', error);
                    showNotification(`删除失败: ${error.message}`, 'error');
                }
            }
        });
    }
    
    return card;
}

// 将状态代码转换为可读文本
function getReadableStatus(status) {
    const statusMap = {
        'pending': '审核中',
        'approved': '已通过',
        'rejected': '未通过',
        'draft': '草稿'
    };
    return statusMap[status] || status;
}

// 更新全局头部的头像
function updateHeaderAvatar(avatarUrl) {
    const headerAvatar = document.querySelector('.header-avatar img');
    if (headerAvatar) {
        headerAvatar.src = avatarUrl;
    }
}

// 显示通知消息
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // 添加到页面
    const notificationsContainer = document.getElementById('notifications-container');
    if (!notificationsContainer) {
        // 如果容器不存在，创建一个
        const container = document.createElement('div');
        container.id = 'notifications-container';
        document.body.appendChild(container);
        container.appendChild(notification);
    } else {
        notificationsContainer.appendChild(notification);
    }
    
    // 添加关闭按钮事件
    const closeButton = notification.querySelector('.notification-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            notification.classList.add('notification-hiding');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
    
    // 自动关闭
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('notification-hiding');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}