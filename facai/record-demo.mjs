import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';

const BASE = 'http://localhost:3001';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const W = 820, H = 1100; // 平板宽度，展示左侧导航文字

// 启动前清空数据库，保证每次演示都是干净状态
for (const f of ['facai.db', 'facai.db-wal', 'facai.db-shm']) {
  try { fs.rmSync('/workspace/facai/' + f); } catch {}
}

const server = spawn('node', ['server/index.js'], { cwd: '/workspace/facai', stdio: 'ignore' });
async function waitPort() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE + '/api/health'); if (r.ok) return; } catch {}
    await sleep(300);
  }
  throw new Error('server not up');
}

const log = (s) => console.log('▶ ' + s);

async function main() {
  await waitPort();
  log('server up');

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const ctxA = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: '/workspace', size: { width: W, height: H } }
  });
  const ctxB = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: '/workspace', size: { width: W, height: H } }
  });
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  const vidA = pageA.video();
  const vidB = pageB.video();

  // 平板宽度下左侧导航常驻显示，直接点击导航项即可
  const nav = async (page, label) => {
    await page.locator('.nav-item', { hasText: label }).first().click();
    await sleep(700);
  };

  // 通用：进入注册模式并注册
  const register = async (page, name) => {
    await page.fill('input[placeholder="你的昵称/名字"]', name);
    await page.fill('input[type=password]', '123456');
    await page.locator('.switch').click();
    await sleep(300);
    await page.locator('button:has-text("注册并进入")').click();
    await sleep(1200);
  };

  // ===== 段A：管理员「老板」视角 =====
  log('A: 注册管理员「老板」');
  await pageA.goto(BASE);
  await sleep(500);
  await register(pageA, '老板');

  log('A: 打开商品库，添加两个商品');
  await pageA.locator('button:has-text("📚 商品库")').click();
  await sleep(500);
  await pageA.fill('input[placeholder="商品名称"]', '牛皮豆干4斤');
  await pageA.fill('input[placeholder="单位"]', '斤');
  await pageA.locator('.lib-add button:has-text("添加")').click();
  await sleep(400);
  await pageA.fill('input[placeholder="商品名称"]', '精品礼盒');
  await pageA.fill('input[placeholder="单位"]', '盒');
  await pageA.locator('.lib-add button:has-text("添加")').click();
  await sleep(400);
  await pageA.locator('.lib-modal button:has-text("关闭")').click();
  await sleep(500);

  log('A: 今日发货 - 抖音录入（手填 + 商品库快捷选品）');
  const douyin = pageA.locator('.card', { hasText: '📱 抖音发货' });
  await douyin.locator('.add-line').nth(0).click();
  await sleep(350);
  let sec = douyin.locator('.card').nth(0);
  await sec.locator('input[list="prod-list"]').fill('牛皮豆干4斤');
  await sec.locator('input[type=number]').nth(1).fill('10');
  await sleep(300);

  await douyin.locator('.add-line').nth(0).click();
  await sleep(350);
  sec = douyin.locator('.card').nth(0);
  const row2 = sec.locator('.row').nth(1);
  await row2.locator('button:has-text("📚")').click();
  await sleep(450);
  await pageA.locator('.lib-item', { hasText: '精品礼盒' }).click();
  await sleep(450);
  await sec.locator('.row').nth(1).locator('input[type=number]').nth(1).fill('5');
  await sleep(300);

  log('A: 私域自发货 - 添加客户张三（数量/件数拆分）');
  const self = pageA.locator('.card', { hasText: '🏠 私域自发货' });
  await self.locator('button:has-text("＋ 添加客户")').click();
  await sleep(450);
  const cust = self.locator('.card').last();
  await cust.locator('input[placeholder="客户名称"]').fill('张三');
  await cust.locator('textarea').fill('北京市朝阳区幸福路1号');
  await cust.locator('input[list="prod-list"]').first().fill('精品礼盒');
  await cust.locator('input[type=number]').nth(0).fill('2');
  await cust.locator('input[type=number]').nth(1).fill('24');
  await sleep(400);

  log('A: 带货/送货/自提 - 添加客户李四');
  const carry = pageA.locator('.card', { hasText: '🚚 带货/送货/自提' });
  await carry.locator('button:has-text("＋ 添加客户")').click();
  await sleep(450);
  const carryCust = carry.locator('.card').last();
  await carryCust.locator('input[placeholder="客户名称"]').fill('李四');
  await carryCust.locator('input[list="prod-list"]').first().fill('精品礼盒');
  await carryCust.locator('input[type=number]').nth(0).fill('3');
  await sleep(400);

  log('A: 保存并同步');
  await pageA.locator('button:has-text("保存并同步给所有伙伴")').click();
  await sleep(1800);

  log('A: 客户分析 - 张三排名');
  await nav(pageA, '客户分析');
  await sleep(1500);
  log('A: 数据分析 - 柱状图');
  await nav(pageA, '数据分析');
  await sleep(1500);

  // ===== 段B：伙伴「小妹」视角 =====
  log('B: 注册伙伴「小妹」（等待开通）');
  await pageB.goto(BASE);
  await sleep(500);
  await register(pageB, '小妹');
  await sleep(1200);

  log('A: 发财伙伴 - 开通小妹，授予「修改今日发货」「查看客户资料」');
  await nav(pageA, '发财伙伴');
  await sleep(800);
  const xm = pageA.locator('.card', { hasText: '小妹' }).last();
  await xm.locator('button:has-text("开通")').click();
  await sleep(500);
  await xm.locator('.toggle:has-text("修改今日发货") .switch-ui').click();
  await sleep(500);
  await xm.locator('.toggle:has-text("查看客户资料") .switch-ui').click();
  await sleep(700);

  log('B: 小妹刷新进入，同步看到数据');
  await pageB.reload();
  await sleep(2200);

  log('B: 今日发货 - 私域自发货：默认隐藏收货信息（未授予查看权限）');
  await nav(pageB, '今日发货');
  await sleep(900);
  const selfB = pageB.locator('.card', { hasText: '🏠 私域自发货' });
  await selfB.scrollIntoViewIfNeeded();
  await sleep(1500);

  log('A: 顶部「今日自发货」大号数字数据块');
  await nav(pageA, '今日发货');
  await sleep(600);
  await pageA.evaluate(() => window.scrollTo(0, 0));
  await sleep(1500);

  log('A: 修改抖音件数 10→12 并保存（触发实时刷新 + 顶部件数变化）');
  const djEdit = pageA.locator('.card', { hasText: '📱 抖音发货' });
  const secEdit = djEdit.locator('.card').nth(0);
  await secEdit.locator('.row').nth(0).locator('input[type=number]').nth(1).fill('12');
  await pageA.locator('button:has-text("保存并同步给所有伙伴")').click();
  await sleep(1500);
  await pageA.evaluate(() => window.scrollTo(0, 0));
  await sleep(1500);

  log('B: 小妹端收到实时提醒');
  await pageB.evaluate(() => window.scrollTo(0, 0));
  await sleep(1500);

  // 关键演示：管理员为小妹开启「查看收货信息」
  log('A: 发财伙伴 - 为小妹开启「查看收货信息」');
  await nav(pageA, '发财伙伴');
  await sleep(800);
  const xm2 = pageA.locator('.card', { hasText: '小妹' }).last();
  await xm2.locator('.toggle:has-text("查看收货信息") .switch-ui').click();
  await sleep(700);

  log('B: 小妹刷新 - 现在可见私域客户的收货信息');
  await pageB.reload();
  await sleep(2200);
  await nav(pageB, '今日发货');
  await sleep(900);
  await pageB.locator('.card', { hasText: '🏠 私域自发货' }).scrollIntoViewIfNeeded();
  await sleep(1800);

  // 收尾
  await pageA.close();
  await pageB.close();
  await ctxA.close();
  await ctxB.close();

  await vidA.saveAs('/workspace/segA.webm');
  await vidB.saveAs('/workspace/segB.webm');
  await browser.close();
  server.kill();
  log('DONE: segA.webm / segB.webm 已生成');
}

main().catch((e) => { console.error('ERR', e); try { server.kill(); } catch {} process.exit(1); });
