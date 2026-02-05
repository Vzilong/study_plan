# HTTP 请求封装学习笔记

> 本笔记基于 `src/utils/http.ts` 文件，帮助理解一个生产级别的 HTTP 请求封装是如何设计的。

## 一、为什么要封装 HTTP 请求？

直接使用 axios 存在以下问题：

1. **重复代码多**：每次请求都要写 baseURL、headers、错误处理
2. **维护困难**：如果要统一修改（如添加 token），需要改很多地方
3. **类型不安全**：没有统一的响应类型约束

封装后的好处：

- ✅ 统一配置，一处修改全局生效
- ✅ 统一错误处理，用户体验一致
- ✅ 类型安全，IDE 自动补全
- ✅ 代码简洁，业务层只关心数据

---

## 二、代码结构总览

```
src/utils/http.ts
├── 类型定义（ApiResponse、RequestOptions）
├── 创建 axios 实例
├── 请求拦截器（添加 token）
├── 响应拦截器（统一错误处理）
├── 错误处理函数
├── 通用请求方法（request）
└── 导出方法（get、post、put、del）
```

---

## 三、逐段代码详解

### 3.1 导入依赖

```typescript
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios'
```

**知识点**：

- `type` 关键字表示只导入类型，不导入实际代码，打包时会被移除
- 这些类型用于给函数参数和返回值添加类型约束

| 类型                         | 用途                   |
| ---------------------------- | ---------------------- |
| `AxiosInstance`              | axios 实例的类型       |
| `AxiosRequestConfig`         | 请求配置的类型         |
| `InternalAxiosRequestConfig` | 拦截器中请求配置的类型 |
| `AxiosResponse`              | 响应数据的类型         |
| `AxiosError`                 | 错误对象的类型         |

---

### 3.2 定义响应结构类型

```typescript
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}
```

**知识点**：

- 这是与后端约定的统一响应格式
- `<T = unknown>` 是泛型，`T` 代表 `data` 的具体类型
- `= unknown` 是默认值，如果不指定 T，就是 unknown 类型

**举例说明**：

```typescript
// 后端返回的用户列表
{
  "code": 200,
  "message": "success",
  "data": [
    { "id": 1, "name": "张三" },
    { "id": 2, "name": "李四" }
  ]
}

// 对应的类型就是 ApiResponse<User[]>
// 其中 T = User[]
```

---

### 3.3 扩展请求配置

```typescript
interface RequestOptions extends AxiosRequestConfig {
  showError?: boolean // 是否显示错误提示
  showLoading?: boolean // 是否显示 loading
}
```

**知识点**：

- `extends` 表示继承，RequestOptions 拥有 AxiosRequestConfig 的所有属性
- `?` 表示可选属性
- 这样我们可以在请求时传入自定义配置

---

### 3.4 创建 axios 实例

```typescript
const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})
```

**知识点**：

| 配置项    | 说明                                         |
| --------- | -------------------------------------------- |
| `baseURL` | 请求的基础路径，所有请求都会拼接这个前缀     |
| `timeout` | 超时时间（毫秒），超过 10 秒自动取消请求     |
| `headers` | 默认请求头，告诉服务器我们发送的是 JSON 格式 |

**环境变量**：

- `import.meta.env.VITE_API_BASE_URL` 从 `.env` 文件读取
- 开发环境和生产环境可以配置不同的 API 地址

---

### 3.5 请求拦截器

```typescript
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = uni.getStorageSync('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)
```

**执行时机**：每次发送请求之前

**作用**：

1. 从本地存储获取 token
2. 如果有 token，添加到请求头的 Authorization 字段
3. `Bearer` 是 JWT 认证的标准格式

**流程图**：

```
发起请求 → 请求拦截器（添加 token）→ 发送到服务器
```

---

### 3.6 响应拦截器

```typescript
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response
    // 业务成功
    if (data.code === 0 || data.code === 200) {
      return data as unknown as AxiosResponse
    }
    // 业务错误
    handleBusinessError(data)
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  (error: AxiosError) => {
    handleNetworkError(error)
    return Promise.reject(error)
  },
)
```

**执行时机**：收到服务器响应之后

**两个回调函数**：

1. 第一个：HTTP 状态码 2xx 时执行（请求成功）
2. 第二个：HTTP 状态码非 2xx 时执行（网络错误）

**业务成功 vs 业务错误**：

```
HTTP 200 + code: 200 → 业务成功，返回数据
HTTP 200 + code: 401 → 业务错误（如：未登录），弹出提示
HTTP 500           → 网络错误，弹出"服务器错误"
```

---

### 3.7 错误处理函数

#### 业务错误处理

```typescript
function handleBusinessError(data: ApiResponse): void {
  uni.showToast({ title: data.message || '请求失败', icon: 'none' })
  if (data.code === 401) {
    uni.removeStorageSync('token')
    uni.reLaunch({ url: '/pages/login/login' })
  }
}
```

**处理逻辑**：

1. 显示错误提示（后端返回的 message）
2. 如果是 401（未授权），清除 token 并跳转登录页

#### 网络错误处理

```typescript
function handleNetworkError(error: AxiosError): void {
  const messages: Record<number, string> = {
    400: '请求参数错误',
    403: '拒绝访问',
    404: '请求地址不存在',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
  }
  const status = error.response?.status
  const message = (status && messages[status]) || '网络异常，请稍后重试'
  uni.showToast({ title: message, icon: 'none' })
}
```

**知识点**：

- `Record<number, string>` 表示键是数字、值是字符串的对象
- `error.response?.status` 可选链，防止 response 为空时报错
- 根据 HTTP 状态码显示对应的中文提示

---

### 3.8 通用请求方法

```typescript
async function request<T>(config: RequestOptions): Promise<T> {
  if (config.showLoading) {
    uni.showLoading({ title: '加载中...', mask: true })
  }
  try {
    const res = (await instance.request(config)) as unknown as ApiResponse<T>
    return res.data
  } finally {
    if (config.showLoading) {
      uni.hideLoading()
    }
  }
}
```

**知识点**：

1. **泛型 `<T>`**：调用时指定返回数据的类型
2. **async/await**：异步函数，等待请求完成
3. **try/finally**：无论成功失败，finally 都会执行（用于关闭 loading）
4. **mask: true**：显示遮罩层，防止用户重复点击

**类型转换解释**：

```typescript
;(await instance.request(config)) as unknown as ApiResponse<T>
```

- 响应拦截器返回的是 `data`（ApiResponse 类型）
- 但 TypeScript 认为返回的是 AxiosResponse
- 所以需要类型断言告诉 TS 实际类型

---

### 3.9 导出的请求方法

```typescript
export function get<T>(
  url: string,
  params?: Record<string, unknown>,
  options?: RequestOptions,
): Promise<T> {
  return request<T>({ ...options, url, method: 'GET', params })
}

export function post<T, D = unknown>(
  url: string,
  data?: D,
  options?: RequestOptions,
): Promise<T> {
  return request<T>({ ...options, url, method: 'POST', data })
}
```

**参数说明**：

| 参数      | 类型           | 说明                       |
| --------- | -------------- | -------------------------- |
| `url`     | string         | 请求路径（不含 baseURL）   |
| `params`  | object         | URL 查询参数（GET 用）     |
| `data`    | D              | 请求体数据（POST/PUT 用）  |
| `options` | RequestOptions | 额外配置（showLoading 等） |

**泛型说明**：

- `T`：返回数据的类型
- `D`：请求体数据的类型（仅 POST/PUT）

---

## 四、使用示例

### 4.1 基础用法

```typescript
import { get, post } from '@/utils/http'

// 定义类型
interface User {
  id: number
  name: string
}

// GET 请求
const users = await get<User[]>('/users')
console.log(users[0].name) // 有类型提示！

// POST 请求
interface LoginParams {
  username: string
  password: string
}
interface LoginResult {
  token: string
}

const result = await post<LoginResult, LoginParams>('/login', {
  username: 'admin',
  password: '123456',
})
console.log(result.token) // 有类型提示！
```

### 4.2 带 Loading

```typescript
// 自动显示/隐藏 loading
const data = await get<Data>('/data', undefined, { showLoading: true })
```

### 4.3 带查询参数

```typescript
// GET /users?page=1&size=10
const users = await get<User[]>('/users', { page: 1, size: 10 })
```

---

## 五、数据流向图

```
┌─────────────┐
│  业务代码    │  await get<User[]>('/users')
└──────┬──────┘
       ↓
┌─────────────┐
│ request()   │  显示 loading（如果配置了）
└──────┬──────┘
       ↓
┌─────────────┐
│ 请求拦截器   │  添加 token 到 headers
└──────┬──────┘
       ↓
┌─────────────┐
│   服务器    │  处理请求，返回数据
└──────┬──────┘
       ↓
┌─────────────┐
│ 响应拦截器   │  判断 code，处理错误
└──────┬──────┘
       ↓
┌─────────────┐
│ request()   │  隐藏 loading，返回 data
└──────┬──────┘
       ↓
┌─────────────┐
│  业务代码    │  拿到 User[] 类型的数据
└─────────────┘
```

## 七、总结

这个封装的核心思想：

1. **单一职责**：每个函数只做一件事
2. **统一处理**：错误、loading 在一处处理
3. **类型安全**：泛型确保类型正确
4. **易于扩展**：通过 RequestOptions 添加新功能

掌握这个封装后，你可以：

- 理解 axios 拦截器的工作原理
- 学会 TypeScript 泛型的实际应用
- 具备封装工具函数的能力
