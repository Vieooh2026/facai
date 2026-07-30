#!/bin/sh
# 发财致富工作台 · 一键启动脚本
# 用法：在 facai 目录下执行  sh start.sh
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  echo "📦 正在安装依赖..."
  npm install
fi
if [ ! -f public/index.html ]; then
  echo "🔨 正在构建前端..."
  npm run build
fi
echo "💰 启动中，请用浏览器打开 http://localhost:3001"
echo "   多人协作：开多个浏览器/无痕窗口，各自注册登录即可模拟多个伙伴"
node server/index.js
