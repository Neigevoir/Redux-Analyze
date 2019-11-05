import * as Redux from '../../redux'
import Reducers from '../reducers/reducers'
import apiMiddleware from './api_middleware'
import thunkMiddleware from './thunk_middleware'

const Store = ((Redux, Reducers) => {
  const preloadedState = window.__PRELOADED_STATE__,
    middleware = Redux.applyMiddleware(thunkMiddleware, apiMiddleware),
    reducers = Redux.combineReducers({ ...Reducers })

  return Redux.createStore(
    reducers,
    preloadedState,
    Redux.compose(
      middleware,
      window.devToolsExtension && process.env.NODE_ENV === 'development'
        ? window.devToolsExtension()
        : f => f
    )
  )
})(Redux, Reducers)

export default Store
