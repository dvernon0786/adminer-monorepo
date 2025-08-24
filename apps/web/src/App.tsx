import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Homepage from './pages/Homepage'
import Dashboard from './pages/dashboard'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App 