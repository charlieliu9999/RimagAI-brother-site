/**
 * 连接到 localhost:3001 (rimag-assistant.app) 截取功能界面
 */
import { createRequire } from 'module';
const require = createRequire('/Users/charlieliu/Documents/Cline/MCP/servers/');
const puppeteer = require('puppeteer');

const OUTPUT_DIR = '/Users/charlieliu/git_project_vscode/09_medical/demo-web/rimagai-brother-site/assets/image_aibrother2';

async function shot(page, filename, desc) {
  const path = `${OUTPUT_DIR}/${filename}`;
  await page.screenshot({ path, fullPage: false });
  console.log(`✅ ${filename} - ${desc}`);
}

async function main() {
  console.log('🔗 连接浏览器调试端口...');
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: { width: 1440, height: 900 }
  });

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('3001'));
  
  if (!page) {
    page = await browser.newPage();
  }
  
  await page.setViewport({ width: 1440, height: 900 });

  // 截取当前页
  await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));
  await shot(page, 'rimag_client_main.png', '客户端主界面');

  // 获取当前 URL 和页面结构
  const url = page.url();
  const title = await page.title();
  console.log('当前页面:', title, url);

  // 尝试获取页面导航链接
  const navLinks = await page.evaluate(() => {
    const links = [];
    document.querySelectorAll('a, [role="tab"], .menu-item, nav li, .nav-item').forEach(el => {
      const text = el.textContent.trim().substring(0, 30);
      const href = el.href || el.dataset.href || '';
      if (text) links.push({ text, href, tag: el.tagName });
    });
    return links.slice(0, 20);
  });
  console.log('导航链接:', JSON.stringify(navLinks, null, 2));

  // 截取几个不同路由
  const routes = ['#eval-history', '#report-qc', '#recommendation', '#knowledge-qa', '#data-analysis'];
  for (const hash of routes) {
    try {
      await page.goto(`http://localhost:3001/${hash}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await new Promise(r => setTimeout(r, 2000));
      const name = hash.replace('#', '').replace(/-/g, '_') || 'home';
      await shot(page, `rimag_${name}.png`, hash);
    } catch(e) {
      console.log(`跳过 ${hash}: ${e.message.slice(0, 50)}`);
    }
  }
  
  browser.disconnect();
  console.log('\n🎉 完成！');
}

main().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});
