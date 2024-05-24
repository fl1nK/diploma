import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import UserList from './UserList';
import {useSelector} from "react-redux";

const Form = () => {
  const token = useSelector((state) => state.auth.token);

  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    photos: [],
    entryTime: '',
    outTime: '',
  });
  const [notification, setNotification] = useState('');
  const fileInputRef = useRef();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, photos: files });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('middleName', formData.middleName);
      formDataToSend.append('entryTime', formData.entryTime); // Додаємо entryTime до formData
      formDataToSend.append('outTime', formData.outTime); // Додаємо outTime до formData

      formData.photos.forEach((photo, index) => {
        formDataToSend.append(`photo${index + 1}`, photo);
      });

      const response = await axios.post('http://localhost:5000/create-user', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      console.log(response.data);
      setNotification(response.data.message);
      setFormData({
        lastName: '',
        firstName: '',
        middleName: '',
        photos: [],
        entryTime: '',
        outTime: '',
      });
      fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error submitting form:', error);
      setNotification('Під час створення людини виникла помилка.');
    }
  };

  return (
    <div className='container'>
      <form className='form' onSubmit={handleSubmit}>
        <h1>Створити робітника</h1>
        {notification && <div>{notification}</div>}
        <div className='form__label'>
          <label className='form__group'>Прізвище:</label>
          <input
              className='form__input'
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            maxLength="30"
            pattern="[A-Za-zА-Яа-яЁёІіЇїЄєҐґ]+"
          />
        </div>
        <div className='form__group'>
          <label className='form__label'>Ім'я:</label>
          <input
              className='form__input'
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            maxLength="30"
            pattern="[A-Za-zА-Яа-яЁёІіЇїЄєҐґ]+"
          />
        </div>
        <div className='form__group'>
          <label className='form__label'>По батькові:</label>
          <input className='form__input'
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleInputChange}
            required
            maxLength="30"
            pattern="[A-Za-zА-Яа-яЁёІіЇїЄєҐґ]+"
          />
        </div>
        <div className='form__group'>
          <label className='form__label'>Час початку роботи:</label>
          <input className='form__input'
            type="time"
            name="entryTime"
            value={formData.entryTime}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className='form__group'>
          <label className='form__label'>Час завершення роботи:</label>
          <input className='form__input'
            type="time"
            name="outTime"
            value={formData.outTime}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className='form__group'>
          <label className='form__label'>Фотографії:</label>
          <input className='form__input'
            type="file"
            name="photos"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
            required
          />
        </div>
        <button className='form__button' type="submit">Відправити</button>
      </form>

      <UserList />
    </div>
  );
};

export default Form;
