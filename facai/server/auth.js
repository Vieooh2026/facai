import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET = 'facai-secret-2026-change-me';
const TOKEN_EXPIRE = '30d';

export function hashPassword(pwd) {
  return bcrypt.hashSync(pwd, 10);
}

export function verifyPassword(pwd, hash) {
  return bcrypt.compareSync(pwd, hash);
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: TOKEN_EXPIRE }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

// 从请求头取出当前用户（不抛错，返回 null 表示未登录）
export function getUserFromReq(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return payload;
}
