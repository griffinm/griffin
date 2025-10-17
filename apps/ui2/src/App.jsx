import { RouterProvider } from 'react-router-dom'
import { router } from './components/AppRouter'
import { MantineProvider } from '@mantine/core'
import { theme } from './theme'
import './index.css'
import { UserProvider } from './providers/UserProvider'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api/baseClient'

function App() {
  return (
    <MantineProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <RouterProvider router={router} />
        </UserProvider>
      </QueryClientProvider>
    </MantineProvider>
  )
}

export default App
