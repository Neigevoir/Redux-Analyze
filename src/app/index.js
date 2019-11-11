import { Provider, connect } from '../react-redux'
import Store from 'src/app/store/store.js'
import Actions from 'src/app/actions/actions'

function getTestState(state) {
  return { test: state.common.test }
}

function getPureState(state) {
  return { pure: state.common.pure }
}

function First(props) {
  console.log('First')
  return (
    <div>
      First
      <FirstChild />
    </div>
  )
}

function SecondRender(props) {
  function handleClick(e) {
    e.stopPropagation()
    e.preventDefault()
    props.dispatch(Actions.common.TestRedux())
  }
  console.log('SecondRender')
  return <div onClick={handleClick}>Second</div>
}
const Second = connect(getPureState)(SecondRender)

function FirstChildRender(props) {
  function handleClick(e) {
    e.stopPropagation()
    e.preventDefault()
    props.dispatch(Actions.common.TestRedux())
    console.log(1)
  }
  console.log('FirstChildRender')
  return <div onClick={handleClick}>FirstChild</div>
}

const FirstChild = connect(getTestState)(FirstChildRender)

function Test(props) {
  function consoleTest() {
    console.log('test')
  }
  console.log('Test')
  return (
    <div>
      <div onClick={consoleTest}>test</div>
      <First dispatch={props.dispatch} />
      <Second dispatch={props.dispatch} />
    </div>
  )
}

export default function App() {
  return (
    <Provider store={Store}>
      <Test />
    </Provider>
  )
}
