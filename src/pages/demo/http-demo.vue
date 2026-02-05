<!-- AIGC:cursor|author:乌云|lines:70|dates:2026-02 -->
<template>
  <view class="container">
    <view class="title">HTTP 请求示例</view>

    <button @click="fetchUsers">获取用户列表 (GET)</button>

    <view v-if="users.length" class="result">
      <view class="subtitle">用户列表：</view>
      <view v-for="user in users" :key="user.id" class="user-item">
        {{ user.name }} - {{ user.email }}
      </view>
    </view>

    <button @click="handleLogin" class="mt-20">模拟登录 (POST)</button>

    <view v-if="loginResult" class="result">
      <view class="subtitle">登录结果：</view>
      <text>Token: {{ loginResult.token }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { get, post } from '@/utils/http'

// 定义类型
interface User {
  id: number
  name: string
  email: string
}

interface LoginParams {
  username: string
  password: string
}

interface LoginResult {
  token: string
  user: User
}

// 响应式数据
const users = ref<User[]>([])
const loginResult = ref<LoginResult | null>(null)

// GET 请求示例
async function fetchUsers() {
  users.value = await get<User[]>('/users', undefined, { showLoading: true })
}

// POST 请求示例
async function handleLogin() {
  loginResult.value = await post<LoginResult, LoginParams>(
    '/login',
    { username: 'admin', password: '123456' },
    { showLoading: true },
  )
}
</script>

<style scoped>
.container {
  padding: 30rpx;
}
.title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
}
.subtitle {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
}
.result {
  margin-top: 20rpx;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
}
.user-item {
  padding: 10rpx 0;
  border-bottom: 1rpx solid #eee;
}
.mt-20 {
  margin-top: 40rpx;
}
</style>
