import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DownloadExcelButton from './DownloadExcelButton';

const DetectedUsersList = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/get-detected-all-users'); // Замініть '/api/users' на свій шлях до ендпоінту на сервері
        setUsers(response.data);
        console.log(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h1>Cписок виявлених людей</h1>
      <DownloadExcelButton users={users} />
      <table>
        <thead>
          <tr>
            <th>Прізвище</th>
            <th>Ім'я</th>
            <th>По батькові</th>
            <th>Початок роботи</th>
            <th>Кінець роботи</th>
            <th>Дата</th>
            <th>Час</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>
                <Link to={`/user/${user.userID._id}`}>{user.userID.lastName}</Link>
              </td>
              <td>{user.userID.firstName}</td>
              <td>{user.userID.middleName}</td>
              <td>{user.userID.entryTime}</td>
              <td>{user.userID.outTime}</td>
              <td>{user.date}</td>
              <td>{user.time}</td>
              <td>{user.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DetectedUsersList;
