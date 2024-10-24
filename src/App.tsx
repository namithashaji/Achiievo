import React from 'react';
import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Signin from './pages/Signin';
import PrivateRoute from './PrivateRoute';
import AdminPage from './pages/AdminPage';


const App: React.FC = () => {
  return (
    <Routes>
      {/* Home Route */}
      <Route path="/" element={<HomePage />} />
      {/* Admin Routes */}
      <Route path="/root/admin/signin" element={<Signin />} />
      <Route
        path="/root/admin"
        element={
          <PrivateRoute>
            <AdminPage/>
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

export default App;
