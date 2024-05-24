import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';

import UserList from './components/UserList';
import UserProfile from './components/UserProfile';
import CreateUser from './components/CreateUser';
import Video from './components/Video';
import WebCamera from './components/WebCamera';

import DetectedUsersList from './components/DetectedUsersList';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Registration from './components/Registration';
import Error404 from './components/error/Error404';
import Error401 from './components/error/Error401';

const App = () => {
  const token = useSelector((state) => state.auth.token);

  return (
    <Router>
      <div className="app">
        {token && <Navbar />}
        <Routes>
          <Route exact path="/" element={!token ? <Login /> : <Error404 />} />
          <Route path="/registration" element={token ? <Registration /> : <Error401 />} />

          <Route path="/userList" element={token ? <CreateUser /> : <Error401 />} />
          <Route path="/user/:id" element={token ? <UserProfile /> : <Error401 />} />
          {/* <Route path="/webcamera" element={token ? <WebCamera /> : <Error401 />} /> */}
          <Route path="/video" element={token ? <Video /> : <Error401 />} />
          <Route path="/detectedUsers" element={token ? <DetectedUsersList /> : <Error401 />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
