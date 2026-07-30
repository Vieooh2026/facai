// 励志语录库 - 与发货、赚钱、努力、团队相关
const QUOTES = [
  { text: '每一件发出的货，都是通往财富的一步 🚚', author: '发财致富' },
  { text: '今天的汗水，是明天的黄金 💰', author: '每日提醒' },
  { text: '团队齐心，发货顺心 🤝', author: '团队格言' },
  { text: '稳扎稳打，日积月累必有所成 ⭐', author: '长期主义' },
  { text: '发货不停，财富不止 📦', author: '奋斗者' },
  { text: '每一个订单背后，都是一份信任 ✨', author: '客户至上' },
  { text: '把简单的事情重复做，就是不简单 🔄', author: '坚持' },
  { text: '今天的努力，是为了明天更从容的选择 🌅', author: '远见' },
  { text: '发货量不会骗人，你的付出都会被看见 👀', author: '实干家' },
  { text: '一个人可以走得快，一群人才能走得远 🏃', author: '团队精神' },
  { text: '不要小看每一件小单，聚沙成塔的力量最惊人 🏗️', author: '积累' },
  { text: '忙碌的日子最充实，发货的时刻最快乐 😊', author: '乐天派' },
  { text: '目标不是用来达成的，是用来超越的 🎯', author: '进取心' },
  { text: '每一次准时发货，都是信誉的积累 🏆', author: '品牌观' },
  { text: '困难是暂时的，但放弃会变成永久的 ❌→✅', author: '韧性' },
  { text: '好的产品自己会说话，好的服务客户会传播 📢', author: '口碑' },
  { text: '今天比昨天多发一单，就是进步 📈', author: '成长' },
  { text: '专注做好一件事，胜过平庸地做十件事 🎯', author: '专注' },
  { text: '客户的满意，就是最好的广告 ⭐⭐⭐⭐⭐', author: '服务' },
  { text: '早起的鸟儿有虫吃，早发的货儿有钱赚 🐦💰', author: '勤奋' },
  { text: '不怕慢，就怕站；持续发货就是胜利 🏁', author: '恒心' },
  { text: '细节决定成败，包装体现用心 🎁', author: '品质' },
  { text: '与其羡慕别人的成绩，不如低头默默发货 🔥', author: '行动派' },
  { text: '每一次打包都是对生活的热爱 ❤️', author: '匠心' },
  { text: '数据不会说谎，趋势不会骗人 📊', author: '理性' },
  { text: '保持好奇心，探索新渠道，发现新机会 🔍', author: '创新' },
  { text: '健康是1，其他都是后面的0 🏥', author: '平衡' },
  { text: '感恩每一位客户的选择，珍惜每一份信任 🙏', author: '感恩' },
  { text: '发货高峰不慌乱，井井有条显专业 💼', author: '从容' },
  { text: '记录每一天的数据，见证自己的成长轨迹 📝', author: '复盘' },
  { text: '好习惯成就大事业，从每日盘点开始 ✓', author: '自律' },
  { text: '遇到问题解决问题，而不是抱怨问题 🛠️', author: '解决者' },
  { text: '你的时间花在哪里，你的收获就在哪里 ⏰', author: '投资' },
  { text: '微笑着面对每一个挑战，它会被你感染 😄', author: '乐观' },
  { text: '学习新技能，开拓新思路，永远在路上 📚', author: '学习' },
  { text: '质量是生命线，效率是竞争力 ⚡', author: '标准' },
  { text: '和伙伴们一起奋斗的日子，是最珍贵的记忆 📸', author: '情谊' },
  { text: '今天的目标完成了没？没有的话加油冲！🔥', author: '自驱' },
  { text: '每一笔收入都值得庆祝，每一份付出都有意义 🎉', author: '正念' },
  { text: '用数据说话，用结果证明实力 📈', author: '实证' },
  { text: '休息是为了走更长的路，别忘给自己充电 🔋', author: '节奏' },
  { text: '真诚待人，用心做事，好运自然来 🍀', author: '因果' },
  { text: '把发货当成艺术，每个包裹都是作品 🎨', author: '态度' },
  { text: '不和别人比，只和昨天的自己比 🔄', author: '内省' },
  { text: '风雨之后见彩虹，坚持到底有回报 🌈', author: '希望' },
  { text: '你是自己人生的CEO，好好经营每一天 👔', author: '主人翁' },
  { text: '发货顺利，财源广进，万事如意！🧧', author: '祝福' }
];

/**
 * 根据日期获取当日励志语录（同一天固定返回同一句）
 * @param {string} dateStr - 格式 YYYY-MM-DD
 * @returns {{ text: string, author: string }}
 */
export function getDailyQuote(dateStr) {
  // 用日期字符串的简单哈希确定索引，确保同一天固定
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % QUOTES.length;
  return QUOTES[index];
}

/**
 * 获取随机励志语录（用于登录/欢迎场景）
 */
export function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

export default QUOTES;
