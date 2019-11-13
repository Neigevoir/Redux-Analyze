import { getBatch } from './batch'

// TIPS：初始化listeners
const CLEARED = null
const nullListeners = { notify() {} }

function createListenerCollection() {
  // TIPS：拿到reactdom的state合并方法，防止订阅过多的setState，造成性能问题
  const batch = getBatch()

  let current = []
  let next = []

  return {
    clear() {
      next = CLEARED
      current = CLEARED
    },
    // TIPS：通知执行订阅的方法
    notify() {
      const listeners = (current = next)
      batch(() => {
        for (let i = 0; i < listeners.length; i++) {
          listeners[i]()
        }
      })
    },

    get() {
      return next
    },
    // TIPS：注册监听
    subscribe(listener) {
      let isSubscribed = true
      // TIPS：确保next获取的是正确的current而不是引用
      if (next === current) next = current.slice()
      next.push(listener)

      return function unsubscribe() {
        if (!isSubscribed || current === CLEARED) return
        isSubscribed = false

        if (next === current) next = current.slice()
        next.splice(next.indexOf(listener), 1)
      }
    }
  }
}

// TIPS：new Subscription(store)，parentSub为undefined
export default class Subscription {
  constructor(store, parentSub) {
    this.store = store
    this.parentSub = parentSub
    this.unsubscribe = null
    this.listeners = nullListeners

    this.handleChangeWrapper = this.handleChangeWrapper.bind(this)
  }

  // TIPS：增加嵌套订阅
  addNestedSub(listener) {
    this.trySubscribe()
    return this.listeners.subscribe(listener)
  }

  // TIPS：通知执行所有已经订阅的方法
  notifyNestedSubs() {
    this.listeners.notify()
  }

  // TIPS：store收到dispatch会执行nextListeners订阅组，这里provider会将该函数注册到nextListeners中
  handleChangeWrapper() {
    if (this.onStateChange) {
      this.onStateChange('测试')
    }
  }

  // TIPS：判断是否已经订阅
  isSubscribed() {
    return Boolean(this.unsubscribe)
  }

  // TIPS：没有取消订阅，就判断parentSub，如果有则帮到parentSub的订阅组中，否则绑到当前store
  trySubscribe() {
    if (!this.unsubscribe) {
      this.unsubscribe = this.parentSub
        ? this.parentSub.addNestedSub(this.handleChangeWrapper)
        : this.store.subscribe(this.handleChangeWrapper) //TIPS：给store的nextListeners增加一个订阅的方法
      this.listeners = createListenerCollection()
    }
  }

  // TIPS：取消订阅
  tryUnsubscribe() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
      this.listeners.clear()
      this.listeners = nullListeners
    }
  }
}
