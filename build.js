/*
 * Qazr 音频剪辑软件 — 单文件打包脚本
 * ------------------------------------------------------------------
 * 把 index.html + css/style.css + vendor/lamejs.iife.js
 * + js/dsp.js + js/engine.js + js/codec.js + js/app.js
 * 内联为一个自包含的 HTML 文件，双击即可离线使用。
 *
 * 用法：node build.js
 * 产物：dist/Qazr音频剪辑.html
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

/* 顺序：lamejs（MP3 编码器，LGPL）→ DSP → 引擎 → 编码封装 → 主程序 */
const JS_FILES = [
  'vendor/lamejs.iife.js',
  'js/dsp.js',
  'js/engine.js',
  'js/codec.js',
  'js/app.js'
];

const html = read('index.html');
const css = read('css/style.css');
const scripts = JS_FILES.map(read);

for (const src of scripts) {
  if (src.includes('</script')) {
    throw new Error('脚本中包含 </script 字面量，无法安全内联');
  }
}

/* LAME / lamejs 的授权声明（LGPL-3.0） */
const credit = `
<!--
  MP3 编码使用 lamejs（LAME 的 JavaScript 移植，LGPL-3.0）。
  授权与源码：https://github.com/shijinyu/lamejs  |  https://lame.sourceforge.io/
  本文件未修改 lamejs 源码，仅作为独立模块内联。
-->
`;

let out = html.replace(
  /<link\s+rel="stylesheet"\s+href="css\/style\.css"\s*>/,
  () => credit + '<style>\n' + css + '\n</style>'
);

out = out.replace(
  /<script\s+src="js\/dsp\.js"><\/script>\s*<script\s+src="js\/engine\.js"><\/script>\s*<script\s+src="js\/codec\.js"><\/script>\s*<script\s+src="js\/app\.js"><\/script>/,
  () => scripts.map((s) => '<script>\n' + s + '\n</script>').join('\n')
);

if (out.includes('href="css/style.css"') || out.includes('src="js/app.js"')) {
  throw new Error('内联失败：仍存在外部资源引用');
}

const distDir = path.join(root, 'dist');
fs.mkdirSync(distDir, { recursive: true });
const target = path.join(distDir, 'Qazr音频剪辑.html');
fs.writeFileSync(target, out, 'utf8');

const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(1);
console.log('打包完成 -> ' + target + '  (' + kb + ' KB)');
