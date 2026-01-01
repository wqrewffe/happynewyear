
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Creator from './components/Creator';
import Viewer from './components/Viewer';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen">
        <Routes>
          {/* Main creation page */}
          <Route path="/" element={<Creator />} />
          
          {/* Dynamic wishing link: /#/name/wishing_note */}
          <Route path="/:name/:note" element={<Viewer />} />
          
          {/* Fallback for /#/name only */}
          <Route path="/:name" element={<Viewer />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
