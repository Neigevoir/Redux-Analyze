import * as Redux from '../../redux'
import Reducers from '../reducers/reducers'
import thunkMiddleware from './thunk_middleware'

const Store = ((Redux, Reducers) => {
  const preloadedState = window.__PRELOADED_STATE__,
    middleware = Redux.applyMiddleware(thunkMiddleware),
    reducers = Redux.combineReducers({ ...Reducers })

  return Redux.createStore(reducers, preloadedState, Redux.compose(middleware))
})(Redux, Reducers)

export default Store
