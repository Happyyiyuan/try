/**
 * 侧边栏更新脚本
 * 用于批量更新所有HTML页面的侧边栏样式和结构
 */

const fs = require('fs');
const path = require('path');

// 项目根目录
const rootDir = path.resolve(__dirname, '..');

// HTML文件目录
const htmlDir = path.join(rootDir, 'html');

// 需要添加的CSS和JS文件
const cssToAdd = '<link rel="stylesheet" href="/public/css/sidebar-enhancements.css">';
const jsToAdd = '<script src="../public/js/sidebar-unifier.js" defer></script>';

// 获取所有HTML文件
function getAllHtmlFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // 递归处理子目录
            files.push(...getAllHtmlFiles(fullPath));
        } else if (item.endsWith('.html')) {
            files.push(fullPath);
        }
    });
    
    return files;
}

// 更新HTML文件
function updateHtmlFile(filePath) {
    console.log(`处理文件: ${filePath}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 检查文件是否已经包含所需的CSS和JS
        const hasSidebarCss = content.includes('sidebar-enhancements.css');
        const hasSidebarJs = content.includes('sidebar-unifier.js');
        
        // 添加CSS
        if (!hasSidebarCss) {
            // 在</head>前添加CSS
            content = content.replace('</head>', `    ${cssToAdd}\n</head>`);
        }
        
        // 添加JS
        if (!hasSidebarJs) {
            // 在</body>前添加JS
            content = content.replace('</body>', `    ${jsToAdd}\n</body>`);
        }
        
        // 更新导航按钮，将onclick属性替换为data-href属性
        content = content.replace(
            /<button onclick="window\.location\.href=['"]([^'"]+)['"]([^>]*)>([\s\S]*?)<\/button>/g, 
            (match, href, attrs, inner) => {
                // 确保路径格式一致（使用绝对路径）
                if (!href.startsWith('/')) {
                    if (href.startsWith('./') || href.startsWith('../')) {
                        // 相对路径保持不变，由JS处理
                    } else {
                        href = '/' + href;
                    }
                }
                return `<button data-href="${href}"${attrs}>${inner}</button>`;
            }
        );
        
        // 写入更新后的内容
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`已更新: ${filePath}`);
    } catch (error) {
        console.error(`处理文件 ${filePath} 时出错:`, error);
    }
}

// 主函数
function main() {
    console.log('开始更新侧边栏...');
    
    // 处理index.html
    const indexPath = path.join(rootDir, 'index.html');
    if (fs.existsSync(indexPath)) {
        updateHtmlFile(indexPath);
    }
    
    // 处理html目录下的所有HTML文件
    if (fs.existsSync(htmlDir)) {
        const htmlFiles = getAllHtmlFiles(htmlDir);
        htmlFiles.forEach(file => {
            updateHtmlFile(file);
        });
    }
    
    console.log('侧边栏更新完成!');
}

// 执行主函数
main();
