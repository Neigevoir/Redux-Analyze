import { Router } from 'react-router-dom'
import { Provider, connect } from '../../react-redux'
import Store from 'src/app/store/store.js'
import { persistor } from 'src/app/store/store.js'
import { PersistGate } from 'redux-persist/es/integration/react'
import Actions from 'src/app/actions/actions'
import { createBrowserHistory } from 'history'
const history = createBrowserHistory()

function openDarkMode() {
  const script = document.createElement('script')
  script.src =
    'https://cdn.jsdelivr.net/npm/darkmode-js@1.4.0/lib/darkmode-js.min.js'
  document.getElementsByTagName('head')[0].appendChild(script)
  script.onload = () => {
    const Darkmode = window.Darkmode
    new Darkmode().showWidget()
  }
}
openDarkMode()

function TestRender(props) {
  console.log(props)
  function handleClick() {
    props.dispatch(Actions.common.TestRedux())
  }
  return <div onClick={handleClick}>test</div>
}

function getState(state) {
  const { test } = state.common
  return {
    test
  }
}
const Test = connect(getState)(TestRender)

const Qwe = () => {
  console.log('qwe')
  return <div>QWE</div>
}

export default function First() {
  return (
    <Provider store={Store}>
      <PersistGate persistor={persistor} loading={<div>Loading...</div>}>
        <Router history={history}>
          <Test />
        </Router>
      </PersistGate>
    </Provider>
  )
}
