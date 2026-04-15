# AionUi

AionUi 现在是一个 **仅 WebUI 的服务端产品**。

本仓库已不再支持 Electron 桌面打包、preload 桥接、托盘/自动更新，以及桌面版与浏览器版的双轨维护。
当前唯一支持的产品形态是：

- **Linux / Docker / WebUI-only server**
- `src/server.ts` 是唯一运行入口
- `src/renderer/` 是 Web 前端
- `src/process/` 是 Node 后端 / worker / channel / service

## 唯一支持的运行方式

构建：

```bash
bun run build:renderer:web
bun run build:server
```

运行：

```bash
NODE_ENV=production ALLOW_REMOTE=true bun dist-server/server.mjs
```

重置管理员密码：

```bash
bun run resetpass
```

## Docker

构建镜像：

```bash
docker build -t aionui:webui .
```

运行容器：

```bash
docker run -d \
  --name aionui \
  -p 3000:3000 \
  -e ALLOW_REMOTE=true \
  -e DATA_DIR=/data \
  -v $(pwd)/data:/data \
  aionui:webui
```

镜像特性：

- 只运行 standalone server
- 持久化数据目录为 `/data`
- 默认暴露 `3000` 端口
- 使用非 root 用户运行
- 内置 `/api/auth/status` 健康检查

## 本地开发

安装依赖：

```bash
bun install
```

常用命令：

```bash
bun run start
bun run start:prod
bun run lint
bun run format
bun run test
bunx tsc --noEmit
```

## 文档

- `docs/development.md` — 本地开发流程
- `docs/WEBUI_GUIDE.md` — Linux / Docker / systemd 部署说明
- `docs/SERVER_DEPLOY_GUIDE.md` — 服务端部署要点

## 说明

本仓库已经有意删除 Electron 运行时与桌面打包链。
如果未来要重新支持桌面版，应当作为明确的产品决策重新设计，而不是把无人验证的旧代码继续留在仓库里。
