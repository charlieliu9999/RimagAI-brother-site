#!/usr/bin/env node

/**
 * sync-whitepaper.js
 *
 * 将 rimagai-brother 主项目中的 MCOS Blueprint Markdown 同步到
 * rimagai-brother-site 的 whitepaper HTML 页面。
 *
 * 工作流程：
 *   1. 读取源 Markdown 文件
 *   2. 预处理：将 ![](figures/xxx.png) 图片替换为同文件中的 Mermaid 备用代码
 *   3. 清理 <details>/<summary> 包裹（Mermaid 源码已提升为正文）
 *   4. Base64 编码
 *   5. 替换 whitepaper HTML 中的 b64Data 变量
 *
 * 用法：
 *   node sync-whitepaper.js                     # 默认路径
 *   node sync-whitepaper.js --dry-run           # 只预览不写入
 *   node sync-whitepaper.js --md path/to/md     # 自定义源文件
 *   node sync-whitepaper.js --html path/to/html # 自定义目标文件
 */

const fs = require('fs');
const path = require('path');

// ─── 参数解析 ───
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const mdIdx = args.indexOf('--md');
const htmlIdx = args.indexOf('--html');

const SCRIPT_DIR = __dirname;
const DEFAULT_MD = path.resolve(SCRIPT_DIR, '../rimagai-brother/docs/plans/2026-04-11-mcos-blueprint-v3.md');
const DEFAULT_HTML = path.resolve(SCRIPT_DIR, 'mcos-blueprint-whitepaper.html');

const mdPath = mdIdx !== -1 ? path.resolve(args[mdIdx + 1]) : DEFAULT_MD;
const htmlPath = htmlIdx !== -1 ? path.resolve(args[htmlIdx + 1]) : DEFAULT_HTML;

// ─── 主流程 ───

console.log('╔══════════════════════════════════════════╗');
console.log('║   MCOS Whitepaper Sync                   ║');
console.log('╚══════════════════════════════════════════╝');
console.log();
console.log(`源文件:   ${mdPath}`);
console.log(`目标文件: ${htmlPath}`);
console.log(`模式:     ${dryRun ? '🔍 预览（dry-run）' : '✏️  写入'}`);
console.log();

// 1. 读取文件
if (!fs.existsSync(mdPath)) {
  console.error(`❌ 源 Markdown 文件不存在: ${mdPath}`);
  process.exit(1);
}
if (!fs.existsSync(htmlPath)) {
  console.error(`❌ 目标 HTML 文件不存在: ${htmlPath}`);
  process.exit(1);
}

let md = fs.readFileSync(mdPath, 'utf8');
const html = fs.readFileSync(htmlPath, 'utf8');

// 2. 统计原始信息
const imgMatches = md.match(/!\[([^\]]*)\]\(figures\/[^)]+\)/g) || [];
console.log(`📄 Markdown 长度: ${md.length} 字符`);
console.log(`🖼️  发现 ${imgMatches.length} 个 figures/ 图片引用`);

// 3. 提取 <details> 中的 Mermaid 源码并替换对应的 PNG 引用
//
// 文档中的模式是：
//   ![图 X-Y：标题](figures/figX-Y-xxx.png)
//   *图 X-Y：标题*
//   <details>
//   <summary>Mermaid 源码（文本备用）</summary>
//   ```mermaid
//   ...
//   ```
//   </details>
//
// 我们需要：删除 ![...](figures/...) 行和 *图 X-Y* 行，
// 然后提取 <details> 内的 mermaid 代码块提升为正文。

// 3a. 先删除所有 ![...](figures/...) 图片行
let processed = md.replace(/^!\[[^\]]*\]\(figures\/[^)]+\)\s*$/gm, '');

// 3b. 删除紧跟的 *图 X-Y：...* 斜体标题行（图片说明）
processed = processed.replace(/^\*图\s+\d+-\d+[：:][^*]*\*\s*$/gm, '');

// 3c. 展开 <details> 块：提取 mermaid 代码，删除 <details>/<summary> 包裹
processed = processed.replace(
  /<details>\s*\n\s*<summary>[^<]*<\/summary>\s*\n([\s\S]*?)<\/details>/g,
  (match, inner) => {
    // 提取 ```mermaid ... ``` 代码块
    const mermaidMatch = inner.match(/```mermaid\n([\s\S]*?)```/);
    if (mermaidMatch) {
      return '```mermaid\n' + mermaidMatch[1].trim() + '\n```';
    }
    // 如果没有 mermaid 块，保留原文本
    return inner.trim();
  }
);

// 3d. 清理多余空行（最多保留 2 个连续空行）
processed = processed.replace(/\n{4,}/g, '\n\n\n');

const removedImgs = imgMatches.length;
const mermaidBlocks = (processed.match(/```mermaid/g) || []).length;
console.log(`🔄 已移除 ${removedImgs} 个 PNG 引用，保留 ${mermaidBlocks} 个 Mermaid 图表`);
console.log(`📄 处理后 Markdown 长度: ${processed.length} 字符`);

// 4. Base64 编码
const b64 = Buffer.from(processed, 'utf8').toString('base64');
console.log(`🔐 Base64 长度: ${b64.length} 字符`);

// 5. 替换 HTML 中的 b64Data
const b64Pattern = /const b64Data = "[^"]+"/;
if (!b64Pattern.test(html)) {
  console.error('❌ 在 HTML 中找不到 const b64Data = "..." 模式');
  process.exit(1);
}

const newHtml = html.replace(b64Pattern, `const b64Data = "${b64}"`);

// 验证替换成功
if (newHtml === html) {
  console.log('⚠️  内容相同，无需更新');
  process.exit(0);
}

// 6. 写入或预览
if (dryRun) {
  console.log();
  console.log('🔍 Dry-run 模式，以下是处理后 Markdown 的前 500 字符：');
  console.log('─'.repeat(60));
  console.log(processed.substring(0, 500));
  console.log('─'.repeat(60));
  console.log();
  console.log(`✅ 预览完成。去掉 --dry-run 执行实际写入。`);
} else {
  // 备份原文件
  const backupPath = htmlPath + '.bak';
  fs.copyFileSync(htmlPath, backupPath);
  console.log(`💾 已备份: ${backupPath}`);

  fs.writeFileSync(htmlPath, newHtml, 'utf8');
  console.log();
  console.log(`✅ 同步完成！`);
  console.log(`   - 移除 ${removedImgs} 个 PNG 图片引用`);
  console.log(`   - 保留 ${mermaidBlocks} 个 Mermaid 交互图表`);
  console.log(`   - HTML 文件已更新: ${htmlPath}`);
}
