import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setToken, clearToken } from '../reduser/authSlice';
import { useDispatch } from 'react-redux';
const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    dispatch(clearToken());
    navigate('/');
  };

  return (
    <div className="navbar">
      <div className="navbar__container">
        <NavLink className="navbar__link" to="/webcamera">
          webcamera
        </NavLink>
        <NavLink className="navbar__link" to="/video">
          Відео
        </NavLink>
        <NavLink className="navbar__link" to="/userList">
          Створити профіль
        </NavLink>
        <NavLink className="navbar__link" to="/detectedUsers">
          Звіт
        </NavLink>
        <NavLink className="navbar__link" to="/registration">
          Створити адміна
        </NavLink>
        <button className="navbar__button" onClick={handleLogout}>
          Вихід
        </button>
      </div>
    </div>
  );
};

export default Navbar;
