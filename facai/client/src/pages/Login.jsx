import { useState } from 'react';
import { api, setToken } from '../api.js';

const ZODIACS = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
const AVATARS = ['🧑','👩','👨','🧔','👩‍🦰','🧑‍🦱','👵','👴','🦊','🐼','🐯','🦁'];

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', avatar: '🧑', zodiac: '双子座' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const fn = mode === 'login' ? api.login : api.register;
      const r = await fn(form);
      setToken(r.token);
      onLogin(r.user, r.isFirstAdmin);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="logo"><span className="em">💰</span> 发财致富工作台</div>
      <div className="sub">每日发货统计 · 多人协作 · 数据同步</div>
      <form onSubmit={submit}>
        {err && (
          <div style={{ background: 'rgba(0,0,0,.25)', padding: 8, borderRadius: 8, marginBottom: 10, fontSize: 13 }}>
            {err}
          </div>
        )}
        <div className="field">
          <label>昵称</label>
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="你的昵称/名字" required />
        </div>
        <div className="field">
          <label>密码</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="登录密码" required />
        </div>
        {mode === 'register' && (
          <>
            <div className="field">
              <label>头像</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {AVATARS.map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => setForm({ ...form, avatar: a })}
                    style={{ fontSize: 20, width: 36, height: 36, borderRadius: '50%', border: form.avatar === a ? '2.5px solid #4ECDC4' : '1.5px solid rgba(255,255,255,.4)', background: 'rgba(255,255,255,.15)' }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>星座（用于每日运势建议）</label>
              <select value={form.zodiac} onChange={(e) => setForm({ ...form, zodiac: e.target.value })}>
                {ZODIACS.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </>
        )}
        <button className="btn btn-gold btn-block" disabled={busy}>
          {mode === 'login' ? '登录' : '注册并进入'}
        </button>
      </form>
      <div className="switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
        {mode === 'login' ? '还没有账号？注册成为第一个管理员' : '已有账号？去登录'}
      </div>
      <div className="hint">
        提示：第一个注册的小伙伴自动成为<b>管理员</b>，可决定后续伙伴能否修改数据、查看客户资料。
      </div>
    </div>
  );
}
