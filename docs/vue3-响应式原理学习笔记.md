<!-- AIGC:cursor|author:乌云|lines:350|dates:2026-02 -->

# Vue3 响应式原理学习笔记

> 本笔记旨在帮助学生深入理解 Vue3 响应式系统的核心原理，从基础概念到源码实现，循序渐进。

---

## 目录

1. [什么是响应式](#1-什么是响应式)
2. [Vue2 vs Vue3 响应式对比](#2-vue2-vs-vue3-响应式对比)
3. [Proxy 基础知识](#3-proxy-基础知识)
4. [Reflect 的作用](#4-reflect-的作用)
5. [响应式核心 API](#5-响应式核心-api)
6. [依赖收集与触发更新](#6-依赖收集与触发更新)
7. [手写简易响应式系统](#7-手写简易响应式系统)
8. [Vue3 源码解析](#8-vue3-源码解析)
9. [常见面试题](#9-常见面试题)
10. [总结](#10-总结)

---

## 1. 什么是响应式

### 1.1 通俗理解

想象你有一个 Excel 表格：

- A1 单元格填入数字 `10`
- B1 单元格填入公式 `=A1 * 2`，显示 `20`
- 当你修改 A1 为 `20` 时，B1 **自动**变成 `40`

这就是**响应式**！数据变化时，依赖这个数据的地方会**自动更新**。

### 1.2 在 Vue 中的体现

```javascript
const state = reactive({ count: 0 })

// 视图中使用 {{ state.count }}
// 当 state.count 变化时，视图自动更新
state.count++ // 视图自动显示 1
```

### 1.3 响应式的本质

响应式系统需要解决两个核心问题：

1. **如何知道数据被读取了？** → 依赖收集
2. **如何知道数据被修改了？** → 触发更新

---

## 2. Vue2 vs Vue3 响应式对比

### 2.1 Vue2 的实现方式：Object.defineProperty

```javascript
// Vue2 响应式原理简化版
function defineReactive(obj, key, val) {
  Object.defineProperty(obj, key, {
    get() {
      console.log(`读取 ${key}`)
      return val
    },
    set(newVal) {
      console.log(`设置 ${key} = ${newVal}`)
      val = newVal
      // 触发更新...
    },
  })
}

const data = { name: '张三' }
defineReactive(data, 'name', data.name)

data.name // 输出：读取 name
data.name = '李四' // 输出：设置 name = 李四
```

### 2.2 Vue2 的局限性

| 问题                 | 说明                              | 解决方案                    |
| -------------------- | --------------------------------- | --------------------------- |
| 无法检测属性新增     | `obj.newKey = value` 不会触发更新 | 使用 `Vue.set()`            |
| 无法检测属性删除     | `delete obj.key` 不会触发更新     | 使用 `Vue.delete()`         |
| 无法检测数组索引修改 | `arr[0] = newValue` 不会触发更新  | 使用 `Vue.set()` 或数组方法 |
| 无法检测数组长度修改 | `arr.length = 0` 不会触发更新     | 使用 `splice()`             |
| 初始化性能问题       | 需要递归遍历所有属性              | 无                          |

### 2.3 Vue3 的实现方式：Proxy

```javascript
// Vue3 响应式原理简化版
const data = { name: '张三' }

const proxy = new Proxy(data, {
  get(target, key) {
    console.log(`读取 ${key}`)
    return target[key]
  },
  set(target, key, value) {
    console.log(`设置 ${key} = ${value}`)
    target[key] = value
    return true
  },
})

proxy.name // 输出：读取 name
proxy.name = '李四' // 输出：设置 name = 李四
proxy.age = 18 // 输出：设置 age = 18 ✅ 新增属性也能检测！
```

### 2.4 Vue3 的优势

| 优势                 | 说明                   |
| -------------------- | ---------------------- |
| ✅ 检测属性新增/删除 | Proxy 可以拦截所有操作 |
| ✅ 检测数组索引修改  | 原生支持               |
| ✅ 更好的性能        | 惰性代理，用到才转换   |
| ✅ 更完整的拦截      | 支持 13 种拦截操作     |

---

## 3. Proxy 基础知识

### 3.1 什么是 Proxy

Proxy（代理）是 ES6 新增的特性，可以创建一个对象的代理，从而拦截和自定义对象的基本操作。

```javascript
const proxy = new Proxy(target, handler)
// target: 要代理的原始对象
// handler: 定义拦截行为的对象
```

### 3.2 常用的拦截操作（handler）

| 拦截方法                            | 触发时机        | 示例                 |
| ----------------------------------- | --------------- | -------------------- |
| `get(target, key, receiver)`        | 读取属性        | `proxy.name`         |
| `set(target, key, value, receiver)` | 设置属性        | `proxy.name = 'xxx'` |
| `has(target, key)`                  | `in` 操作符     | `'name' in proxy`    |
| `deleteProperty(target, key)`       | `delete` 操作符 | `delete proxy.name`  |
| `ownKeys(target)`                   | 遍历            | `Object.keys(proxy)` |

### 3.3 完整示例

```javascript
const person = {
  name: '张三',
  age: 20,
}

const proxy = new Proxy(person, {
  // 拦截读取
  get(target, key, receiver) {
    console.log(`🔍 读取属性: ${key}`)
    return target[key]
  },

  // 拦截设置
  set(target, key, value, receiver) {
    console.log(`✏️ 设置属性: ${key} = ${value}`)
    target[key] = value
    return true // 必须返回 true 表示设置成功
  },

  // 拦截 in 操作符
  has(target, key) {
    console.log(`❓ 检查属性: ${key}`)
    return key in target
  },

  // 拦截 delete
  deleteProperty(target, key) {
    console.log(`🗑️ 删除属性: ${key}`)
    delete target[key]
    return true
  },
})

// 测试
proxy.name // 🔍 读取属性: name
proxy.name = '李四' // ✏️ 设置属性: name = 李四
'age' in proxy // ❓ 检查属性: age
delete proxy.age // 🗑️ 删除属性: age
```

### 3.4 Proxy 的特点

1. **代理的是整个对象**，而不是某个属性
2. **返回的是新对象**，操作代理对象才会触发拦截
3. **支持数组**，数组的索引访问和方法调用都能拦截
4. **惰性代理**，只有访问到的属性才会被处理

---

## 4. Reflect 的作用

### 4.1 什么是 Reflect

Reflect 是 ES6 新增的内置对象，提供了操作对象的方法。它与 Proxy 的 handler 方法一一对应。

### 4.2 为什么要用 Reflect

#### 问题场景：this 指向问题

```javascript
const parent = {
  name: '父对象',
  get greeting() {
    return `Hello, ${this.name}`
  },
}

const child = {
  name: '子对象',
}

// 让 child 继承 parent
Object.setPrototypeOf(child, parent)

// 创建代理
const proxy = new Proxy(child, {
  get(target, key) {
    console.log(`读取: ${key}`)
    return target[key] // ❌ 问题在这里！
  },
})

console.log(proxy.greeting)
// 输出：Hello, 父对象
// 期望：Hello, 子对象
```

#### 使用 Reflect 解决

```javascript
const proxy = new Proxy(child, {
  get(target, key, receiver) {
    console.log(`读取: ${key}`)
    return Reflect.get(target, key, receiver) // ✅ 正确！
  },
})

console.log(proxy.greeting)
// 输出：Hello, 子对象 ✅
```

### 4.3 receiver 参数的作用

`receiver` 表示代理对象本身（或继承代理的对象），用于保证 `this` 指向正确。

```javascript
Reflect.get(target, key, receiver)
// 相当于：target[key]，但 this 会指向 receiver
```

### 4.4 Reflect 的优势

| 优势          | 说明                                      |
| ------------- | ----------------------------------------- |
| 返回值更合理  | 操作失败返回 `false`，而不是抛出错误      |
| 函数式操作    | `Reflect.has(obj, key)` 代替 `key in obj` |
| 与 Proxy 配合 | 方法一一对应，配合使用更自然              |
| this 绑定正确 | 通过 receiver 参数保证 this 指向          |

### 4.5 Vue3 中的使用

```javascript
// Vue3 源码中的写法
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    track(target, key) // 依赖收集
    return res
  },
  set(target, key, value, receiver) {
    const result = Reflect.set(target, key, value, receiver)
    trigger(target, key) // 触发更新
    return result
  },
})
```

---

## 5. 响应式核心 API

### 5.1 reactive()

将对象转换为响应式代理，深层转换。

```javascript
import { reactive } from 'vue'

const state = reactive({
  user: {
    name: '张三',
    address: {
      city: '北京',
    },
  },
  list: [1, 2, 3],
})

// 深层响应式
state.user.name = '李四' // ✅ 触发更新
state.user.address.city = '上海' // ✅ 触发更新
state.list[0] = 100 // ✅ 触发更新
state.list.push(4) // ✅ 触发更新
```

#### reactive 的限制

```javascript
// ❌ 只能代理对象类型
const count = reactive(0) // 不起作用！

// ❌ 解构会丢失响应式
const { name } = state.user
name = '李四' // 不会触发更新！

// ❌ 重新赋值会丢失响应式
let state = reactive({ count: 0 })
state = { count: 1 } // 丢失响应式！
```

### 5.2 ref()

创建一个响应式引用，可以包装任意类型的值。

```javascript
import { ref } from 'vue'

// 基本类型
const count = ref(0)
console.log(count.value) // 0
count.value++ // 触发更新

// 对象类型（内部会调用 reactive）
const user = ref({ name: '张三' })
user.value.name = '李四' // 触发更新
```

#### ref 的特点

```javascript
// 1. 通过 .value 访问
const count = ref(0)
count.value // 读取
count.value = 1 // 修改

// 2. 在模板中自动解包（不需要 .value）
// <template>{{ count }}</template>

// 3. 在 reactive 中自动解包
const state = reactive({
  count: ref(0),
})
state.count // 直接访问，不需要 .value
```

### 5.3 ref vs reactive 对比

| 特性       | ref           | reactive      |
| ---------- | ------------- | ------------- |
| 数据类型   | 任意类型      | 仅对象类型    |
| 访问方式   | `.value`      | 直接访问      |
| 重新赋值   | ✅ 可以       | ❌ 丢失响应式 |
| 解构       | ❌ 丢失响应式 | ❌ 丢失响应式 |
| 模板中使用 | 自动解包      | 直接使用      |

### 5.4 toRef() 和 toRefs()

解决解构丢失响应式的问题。

```javascript
import { reactive, toRef, toRefs } from 'vue'

const state = reactive({
  name: '张三',
  age: 20,
})

// toRef：转换单个属性
const nameRef = toRef(state, 'name')
nameRef.value = '李四' // ✅ 会同步修改 state.name

// toRefs：转换所有属性
const { name, age } = toRefs(state)
name.value = '王五' // ✅ 会同步修改 state.name
```

### 5.5 computed()

创建计算属性，具有缓存特性。

```javascript
import { ref, computed } from 'vue'

const firstName = ref('张')
const lastName = ref('三')

// 只读计算属性
const fullName = computed(() => {
  console.log('计算执行')
  return firstName.value + lastName.value
})

console.log(fullName.value) // 张三（计算执行）
console.log(fullName.value) // 张三（使用缓存，不会重新计算）

firstName.value = '李'
console.log(fullName.value) // 李三（依赖变化，重新计算）

// 可写计算属性
const fullName2 = computed({
  get: () => firstName.value + lastName.value,
  set: (val) => {
    firstName.value = val[0]
    lastName.value = val.slice(1)
  },
})
```

### 5.6 watch() 和 watchEffect()

```javascript
import { ref, watch, watchEffect } from 'vue'

const count = ref(0)

// watch：显式指定监听源
watch(count, (newVal, oldVal) => {
  console.log(`count: ${oldVal} -> ${newVal}`)
})

// watchEffect：自动收集依赖
watchEffect(() => {
  console.log(`count is: ${count.value}`)
})
// 立即执行一次，之后 count 变化时自动执行
```

---

## 6. 依赖收集与触发更新

### 6.1 核心概念图解

```
┌─────────────────────────────────────────────────────────────┐
│                      响应式系统工作流程                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐    读取属性     ┌──────────────┐             │
│   │  effect  │ ──────────────> │   响应式对象   │             │
│   │ (副作用)  │                │   (Proxy)    │             │
│   └──────────┘                └──────────────┘             │
│        │                            │                       │
│        │                            │ get 拦截              │
│        │                            ▼                       │
│        │                     ┌──────────────┐              │
│        │                     │    track()   │              │
│        │                     │   依赖收集    │              │
│        │                     └──────────────┘              │
│        │                            │                       │
│        │                            ▼                       │
│        │    ┌─────────────────────────────────────┐        │
│        └───>│  targetMap (WeakMap)                │        │
│             │    └── target (对象)                 │        │
│             │          └── depsMap (Map)          │        │
│             │                └── key (属性名)      │        │
│             │                      └── dep (Set)  │<───┐   │
│             │                           └── effect│    │   │
│             └─────────────────────────────────────┘    │   │
│                                                        │   │
│   ┌──────────┐    修改属性     ┌──────────────┐        │   │
│   │  effect  │ <────────────── │   响应式对象   │        │   │
│   │  重新执行  │                │   (Proxy)    │        │   │
│   └──────────┘                └──────────────┘        │   │
│        ▲                            │                 │   │
│        │                            │ set 拦截        │   │
│        │                            ▼                 │   │
│        │                     ┌──────────────┐        │   │
│        │                     │   trigger()  │        │   │
│        └─────────────────────│   触发更新    │────────┘   │
│                              └──────────────┘             │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 6.2 数据结构详解

```javascript
// targetMap: 存储所有响应式对象的依赖关系
// WeakMap 的好处：当对象被垃圾回收时，对应的依赖也会被回收
const targetMap = new WeakMap()

// 数据结构示例
targetMap = {
  // target（原始对象）作为 key
  { name: '张三', age: 20 }: {
    // depsMap: 存储该对象每个属性的依赖
    'name': Set([effect1, effect2]), // name 属性被 effect1 和 effect2 依赖
    'age': Set([effect3])            // age 属性被 effect3 依赖
  }
}
```

### 6.3 track() - 依赖收集

```javascript
// 当前正在执行的 effect
let activeEffect = null

function track(target, key) {
  // 如果没有正在执行的 effect，不需要收集
  if (!activeEffect) return

  // 获取 target 对应的 depsMap
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  // 获取 key 对应的 dep（依赖集合）
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  // 将当前 effect 添加到依赖集合中
  dep.add(activeEffect)
}
```

### 6.4 trigger() - 触发更新

```javascript
function trigger(target, key) {
  // 获取 target 对应的 depsMap
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  // 获取 key 对应的所有依赖
  const dep = depsMap.get(key)
  if (!dep) return

  // 执行所有依赖的 effect
  dep.forEach((effect) => {
    effect()
  })
}
```

### 6.5 effect() - 副作用函数

```javascript
function effect(fn) {
  const effectFn = () => {
    // 设置当前活跃的 effect
    activeEffect = effectFn
    // 执行函数，触发依赖收集
    fn()
    // 清除当前活跃的 effect
    activeEffect = null
  }

  // 立即执行一次
  effectFn()

  return effectFn
}
```

---

## 7. 手写简易响应式系统

### 7.1 完整实现代码

```javascript
// ==================== 响应式系统核心实现 ====================

// 存储所有响应式对象的依赖关系
const targetMap = new WeakMap()

// 当前正在执行的 effect
let activeEffect = null

// effect 栈，处理嵌套 effect
const effectStack = []

/**
 * 依赖收集
 */
function track(target, key) {
  if (!activeEffect) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  // 避免重复收集
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    // 双向记录：effect 也记录自己被哪些 dep 收集
    activeEffect.deps.push(dep)
  }
}

/**
 * 触发更新
 */
function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const dep = depsMap.get(key)
  if (!dep) return

  // 创建新的 Set 避免无限循环
  const effectsToRun = new Set()
  dep.forEach((effect) => {
    // 避免在 effect 中修改自己依赖的值导致无限循环
    if (effect !== activeEffect) {
      effectsToRun.add(effect)
    }
  })

  effectsToRun.forEach((effect) => {
    // 如果有调度器，使用调度器执行
    if (effect.scheduler) {
      effect.scheduler(effect)
    } else {
      effect()
    }
  })
}

/**
 * 清除 effect 的所有依赖
 */
function cleanup(effectFn) {
  effectFn.deps.forEach((dep) => {
    dep.delete(effectFn)
  })
  effectFn.deps.length = 0
}

/**
 * 副作用函数
 */
function effect(fn, options = {}) {
  const effectFn = () => {
    // 清除旧的依赖，重新收集
    cleanup(effectFn)

    activeEffect = effectFn
    effectStack.push(effectFn)

    // 执行函数，收集依赖
    const result = fn()

    // 恢复上一个 effect
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]

    return result
  }

  // 存储依赖这个 effect 的 dep 集合
  effectFn.deps = []
  // 存储调度器
  effectFn.scheduler = options.scheduler

  // 如果不是 lazy，立即执行
  if (!options.lazy) {
    effectFn()
  }

  return effectFn
}

/**
 * 创建响应式对象
 */
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver)

      // 依赖收集
      track(target, key)

      // 深层响应式：如果值是对象，递归代理
      if (typeof result === 'object' && result !== null) {
        return reactive(result)
      }

      return result
    },

    set(target, key, value, receiver) {
      const oldValue = target[key]
      const result = Reflect.set(target, key, value, receiver)

      // 值变化时才触发更新
      if (oldValue !== value) {
        trigger(target, key)
      }

      return result
    },

    deleteProperty(target, key) {
      const hadKey = Object.prototype.hasOwnProperty.call(target, key)
      const result = Reflect.deleteProperty(target, key)

      // 只有删除成功且属性存在时才触发
      if (hadKey && result) {
        trigger(target, key)
      }

      return result
    },
  })
}

/**
 * 创建 ref
 */
function ref(value) {
  const wrapper = {
    get value() {
      track(wrapper, 'value')
      return value
    },
    set value(newValue) {
      if (newValue !== value) {
        value = newValue
        trigger(wrapper, 'value')
      }
    },
  }

  // 标记为 ref
  Object.defineProperty(wrapper, '__isRef', {
    value: true,
  })

  return wrapper
}

/**
 * 创建计算属性
 */
function computed(getter) {
  let value
  let dirty = true // 是否需要重新计算

  // 创建一个 lazy 的 effect
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      // 依赖变化时，标记为脏值
      dirty = true
      // 触发依赖 computed 的 effect
      trigger(obj, 'value')
    },
  })

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn()
        dirty = false
      }
      // 收集依赖 computed 的 effect
      track(obj, 'value')
      return value
    },
  }

  return obj
}
```

### 7.2 使用示例

```javascript
// 测试 reactive
const state = reactive({
  name: '张三',
  age: 20,
  address: {
    city: '北京',
  },
})

effect(() => {
  console.log(`姓名：${state.name}，年龄：${state.age}`)
})
// 输出：姓名：张三，年龄：20

state.name = '李四'
// 输出：姓名：李四，年龄：20

state.age = 25
// 输出：姓名：李四，年龄：25

// 测试 ref
const count = ref(0)

effect(() => {
  console.log(`count: ${count.value}`)
})
// 输出：count: 0

count.value++
// 输出：count: 1

// 测试 computed
const firstName = ref('张')
const lastName = ref('三')

const fullName = computed(() => {
  console.log('computed 执行')
  return firstName.value + lastName.value
})

console.log(fullName.value) // computed 执行 -> 张三
console.log(fullName.value) // 张三（使用缓存）

firstName.value = '李'
console.log(fullName.value) // computed 执行 -> 李三
```

---

## 8. Vue3 源码解析

### 8.1 源码目录结构

```
packages/reactivity/src/
├── reactive.ts      # reactive、readonly 等 API
├── ref.ts           # ref、toRef、toRefs 等 API
├── computed.ts      # computed API
├── effect.ts        # effect、track、trigger 核心逻辑
├── baseHandlers.ts  # Proxy 的 handler 实现
├── collectionHandlers.ts  # Map、Set 等集合类型的 handler
└── operations.ts    # 操作类型枚举
```

### 8.2 reactive 源码分析

```typescript
// packages/reactivity/src/reactive.ts（简化版）

// 存储已代理的对象，避免重复代理
const reactiveMap = new WeakMap()

export function reactive(target) {
  // 1. 只能代理对象
  if (!isObject(target)) {
    return target
  }

  // 2. 如果已经是代理对象，直接返回
  if (target.__v_isReactive) {
    return target
  }

  // 3. 如果已经代理过，返回缓存的代理
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 4. 创建代理
  const proxy = new Proxy(target, {
    get: createGetter(),
    set: createSetter(),
    deleteProperty,
    has,
    ownKeys,
  })

  // 5. 缓存代理
  reactiveMap.set(target, proxy)

  return proxy
}

function createGetter() {
  return function get(target, key, receiver) {
    // 特殊 key 处理
    if (key === '__v_isReactive') return true
    if (key === '__v_raw') return target

    const res = Reflect.get(target, key, receiver)

    // 依赖收集
    track(target, TrackOpTypes.GET, key)

    // 深层响应式（惰性转换）
    if (isObject(res)) {
      return reactive(res)
    }

    return res
  }
}

function createSetter() {
  return function set(target, key, value, receiver) {
    const oldValue = target[key]
    const result = Reflect.set(target, key, value, receiver)

    // 触发更新
    if (hasChanged(value, oldValue)) {
      trigger(target, TriggerOpTypes.SET, key, value, oldValue)
    }

    return result
  }
}
```

### 8.3 effect 源码分析

```typescript
// packages/reactivity/src/effect.ts（简化版）

// 当前活跃的 effect
let activeEffect

// effect 栈
const effectStack = []

export function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler)

  if (!options.lazy) {
    _effect.run()
  }

  // 返回 runner 函数
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect

  return runner
}

class ReactiveEffect {
  active = true
  deps = []

  constructor(fn, scheduler) {
    this.fn = fn
    this.scheduler = scheduler
  }

  run() {
    if (!this.active) {
      return this.fn()
    }

    // 清除旧依赖
    cleanupEffect(this)

    // 入栈
    effectStack.push(this)
    activeEffect = this

    // 执行函数，触发依赖收集
    const result = this.fn()

    // 出栈
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]

    return result
  }

  stop() {
    if (this.active) {
      cleanupEffect(this)
      this.active = false
    }
  }
}
```

### 8.4 track 和 trigger 源码分析

```typescript
// packages/reactivity/src/effect.ts（简化版）

// 依赖存储结构
const targetMap = new WeakMap()

export function track(target, type, key) {
  if (!activeEffect) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  trackEffects(dep)
}

function trackEffects(dep) {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}

export function trigger(target, type, key, newValue, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  // 收集需要执行的 effects
  const effects = new Set()

  const add = (effectsToAdd) => {
    if (effectsToAdd) {
      effectsToAdd.forEach((effect) => {
        // 避免无限循环
        if (effect !== activeEffect) {
          effects.add(effect)
        }
      })
    }
  }

  // 添加 key 对应的 effects
  add(depsMap.get(key))

  // 数组长度变化时，需要触发 length 相关的 effects
  if (isArray(target) && key === 'length') {
    depsMap.forEach((dep, key) => {
      if (key >= newValue) {
        add(dep)
      }
    })
  }

  // 执行 effects
  triggerEffects(effects)
}

function triggerEffects(effects) {
  effects.forEach((effect) => {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  })
}
```

---

## 9. 常见面试题

### 9.1 Vue3 响应式和 Vue2 有什么区别？

**答案要点：**

| 对比项   | Vue2                  | Vue3                 |
| -------- | --------------------- | -------------------- |
| 实现方式 | Object.defineProperty | Proxy                |
| 新增属性 | 需要 Vue.set()        | 自动响应             |
| 删除属性 | 需要 Vue.delete()     | 自动响应             |
| 数组索引 | 需要特殊处理          | 自动响应             |
| 性能     | 初始化递归遍历        | 惰性代理             |
| 支持类型 | 仅对象                | 对象、数组、Map、Set |

### 9.2 ref 和 reactive 的区别？

**答案要点：**

```javascript
// ref：包装任意类型，通过 .value 访问
const count = ref(0)
count.value++

// reactive：只能包装对象，直接访问
const state = reactive({ count: 0 })
state.count++

// 主要区别：
// 1. ref 可以包装基本类型，reactive 只能包装对象
// 2. ref 需要 .value 访问，reactive 直接访问
// 3. ref 可以重新赋值，reactive 重新赋值会丢失响应式
```

### 9.3 为什么 Vue3 要用 Proxy 替代 Object.defineProperty？

**答案要点：**

1. **更完整的拦截能力**：Proxy 可以拦截 13 种操作，包括属性新增、删除、in 操作符等
2. **更好的性能**：惰性代理，只有访问到的属性才会被转换
3. **支持更多数据类型**：原生支持数组、Map、Set 等
4. **代码更简洁**：不需要递归遍历所有属性

### 9.4 Vue3 响应式是如何实现依赖收集的？

**答案要点：**

```javascript
// 1. 数据结构
targetMap (WeakMap)
  └── target (原始对象)
        └── depsMap (Map)
              └── key (属性名)
                    └── dep (Set) -> [effect1, effect2, ...]

// 2. 收集时机
// 在 Proxy 的 get 拦截器中调用 track()

// 3. 收集条件
// 必须有 activeEffect（正在执行的副作用函数）

// 4. 触发时机
// 在 Proxy 的 set 拦截器中调用 trigger()
```

### 9.5 computed 是如何实现缓存的？

**答案要点：**

```javascript
function computed(getter) {
  let value
  let dirty = true // 脏值标记

  const effect = new ReactiveEffect(getter, () => {
    // 调度器：依赖变化时只标记为脏，不立即计算
    dirty = true
  })

  return {
    get value() {
      if (dirty) {
        // 只有脏值时才重新计算
        value = effect.run()
        dirty = false
      }
      return value
    },
  }
}

// 缓存原理：
// 1. 首次访问时计算并缓存结果
// 2. 依赖未变化时，直接返回缓存值
// 3. 依赖变化时，标记为脏值，下次访问时重新计算
```

### 9.6 watch 和 watchEffect 的区别？

**答案要点：**

```javascript
// watch：显式指定监听源
watch(source, callback, options)
// - 需要明确指定监听的数据
// - 可以获取新值和旧值
// - 默认不立即执行（可配置 immediate: true）

// watchEffect：自动收集依赖
watchEffect(callback, options)
// - 自动追踪回调中使用的响应式数据
// - 无法获取旧值
// - 默认立即执行一次
```

### 9.7 为什么要用 Reflect？

**答案要点：**

1. **保证 this 指向正确**：通过 receiver 参数
2. **返回值更合理**：操作失败返回 false 而不是抛错
3. **与 Proxy 配合**：方法一一对应，使用更自然
4. **函数式操作**：替代命令式语法

```javascript
// 示例：this 指向问题
const proxy = new Proxy(obj, {
  get(target, key, receiver) {
    // ❌ target[key] 可能导致 this 指向错误
    // ✅ Reflect.get(target, key, receiver) 保证 this 正确
    return Reflect.get(target, key, receiver)
  },
})
```

### 9.8 响应式数据解构后为什么会丢失响应式？

**答案要点：**

```javascript
const state = reactive({ name: '张三', age: 20 })

// 解构后丢失响应式
const { name, age } = state
// name 和 age 只是普通变量，不是响应式的

// 原因：
// 解构相当于：const name = state.name
// 这只是把值复制给了新变量，新变量和原对象没有关联

// 解决方案：使用 toRefs
const { name, age } = toRefs(state)
// 现在 name 和 age 是 ref，修改 name.value 会同步到 state.name
```

---

## 10. 总结

### 10.1 核心知识点回顾

```
Vue3 响应式系统
│
├── 基础原理
│   ├── Proxy：拦截对象操作
│   ├── Reflect：配合 Proxy 使用，保证 this 正确
│   └── WeakMap/Map/Set：存储依赖关系
│
├── 核心 API
│   ├── reactive()：深层响应式对象
│   ├── ref()：响应式引用（任意类型）
│   ├── computed()：计算属性（带缓存）
│   ├── watch()：显式监听
│   ├── watchEffect()：自动依赖收集监听
│   ├── toRef()/toRefs()：解决解构问题
│   └── shallowReactive()/shallowRef()：浅层响应式
│
├── 核心机制
│   ├── track()：依赖收集（get 时触发）
│   ├── trigger()：触发更新（set 时触发）
│   └── effect()：副作用函数
│
└── 数据结构
    └── targetMap (WeakMap)
          └── target → depsMap (Map)
                         └── key → dep (Set) → effects
```

### 10.2 学习建议

1. **先理解概念**：响应式 = 数据变化 → 自动更新
2. **掌握 API 使用**：reactive、ref、computed、watch
3. **理解核心原理**：Proxy + 依赖收集 + 触发更新
4. **动手实现**：手写简易版加深理解
5. **阅读源码**：带着问题看源码

### 10.3 推荐学习资源

- [Vue3 官方文档 - 深入响应式系统](https://cn.vuejs.org/guide/extras/reactivity-in-depth.html)
- [Vue3 源码仓库](https://github.com/vuejs/core)
- [《Vue.js 设计与实现》- 霍春阳](https://book.douban.com/subject/35768338/)

### 10.4 一句话总结

> Vue3 响应式的本质是：**用 Proxy 拦截数据的读写操作，读取时收集依赖（track），修改时触发更新（trigger）**。

---

## 附录：术语表

| 术语     | 英文     | 解释                 |
| -------- | -------- | -------------------- |
| 响应式   | Reactive | 数据变化自动触发更新 |
| 依赖收集 | Track    | 记录谁使用了这个数据 |
| 触发更新 | Trigger  | 数据变化时通知依赖方 |
| 副作用   | Effect   | 依赖响应式数据的函数 |
| 代理     | Proxy    | 拦截对象操作的机制   |
| 计算属性 | Computed | 带缓存的派生数据     |
| 侦听器   | Watch    | 监听数据变化执行回调 |

---

_本笔记持续更新中，如有疑问欢迎讨论！_
