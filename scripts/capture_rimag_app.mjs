/**
 * 通过 Puppeteer 连接到已运行的 rimag-assistant.app，截取各功能界面
 */
import puppeteer from 'puppeteer';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../assets/image_aibrother2');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

async function screenshot(page, filename, description) {
  const path = join(OUTPUT_DIR, filename);
  await page.screenshot({ path, fullPage: false });
  console.log(`✅ 截图成功: ${filename} - ${description}`);
  return path;
}

async function main() {
  console.log('🔗 连接到已运行的浏览器（调试端口 9222）...');
  
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  console.log(`📋 找到 ${pages.length} 个页面`);
  
  for (const p of pages) {
    const url = p.url();
    const title = await p.title();
    console.log(`  - ${title}: ${url}`);
  }

  // 找到 RimagAI Brother 2 页面 (localhost:3001)
  let targetPage = pages.find(p => p.url().includes('localhost:3001') || p.url().includes('220.154.3.166'));
  
  if (!targetPage) {
    console.log('❌ 没有找到 localhost:3001 页面，尝试创建新页面...');
    targetPage = await browser.newPage();
    await targetPage.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 15000 });
  }

  // 设置视口为桌面客户端大小
  await targetPage.setViewport({ width: 1440, height: 900 });
  
  // 等待页面渲染
  await new Promise(r => setTimeout(r, 2000));
  
  const currentUrl = targetPage.url();
  const title = await targetPage.title();
  console.log(`🎯 目标页面: ${title} - ${currentUrl}`);
  
  // 截取当前页面（eval-history）
  await screenshot(targetPage, 'rimag_app_eval_history.png', '评估历史页面');

  // 导航到其他页面截图
  const routes = [
    { hash: '', name: 'rimag_app_home.png', desc: '首页/主面板' },
    { hash: '#report', name: 'rimag_app_report.png', desc: '报告页' },
    { hash: '#knowledge', name: 'rimag_app_knowledge.png', desc: '知识问答' },
    { hash: '#data-analysis', name: 'rimag_app_analysis.png', desc: '数据分析' },
  ];

  for (const route of routes) {
    try {
      const baseUrl = 'http://localhost:3001/';
      await targetPage.goto(baseUrl + route.hash, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await new Promise(r => setTimeout(r, 1500));
      await screenshot(targetPage, route.name, route.desc);
    } catch (e) {
      console.log(`⚠️  跳过 ${route.hash}: ${e.message.substring(0, 60)}`);
    }
  }
  
  // 最后截一张当前实际显示的页面全景
  await targetPage.setViewport({ width: 1440, height: 900 });
  await new Promise(r => setTimeout(r, 1000));
  await screenshot(targetPage, 'rimag_app_final.png', '最终截图');
  
  console.log('\n🎉 所有截图完成！');
  
  // 不要断开连接（只是 connect，不是 launch，所以不能 close）
  browser.disconnect();
}

main().catch(e => {
  console.error('❌ 错误:', e.message);
  process.exit(1);
});
