<template>
  <view class="content">
    <image class="logo" src="/static/logo.png" />
    <view class="text-area">
      <text class="title">{{ title }}</text>
    </view>
    <button class="nav-btn" @click="goHttpDemo">HTTP 请求示例</button>
    <button class="nav-btn" @click="goReactiveDemo">Vue3 响应式演示</button>
  </view>
</template>

<script setup lang="ts">
// AIGC:cursor|author:乌云|lines:8|dates:2026-02
import { ref } from 'vue'
const title = ref('Hello')

function goHttpDemo() {
  uni.navigateTo({ url: '/pages/demo/http-demo' })
}

function goReactiveDemo() {
  uni.navigateTo({ url: '/pages/demo/reactive-demo' })
}
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin-top: 200rpx;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 50rpx;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}

.nav-btn {
  margin-top: 40rpx;
}
</style>
