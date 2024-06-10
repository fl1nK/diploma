import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DownloadExcelButton from './DownloadExcelButton';
import { useSelector } from 'react-redux';

const DetectedUsersList = () => {
  const token = useSelector((state) => state.auth.token);

  const [users, setUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/get-detected-all-users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [token]);

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
    const userDate = moment(user.date, 'DD.MM.YYYY');
    return (
      fullName.includes(searchTerm.toLowerCase()) &&
      (!startDate || userDate.isSameOrAfter(moment(startDate), 'day')) &&
      (!endDate || userDate.isSameOrBefore(moment(endDate), 'day'))
    );
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
        await axios.delete(`http://localhost:5000/detected-user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(users.filter((user) => user._id !== userId));
        console.log('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <div className="detected-users__container">
      <div className="detected-users">
        <h1 className="detected-users__title">Таблиця звіту</h1>
        <div className="detected-users__filter">
          <div className="form__group">
            <label>Пошук за ПІБ:</label>
            <input
              className="detected-users__search"
              type="text"
              placeholder="Пошук за ПІБ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form__group">
            <label>Виберіть початкову дату:</label>
            <DatePicker
              className="detected-users__search"
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              placeholderText="dd/mm/yyyy"
              dateFormat="dd/MM/yyyy"
              isClearable
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={15}
            />
          </div>
          <div className="form__group">
            <label>Виберіть кінцеву дату:</label>
            <DatePicker
              className="detected-users__search"
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              placeholderText="dd/mm/yyyy"
              dateFormat="dd/MM/yyyy"
              isClearable
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={15}
            />
          </div>
          <DownloadExcelButton users={filteredUsers} />
        </div>

        <div className="table__scroll">
          <table className="table">
            <thead>
              <tr>
                <th className="table__header" onClick={() => requestSort('userID.lastName')}>
                  ПІБ
                </th>
                <th className="table__header" onClick={() => requestSort('userID.entryTime')}>
                  Початок роботи
                </th>
                <th className="table__header" onClick={() => requestSort('userID.outTime')}>
                  Кінець роботи
                </th>
                <th className="table__header" onClick={() => requestSort('date')}>
                  Дата
                </th>
                <th className="table__header" onClick={() => requestSort('time')}>
                  Час
                </th>
                <th className="table__header" onClick={() => requestSort('status')}>
                  Статус
                </th>
                <th className="table__header">Дії</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr className="table__row" key={user._id}>
                  <td className="table__cell">
                    <Link to={`/user/${user.userID._id}`}>
                      {user.userID.lastName} {user.userID.firstName} {user.userID.middleName}
                    </Link>
                  </td>
                  <td className="table__cell">{user.userID.entryTime}</td>
                  <td className="table__cell">{user.userID.outTime}</td>
                  <td className="table__cell">{user.date}</td>
                  <td className="table__cell">{user.time}</td>
                  <td className="table__cell">{user.status}</td>
                  <td className="table__cell">
                    <button
                      className="table__delete-button"
                      type="button"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      Видалити
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DetectedUsersList;
