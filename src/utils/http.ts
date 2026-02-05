// AIGC:cursor|author:乌云|lines:95|dates:2026-02
/**
 * 简洁版 HTTP 封装（单文件最佳实践）
 * 当前项目使用 ./http 目录下的解耦方案，此文件仅供参考学习
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios'

/** 统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 请求配置扩展（可添加自定义配置） */
interface RequestOptions extends AxiosRequestConfig {
  /** 是否显示错误提示，默认 true */
  showError?: boolean
  /** 是否显示 loading，默认 false */
  showLoading?: boolean
}

/** 创建 axios 实例 */
const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/** 请求拦截器 */
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

/** 响应拦截器 */
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

/** 处理业务错误 */
function handleBusinessError(data: ApiResponse): void {
  uni.showToast({ title: data.message || '请求失败', icon: 'none' })
  // 登录过期
  if (data.code === 401) {
    uni.removeStorageSync('token')
    uni.reLaunch({ url: '/pages/login/login' })
  }
}

/** 处理网络错误 */
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

/** 通用请求方法 */
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

/** GET 请求 */
export function get<T>(
  url: string,
  params?: Record<string, unknown>,
  options?: RequestOptions,
): Promise<T> {
  return request<T>({ ...options, url, method: 'GET', params })
}

/** POST 请求 */
export function post<T, D = unknown>(
  url: string,
  data?: D,
  options?: RequestOptions,
): Promise<T> {
  return request<T>({ ...options, url, method: 'POST', data })
}

/** PUT 请求 */
export function put<T, D = unknown>(
  url: string,
  data?: D,
  options?: RequestOptions,
): Promise<T> {
  return request<T>({ ...options, url, method: 'PUT', data })
}

/** DELETE 请求 */
export function del<T>(
  url: string,
  params?: Record<string, unknown>,
  options?: RequestOptions,
): Promise<T> {
  return request<T>({ ...options, url, method: 'DELETE', params })
}

export { instance as http }

// 使用示例：
// import { get, post } from '@/utils/http-simple'
//
// // 基础用法
// const users = await get<User[]>('/users')
// const result = await post<LoginResult, LoginParams>('/login', { username, password })
//
// // 带 loading
// const data = await get<Data>('/data', {}, { showLoading: true })
