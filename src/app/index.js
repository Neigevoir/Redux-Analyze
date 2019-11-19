import { Provider, connect } from '../react-redux'
import { useSelector, useDispatch } from '../react-redux'
import Store from 'src/app/store/store.js'
import Actions from 'src/app/actions/actions'

function getState(state) {
  return { test: state.common.test }
}

function getPureState(state) {
  return { pure: state.common.pure }
}

function SecondChildRender(props) {
  function handleClick(e) {
    e.stopPropagation()
    e.preventDefault()
    props.dispatch(Actions.common.TestRedux())
  }
  console.log('SecondChild')
  return <div onClick={handleClick}>SecondChild</div>
}
const SecondChild = connect(getState)(SecondChildRender)

function First(props) {
  console.log('First')
  return (
    <div>
      First
      <FirstChild />
      <SecondChild />
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

function ThreeRender(props) {
  const pure = useSelector(state => state.common.pure)
  const dispatch = useDispatch()
  function handleClick(e) {
    e.stopPropagation()
    e.preventDefault()
    dispatch(Actions.common.TestRedux())
  }
  console.log('ThreeRender')
  return <div onClick={handleClick}>ThreeRender{pure ? 'true' : 'false'}</div>
}
const Three = ThreeRender

// TIPS：推荐使用hooks的方式，去掉decorators的connect，对比SecondRender，并且不使用connect，在源码上应该对体积有大的改进，不需要用到connect和advance
function FirstChildRender(props) {
  const test = useSelector(state => state.common.test)
  const dispatch = useDispatch()
  function handleClick(e) {
    e.stopPropagation()
    e.preventDefault()
    dispatch(Actions.common.TestRedux())
  }
  console.log('FirstChildRender')
  return <div onClick={handleClick}>FirstChild{test}</div>
}

const FirstChild = FirstChildRender

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
      <Three />
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
