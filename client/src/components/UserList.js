import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const UserList = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/get-users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Ви впевнені, що хочете видалити цього користувача?')) {
      try {
        await axios.delete(`http://localhost:5000/user/${userId}`);
        setUsers(users.filter((user) => user._id !== userId));
        console.log('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <div>
      <h1>Список користувачів</h1>
      <table>
        <thead>
          <tr>
            <th>ПІБ</th>
            <th>Початок роботи</th>
            <th>Кінець роботи</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>
                <Link to={`/user/${user._id}`}>
                  {user.lastName} {user.firstName} {user.middleName}
                </Link>
              </td>
              <td>{user.entryTime}</td>
              <td>{user.outTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
