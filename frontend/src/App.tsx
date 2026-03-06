import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'

// 页面组件
import Dashboard from './pages/Dashboard'
import DataUpload from './pages/DataUpload'
import EmployeeList from './pages/EmployeeList'
import StandardParamManager from './pages/StandardParamManager'
import KPICalculation from './pages/KPICalculation'
import KPIReport from './pages/KPIReport'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<DataUpload />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="standards" element={<StandardParamManager />} />
          <Route path="kpi-calculation" element={<KPICalculation />} />
          <Route path="kpi-report" element={<KPIReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App