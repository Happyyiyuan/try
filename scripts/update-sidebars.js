const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlDir = path.join(rootDir, 'html');
const cssToAdd = '<link rel="stylesheet" href="/public/css/sidebar-enhancements.css">';
const jsToAdd = '<script src="../public/js/sidebar-unifier.js" defer></script>';

async function getAllHtmlFiles(dir) {
  const files = [];
  const items = await fs.promises.readdir(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.promises.stat(fullPath);

    if (stat.isDirectory()) {
      files.push(...(await getAllHtmlFiles(fullPath)));
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function updateHtmlFile(filePath) {
  console.log(`Processing file: ${filePath}`);

  try {
    let content = await fs.promises.readFile(filePath, 'utf8');

    if (!content.includes('sidebar-enhancements.css')) {
      content = content.replace('</head>', `  ${cssToAdd}\n</head>`);
    }

    if (!content.includes('sidebar-unifier.js')) {
      content = content.replace('</body>', `  ${jsToAdd}\n</body>`);
    }

    content = content.replace(
      /<button onclick="window\.location\.href=['"]([^'"]+)['"]([^>]*)>([\s\S]*?)<\/button>/g,
      (match, href, attrs, inner) => {
        const newHref = href.startsWith('/') || href.startsWith('./') || href.startsWith('../') ? href : `/${href}`;
        return `<button data-href="${newHref}"${attrs}>${inner}</button>`;
      }
    );

    await fs.promises.writeFile(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

async function main() {
  console.log('Starting sidebar update...');

  const indexPath = path.join(rootDir, 'index.html');
  if (await fs.promises.exists(indexPath)) {
    await updateHtmlFile(indexPath);
  }

  if (await fs.promises.exists(htmlDir)) {
    const htmlFiles = await getAllHtmlFiles(htmlDir);
    await Promise.all(htmlFiles.map(file => updateHtmlFile(file)));
  }

  console.log('Sidebar update complete!');
}

main().catch(error => {
  console.error('An error occurred during the update process:', error);
});
