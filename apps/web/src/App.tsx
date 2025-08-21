import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Homepage from './pages/Homepage'

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/dashboard" element={<div className="p-8 text-center">Dashboard - Coming Soon</div>} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </>
  )
}

export default App 