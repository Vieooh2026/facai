// 金币音效 - 使用 Web Audio API 纯合成，无需外部音频文件

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // 处理浏览器自动播放策略：如果处于 suspended 状态则 resume
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * 播放金币"叮~"音效
 * 清脆的高频正弦波 + 泛音 + 快速衰减，模拟金币掉落/到账的声音
 */
export function playCoinSound() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // 主音：高频正弦波，模拟金币清脆声
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1400, now);
    osc1.frequency.exponentialRampToValueAtTime(2200, now + 0.08); // 快速上滑
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // 泛音1：更高频的三角波，增加金属感
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2800, now);
    osc2.frequency.exponentialRampToValueAtTime(3600, now + 0.05);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.18);

    // 泛音2：中频正弦波，增加厚度
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(900, now + 0.02);
    osc3.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
    gain3.gain.setValueAtTime(0.12, now + 0.02);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc3.connect(gain3).connect(ctx.destination);
    osc3.start(now + 0.02);
    osc3.stop(now + 0.28);
  } catch (e) {
    // 静默失败（某些浏览器可能不支持 Web Audio API）
    console.debug('音效播放失败:', e.message);
  }
}

/**
 * 播放成功提示音（比金币音更低沉、更温暖）
 * 用于保存成功等场景
 */
export function playSuccessSound() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // 上升三和弦感觉
    const freqs = [523.25, 659.25, 783.99]; // C5 E5 G5
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02 + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.06);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + 0.5 + i * 0.06);
    });
  } catch (e) {
    console.debug('音效播放失败:', e.message);
  }
}

/**
 * 播放通知提示音（短促柔和的"叮咚"）
 * 用于 WebSocket 实时消息通知
 */
export function playNotifySound() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // 第一声"叮"
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(1000, now + 0.15);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // 第二声"咚"
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(800, now + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(600, now + 0.3);
    gain2.gain.setValueAtTime(0.2, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.4);
  } catch (e) {
    console.debug('音效播放失败:', e.message);
  }
}
