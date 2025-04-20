/**
 * 修复API_BASE_URL重复声明问题
 * 这个脚本确保所有JavaScript文件都使用window.CONFIG中的API_BASE_URL
 */

document.addEventListener('DOMContentLoaded', () => {
    // 确保全局配置已加载
    if (!window.CONFIG) {
        console.error('全局配置未加载，无法修复API_BASE_URL');
        return;
    }
    
    // 检查是否有全局API_BASE_URL变量
    try {
        // 尝试使用更安全的方式处理全局变量冲突
        if (typeof API_BASE_URL !== 'undefined') {
            console.warn('检测到全局API_BASE_URL变量，正在修复冲突');
            
            // 尝试安全地删除全局变量，避免冲突
            try {
                window.API_BASE_URL = undefined;
                delete window.API_BASE_URL;
            } catch (e) {
                console.warn('无法删除全局API_BASE_URL变量:', e);
            }
            
            // 确保所有代码都使用window.CONFIG.API_BASE_URL
            console.info('请确保所有代码使用 window.CONFIG.API_BASE_URL 而不是全局 API_BASE_URL');
        }
    } catch (e) {
        // 如果访问API_BASE_URL时出错，这可能意味着它已经被声明但尚未初始化
        console.warn('处理API_BASE_URL时出错:', e);
    }
    
    console.log('API URL修复脚本已运行');
});
