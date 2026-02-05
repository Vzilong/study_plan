<!-- AIGC:cursor|author:乌云|lines:120|dates:2026-02 -->

# Vue3 学习项目

基于 uni-app + Vue3 + TypeScript 的学习演示项目，包含 HTTP 封装和 Vue3 响应式原理的学习笔记与交互式演示。

## 技术栈

- uni-app 3.0
- Vue 3.4
- TypeScript 4.9
- Vite 5.2
- pnpm

## 项目结构

```
├── docs/                          # 学习笔记
│   ├── http-封装学习笔记.md        # HTTP 请求封装笔记
│   └── vue3-响应式原理学习笔记.md   # Vue3 响应式原理笔记
├── src/
│   ├── pages/
│   │   ├── index/                 # 首页
│   │   └── demo/
│   │       ├── http-demo.vue      # HTTP 请求演示
│   │       └── reactive-demo.vue  # Vue3 响应式演示
│   └── utils/
│       └── http.ts                # HTTP 请求封装
├── .env                           # 环境变量
├── .env.development               # 开发环境变量
└── .env.production                # 生产环境变量
```

## 快速开始

```bash
# 安装依赖
pnpm install

# H5 开发
pnpm dev:h5

# 微信小程序开发
pnpm dev:mp-weixin

# H5 构建
pnpm build:h5

# 微信小程序构建
pnpm build:mp-weixin
```

## 功能模块

### 1. HTTP 请求封装

基于 uni.request 的请求封装，支持：

- 请求/响应拦截器
- 统一错误处理
- 环境变量配置
- TypeScript 类型支持

详见：[HTTP 封装学习笔记](./docs/http-封装学习笔记.md)

### 2. Vue3 响应式原理演示

包含 7 个交互式演示：

- `reactive()` - 深层响应式对象
- `ref()` - 响应式引用
- `computed()` - 计算属性缓存
- `watch()` - 显式监听
- `watchEffect()` - 自动依赖收集
- `toRefs()` - 解构保持响应式
- 手写响应式 - track/trigger 原理演示

详见：[Vue3 响应式原理学习笔记](./docs/vue3-响应式原理学习笔记.md)

## 支持平台

- H5
- 微信小程序
- 支付宝小程序
- 百度小程序
- 抖音小程序
- QQ 小程序
- 快手小程序
- 京东小程序
- 鸿蒙
- App (iOS/Android)

## 开发命令

| 命令                   | 说明                |
| ---------------------- | ------------------- |
| `pnpm dev:h5`          | H5 开发模式         |
| `pnpm dev:mp-weixin`   | 微信小程序开发      |
| `pnpm build:h5`        | H5 生产构建         |
| `pnpm build:mp-weixin` | 微信小程序构建      |
| `pnpm type-check`      | TypeScript 类型检查 |

## License

MIT
