FROM node:22-bookworm

WORKDIR /app

# 持久数据目录（Render 磁盘挂载点）
RUN mkdir -p /app/data

# better-sqlite3 需要系统编译工具
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# 构建前端（输出到 /app/public，服务端直接托管）
RUN npm run build

ENV PORT=3001
ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "start"]
