import React from 'react'

// TIPS：生成一个Context，用作全局的store，多处地方会使用，如provider，还有一些useStore等
export const ReactReduxContext = React.createContext(null)

export default ReactReduxContext
