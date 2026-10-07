import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { UploadPage } from './components/upload/UploadZone';
import { FilesList } from './components/files/FilesList';
import { FileDetails } from './components/files/FileDetails';
import { MeasurementsTable } from './components/files/MeasurementsTable';
import { APIExplorer } from './components/api/APIExplorer';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/files" element={<FilesList />} />
            <Route path="/files/:id" element={<FileDetails />} />
            <Route path="/files/:id/measurements" element={<MeasurementsTable />} />
            <Route path="/api-explorer" element={<APIExplorer />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;