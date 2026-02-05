<!-- AIGC:cursor|author:乌云|lines:180|dates:2026-02 -->
<template>
  <view class="container">
    <view class="title">Vue3 响应式原理演示</view>
    <!-- 1. reactive -->
    <view class="section">
      <view class="section-title">1. reactive() 演示</view>
      <view class="desc">reactive 用于创建响应式对象，支持深层响应</view>
      <view class="demo-box">
        <view class="info">姓名：{{ state.user.name }}</view>
        <view class="info">年龄：{{ state.user.age }}</view>
        <view class="info">城市：{{ state.user.address.city }}</view>
        <view class="btn-group">
          <button size="mini" @click="changeReactiveName">修改姓名</button>
          <button size="mini" @click="changeReactiveAge">年龄+1</button>
          <button size="mini" @click="changeReactiveCity">修改城市</button>
        </view>
      </view>
    </view>
    <!-- 2. ref -->
    <view class="section">
      <view class="section-title">2. ref() 演示</view>
      <view class="desc">ref 用于创建响应式引用，可包装任意类型</view>
      <view class="demo-box">
        <view class="info">计数器：{{ count }}</view>
        <view class="info">消息：{{ message }}</view>
        <view class="btn-group">
          <button size="mini" @click="count++">count++</button>
          <button size="mini" @click="count--">count--</button>
          <button size="mini" @click="changeMessage">修改消息</button>
        </view>
      </view>
    </view>
    <!-- 3. computed -->
    <view class="section">
      <view class="section-title">3. computed() 演示</view>
      <view class="desc">computed 创建计算属性，具有缓存特性</view>
      <view class="demo-box">
        <view class="info">firstName：{{ firstName }}</view>
        <view class="info">lastName：{{ lastName }}</view>
        <view class="info">fullName（计算属性）：{{ fullName }}</view>
        <view class="info">计算次数：{{ computeCount }}</view>
        <view class="btn-group">
          <button size="mini" @click="changeFirstName">改姓</button>
          <button size="mini" @click="changeLastName">改名</button>
          <button size="mini" @click="readFullName">读取fullName</button>
        </view>
      </view>
    </view>
    <!-- 4. watch -->
    <view class="section">
      <view class="section-title">4. watch() 演示</view>
      <view class="desc">watch 显式监听数据变化，可获取新旧值</view>
      <view class="demo-box">
        <view class="info">监听值：{{ watchValue }}</view>
        <view class="info">监听日志：</view>
        <view class="log-box">
          <view v-for="(log, idx) in watchLogs" :key="idx" class="log-item">{{
            log
          }}</view>
        </view>
        <view class="btn-group">
          <button size="mini" @click="watchValue++">值+1</button>
          <button size="mini" @click="watchValue += 10">值+10</button>
          <button size="mini" @click="clearWatchLogs">清空日志</button>
        </view>
      </view>
    </view>
    <!-- 5. watchEffect -->
    <view class="section">
      <view class="section-title">5. watchEffect() 演示</view>
      <view class="desc">watchEffect 自动收集依赖，立即执行</view>
      <view class="demo-box">
        <view class="info">数值A：{{ valueA }}</view>
        <view class="info">数值B：{{ valueB }}</view>
        <view class="info">watchEffect 执行日志：</view>
        <view class="log-box">
          <view v-for="(log, idx) in effectLogs" :key="idx" class="log-item">{{
            log
          }}</view>
        </view>
        <view class="btn-group">
          <button size="mini" @click="valueA++">A+1</button>
          <button size="mini" @click="valueB++">B+1</button>
          <button size="mini" @click="clearEffectLogs">清空日志</button>
        </view>
      </view>
    </view>
    <!-- 6. toRefs -->
    <view class="section">
      <view class="section-title">6. toRefs() 演示</view>
      <view class="desc">toRefs 解决解构丢失响应式的问题</view>
      <view class="demo-box">
        <view class="info">原始对象 person.name：{{ person.name }}</view>
        <view class="info">解构后 name：{{ personName }}</view>
        <view class="info">解构后 age：{{ personAge }}</view>
        <view class="btn-group">
          <button size="mini" @click="personName = '王五'">
            修改解构的name
          </button>
          <button size="mini" @click="personAge++">解构的age+1</button>
          <button size="mini" @click="person.name = '赵六'">
            修改原对象name
          </button>
        </view>
      </view>
    </view>
    <!-- 7. 手写响应式 -->
    <view class="section">
      <view class="section-title">7. 手写响应式原理演示</view>
      <view class="desc">展示依赖收集和触发更新的过程</view>
      <view class="demo-box">
        <view class="info">手写响应式数据：{{ customReactiveData }}</view>
        <view class="info">执行日志：</view>
        <view class="log-box">
          <view v-for="(log, idx) in customLogs" :key="idx" class="log-item">{{
            log
          }}</view>
        </view>
        <view class="btn-group">
          <button size="mini" @click="runCustomReactive">运行演示</button>
          <button size="mini" @click="clearCustomLogs">清空日志</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, watchEffect, toRefs } from 'vue'

// 1. reactive
const state = reactive({
  user: { name: '张三', age: 20, address: { city: '北京' } },
})
const names = ['李四', '王五', '赵六', '张三']
let nameIdx = 0
const changeReactiveName = () => {
  state.user.name = names[nameIdx++ % names.length]!
}
const changeReactiveAge = () => {
  state.user.age++
}
const cities = ['上海', '广州', '深圳', '北京']
let cityIdx = 0
const changeReactiveCity = () => {
  state.user.address.city = cities[cityIdx++ % cities.length]!
}

// 2. ref
const count = ref(0)
const message = ref('Hello Vue3!')
const msgs = ['你好世界！', 'Vue3 真棒！', '响应式原理', 'Hello Vue3!']
let msgIdx = 0
const changeMessage = () => {
  message.value = msgs[msgIdx++ % msgs.length]!
}

// 3. computed
const firstName = ref('张')
const lastName = ref('三')
const computeCount = ref(0)
const fullName = computed(() => {
  computeCount.value++
  return firstName.value + lastName.value
})
const fns = ['李', '王', '赵', '张']
let fnIdx = 0
const changeFirstName = () => {
  firstName.value = fns[fnIdx++ % fns.length]!
}
const lns = ['四', '五', '六', '三']
let lnIdx = 0
const changeLastName = () => {
  lastName.value = lns[lnIdx++ % lns.length]!
}
const readFullName = () => {
  console.log('读取 fullName:', fullName.value)
}

// 4. watch
const watchValue = ref(0)
const watchLogs = ref<string[]>([])
watch(watchValue, (n, o) => {
  watchLogs.value.push(`值变化: ${o} → ${n}`)
})
const clearWatchLogs = () => {
  watchLogs.value = []
}

// 5. watchEffect
const valueA = ref(1)
const valueB = ref(100)
const effectLogs = ref<string[]>([])
watchEffect(() => {
  effectLogs.value.push(`watchEffect: A=${valueA.value}, B=${valueB.value}`)
})
const clearEffectLogs = () => {
  effectLogs.value = []
}

// 6. toRefs
const person = reactive({ name: '张三', age: 20 })
const { name: personName, age: personAge } = toRefs(person)

// 7. 手写响应式
const customReactiveData = ref('')
const customLogs = ref<string[]>([])
const addLog = (m: string) => {
  customLogs.value.push(m)
}
const runCustomReactive = () => {
  customLogs.value = []
  addLog('=== 开始手写响应式演示 ===')
  const targetMap = new WeakMap()
  let activeEffect: (() => void) | null = null
  const track = (t: object, k: string | symbol) => {
    if (!activeEffect) return
    let dm = targetMap.get(t)
    if (!dm) targetMap.set(t, (dm = new Map()))
    let d = dm.get(k)
    if (!d) dm.set(k, (d = new Set()))
    d.add(activeEffect)
    addLog(`📥 track: 收集依赖 [${String(k)}]`)
  }
  const trigger = (t: object, k: string | symbol) => {
    const dm = targetMap.get(t)
    if (!dm) return
    const d = dm.get(k)
    if (!d) return
    addLog(`📤 trigger: 触发更新 [${String(k)}]`)
    d.forEach((e: () => void) => e())
  }
  const myReactive = <T extends object>(t: T): T =>
    new Proxy(t, {
      get(target, key, receiver) {
        addLog(`🔍 get: [${String(key)}]`)
        track(target, key)
        return Reflect.get(target, key, receiver)
      },
      set(target, key, value, receiver) {
        addLog(`✏️ set: [${String(key)}]=${value}`)
        const res = Reflect.set(target, key, value, receiver)
        trigger(target, key)
        return res
      },
    })
  const myEffect = (fn: () => void) => {
    activeEffect = fn
    addLog('🚀 effect 执行')
    fn()
    activeEffect = null
  }
  addLog('--- 创建响应式对象 ---')
  const data = myReactive({ count: 0 })
  addLog('--- 注册 effect ---')
  myEffect(() => {
    customReactiveData.value = `count = ${data.count}`
  })
  addLog('--- 修改数据 count=1 ---')
  data.count = 1
  addLog('--- 修改数据 count=2 ---')
  data.count = 2
  addLog('=== 演示结束 ===')
}
const clearCustomLogs = () => {
  customLogs.value = []
  customReactiveData.value = ''
}
</script>

<style scoped>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}
.title {
  font-size: 40rpx;
  font-weight: bold;
  text-align: center;
  padding: 30rpx 0;
  color: #333;
}
.section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
}
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #42b883;
  margin-bottom: 12rpx;
}
.desc {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
}
.demo-box {
  background-color: #f9f9f9;
  border-radius: 12rpx;
  padding: 20rpx;
}
.info {
  font-size: 28rpx;
  color: #333;
  padding: 8rpx 0;
}
.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 20rpx;
}
.btn-group button {
  background-color: #42b883;
  color: #fff;
  border: none;
  font-size: 24rpx;
}
.log-box {
  background-color: #1e1e1e;
  border-radius: 8rpx;
  padding: 16rpx;
  margin-top: 12rpx;
  max-height: 300rpx;
  overflow-y: auto;
}
.log-item {
  font-size: 22rpx;
  color: #4ec9b0;
  font-family: monospace;
  line-height: 1.6;
}
</style>
