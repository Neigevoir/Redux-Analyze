import $$observable from 'symbol-observable'

import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'

/**
 * 创建一个Redux的Store，一个reducer的合集的object对象，并可以加入一些增强的处理
 *
 * @param {Function} reducer
 * 整个Reducer的状态树，一般就是我们的Reducers，Reducer的合集
 *
 * @param {any} [preloadedState]
 * 初始化的State状态值，一般使用服务端渲染才会需要使用到
 *
 * @param {Function} [enhancer]
 * 一般是增强Reducer处理的function，例如中间件等
 *
 * @returns {Store}
 * 创建一个Redux的Store，一个reducer的合集的object对象，并加入一些用户需要的处理
 */

export default function createStore(reducer, preloadedState, enhancer) {
  // TIPS：不支持传入多个function来处理Store，推荐的是通过Compose来组合成1个function
  if (
    (typeof preloadedState === 'function' && typeof enhancer === 'function') ||
    (typeof enhancer === 'function' && typeof arguments[3] === 'function')
  ) {
    throw new Error(
      'It looks like you are passing several store enhancers to ' +
        'createStore(). This is not supported. Instead, compose them ' +
        'together to a single function.'
    )
  }

  // TIPS：如果传入的preloadedState是function，而且enhancer没有传，那就将两个参数互换，保证流程的一致性
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState
    preloadedState = undefined
  }

  // TIPS：enhancer传了不是function的东西，则抛异常
  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.')
    }
    // TIPS：enhancer正常情况
    return enhancer(createStore)(reducer, preloadedState)
  }

  // TIPS：reducer
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.')
  }

  let currentReducer = reducer //TIPS：当前Reducer
  let currentState = preloadedState //TIPS：当前State
  let currentListeners = [] //TIPS：当前监听回调的数组
  let nextListeners = currentListeners //TIPS：下一个监听回调的数组
  let isDispatching = false //TIPS：是否在Dispatch中

  // TIPS：保证可以修改下一个监听组的数据不出错，在需要使用到nextListeners的地方都需要进行处理;
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      // TIPS：防止指针问题，返回了新的数组
      nextListeners = currentListeners.slice()
    }
  }

  // TIPS：返回当前整个Redux的State
  function getState() {
    // TIPS：如果当前处于dispatch状态，返回的state会不准确
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }

    return currentState
  }

  /**
   *
   * @param {Function} listener
   * TIPS：增加一个订阅事件，用在dipatch之后的执行，并且需要是function
   * @returns {Function} A function to remove this change listener.
   * TIPS：返回一个function，用来解绑增加的订阅事件
   */
  function subscribe(listener) {
    // TIPS：增加的订阅事件必须为一个function;
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.')
    }
    // TIPS：增加的订阅事件时不能在dispatch时，容易造成问题;
    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
      )
    }

    // TIPS：注册过
    let isSubscribed = true

    // TIPS：确保nextListeners的准确性
    ensureCanMutateNextListeners()
    // TIPS：添加listener到nextListeners
    nextListeners.push(listener)

    // TIPS：返回解绑的回调，可以解除当前listener的监听;
    return function unsubscribe() {
      // TIPS：如已经解除则不需要处理
      if (!isSubscribed) {
        return
      }

      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
        )
      }

      // TIPS：设置订阅状态，并将listener在nextListeners中剔除;
      isSubscribed = false

      ensureCanMutateNextListeners()
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
    }
  }

  /**
   * @param {Object} action
   * TIPS：dispatch的必须是一个对象，去触发reducer的订阅
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   * TIPS：在一些action中使用了function，是因为我们借助中间件进行处理，但最后返回依然是action object
   */
  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error(
        'Actions must be plain objects. ' +
          'Use custom middleware for async actions.'
      )
    }

    // TIPS：type如果不设置，就无法找到对应的订阅事件
    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
          'Have you misspelled a constant?'
      )
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    // TIPS：将dispatch状态修改，并且根据reducer里面注册好的的function，拿到dipacth的新state，设置为当前状态
    try {
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    // TIPS：执行整个订阅的事件组
    const listeners = (currentListeners = nextListeners)
    console.log(listeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }

    return action
  }

  /**
   * @param {Function}
   *  TIPS：使用传入的Reducer替换当前的Reducer
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    currentReducer = nextReducer

    // TIPS：替换完成后dispatch，可以
    dispatch({ type: ActionTypes.REPLACE })
  }

  //TIPS：是一个第三方库，https://github.com/tc39/proposal-observable，主要用户对订阅的对象扩展处理
  function observable() {
    const outerSubscribe = subscribe
    return {
      /**
       * @param {Object} observer Any object that can be used as an observer.
       * TIPS：传入一个Object对象作为观察，这个Object可以有next的方法
       * @returns {subscription}
       * TIPS：返回一个增强的订阅对象
       */
      subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('Expected the observer to be an object.')
        }

        function observeState() {
          // TIPS：如subscribe(observer).filter(getState() => { dosomething }).map(getState() => { dosomething })
          if (observer.next) {
            observer.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      // TIPS：$$observable为一个Symbol对象
      [$$observable]() {
        return this
      }
    }
  }

  // TIPS：在创建Store时，dispatch一个初始化的Action
  dispatch({ type: ActionTypes.INIT })

  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  }
}
