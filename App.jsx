import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Collections from './pages/Collections'
import Expenses from './pages/Expenses'
import Salary from './pages/Salary'
import Reports from './pages/Reports'
import Courses from './pages/Courses'
import ElyrAgent from './pages/ElyrAgent'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/salary" element={<Salary />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/elyra" element={<ElyrAgent />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
