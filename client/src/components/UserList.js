import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Form from './Form';

const UserList = ({ users }) => {
  return (
    <div>
      <h1>Список користувачів</h1>
      <ul>
        {users.map((user) => (
          <li key={user._id}>
            <Link to={`/user/${user._id}`}>
              {user.firstName} {user.lastName} {user.middleName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
