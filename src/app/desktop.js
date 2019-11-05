import { useEffect } from 'react'
import { Provider, connect } from '../react-redux'
import Store from 'src/app/store/store.js'
import Actions from 'src/app/actions/actions'

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

export default function First() {
  return (
    <Provider store={Store}>
      <Test />
    </Provider>
  )
}
