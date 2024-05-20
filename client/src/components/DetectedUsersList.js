import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DownloadExcelButton from './DownloadExcelButton';

const DetectedUsersList = () => {
  const [users, setUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/get-detected-all-users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const sortedUsers = [...users].sort((a, b) => {
    let aValue, bValue;

    if (sortConfig.key.includes('.')) {
      const keys = sortConfig.key.split('.');
      aValue = a[keys[0]][keys[1]];
      bValue = b[keys[0]][keys[1]];
    } else {
      aValue = a[sortConfig.key];
      bValue = b[sortConfig.key];
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const filteredUsers = sortedUsers.filter((user) => {
    const fullName =
      `${user.userID.lastName} ${user.userID.firstName} ${user.userID.middleName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Ви впевнені, що хочете видалити цього користувача?')) {
      try {
        await axios.delete(`http://localhost:5000/detected-user/${userId}`);
        setUsers(users.filter((user) => user._id !== userId));
        console.log('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <div>
      <h1>Список виявлених людей</h1>
      <input
        type="text"
        placeholder="Пошук за ПІБ"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <DownloadExcelButton users={filteredUsers} />
      <table>
        <thead>
          <tr>
            <th onClick={() => requestSort('userID.lastName')}>ПІБ</th>
            <th onClick={() => requestSort('userID.entryTime')}>Початок роботи</th>
            <th onClick={() => requestSort('userID.outTime')}>Кінець роботи</th>
            <th onClick={() => requestSort('date')}>Дата</th>
            <th onClick={() => requestSort('time')}>Час</th>
            <th onClick={() => requestSort('status')}>Статус</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user._id}>
              <td>
                <Link to={`/user/${user.userID._id}`}>
                  {user.userID.lastName} {user.userID.firstName} {user.userID.middleName}
                </Link>
              </td>
              <td>{user.userID.entryTime}</td>
              <td>{user.userID.outTime}</td>
              <td>{user.date}</td>
              <td>{user.time}</td>
              <td>{user.status}</td>
              <td>
                <button type="button" onClick={() => handleDeleteUser(user._id)}>
                  Видалити
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DetectedUsersList;
