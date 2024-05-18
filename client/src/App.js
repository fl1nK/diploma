import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserList from './components/UserList';
import UserProfile from './components/UserProfile';
import Form from './components/Form';
import Video from './components/Video';
import DetectedUsersList from './components/DetectedUsersList';
import Navbar from './components/Navbar';

const App = () => {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route exact path="/" element={<Form />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/video" element={<Video />} />
          <Route path="/detectedUsers" element={<DetectedUsersList />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
