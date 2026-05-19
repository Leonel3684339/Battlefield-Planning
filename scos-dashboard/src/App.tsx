import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Home } from './components/pages/Home';
import { MapPlanner } from './components/pages/MapPlanner';
import { Doctrine } from './components/pages/Doctrine';
import { Simulation } from './components/pages/Simulation';
import { Bayesian } from './components/pages/Bayesian';
import { RLPolicy } from './components/pages/RLPolicy';
import { Login } from './components/Login';

function AppRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapPlanner />} />
        <Route path="/doctrine" element={<Doctrine />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/bayesian" element={<Bayesian />} />
        <Route path="/rlpolicy" element={<RLPolicy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;