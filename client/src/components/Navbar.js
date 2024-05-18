import React from 'react';
import { NavLink } from 'react-router-dom';
const Navbar = () => {
  return (
    <div className="navbar_container">
      <div className="navbar">
        <NavLink to="/video">video</NavLink>
        <NavLink to="/">Створити профіль</NavLink>
        <NavLink to="/detectedUsers">Звіт</NavLink>
      </div>
    </div>
  );
};

export default Navbar;
