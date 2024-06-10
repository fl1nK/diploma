import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

const UserList = ({ refresh }) => {
  const [users, setUsers] = useState([]);

  const token = useSelector((state) => state.auth.token);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [refresh]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get-users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.lastName} ${user.firstName} ${user.middleName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="table-container">
      <h1>Список робітників</h1>
      <div className="form__group">
        <label className="form__label">Пошук за ПІБ:</label>
        <input
          className="form__input"
          type="text"
          placeholder="Пошук за ПІБ"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="table__scroll">
        <table className="table">
          <thead>
            <tr>
              <th className="table__header">ПІБ</th>
              <th className="table__header">Початок роботи</th>
              <th className="table__header">Кінець роботи</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr className="table__row" key={user._id}>
                <td className="table__cell">
                  <Link to={`/user/${user._id}`}>
                    {user.lastName} {user.firstName} {user.middleName}
                  </Link>
                </td>
                <td className="table__cell">{user.entryTime}</td>
                <td className="table__cell">{user.outTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;
