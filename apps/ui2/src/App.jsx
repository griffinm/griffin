import { RouterProvider } from 'react-router-dom'
import { router } from './components/AppRouter'
import { MantineProvider } from '@mantine/core'
import { theme } from './theme'
import './index.css'

function App() {
  return (
    <MantineProvider theme={theme}>
      <RouterProvider router={router} />
    </MantineProvider>
  )
}

export default App
