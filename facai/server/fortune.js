// 星座运势：内置模拟数据，按 星座 + 日期 生成固定的当日建议
const SIGNS = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];

const TONE = [
  '今日精力充沛，适合推进积压的发货任务，注意核对客户收货信息避免出错。',
  '财运小旺，一笔大单可能就在今天，记得及时更新今日发货数据。',
  '沟通运佳，和伙伴协作顺畅，遇到异常订单多问一句就能化解。',
  '宜稳健不宜冒进，先把今日抖音发货清点清楚再想别的。',
  '灵感在线，适合梳理私域客户，给老客户发个温馨提醒会有意外收获。',
  '人际和谐，团队配合度高，今天的发货量有望创新高。',
  '略显急躁，处理多平台订单时慢一点，核对倍数和件数最关键。',
  '直觉靠谱，凭经验能发现数据里的异常，相信你的判断。',
  '宜复盘，抽空看看客户分析和数据对比，找准发力方向。',
  '小有波折但能化解，遇到物流延迟及时同步给伙伴和客户。'
];

const LUCKY = ['东南','正南','西南','正西','西北','正北','东北','正东','中央'];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function getFortune(sign, dateStr) {
  const signKey = SIGNS.includes(sign) ? sign : SIGNS[hashStr(sign || '') % SIGNS.length];
  const seed = hashStr(signKey + dateStr);
  return {
    sign: signKey,
    date: dateStr,
    advice: TONE[seed % TONE.length],
    luckyDir: LUCKY[seed % LUCKY.length],
    luckyNum: (seed % 9) + 1
  };
}

export { SIGNS };
