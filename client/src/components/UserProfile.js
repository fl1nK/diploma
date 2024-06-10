import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

const UserProfile = () => {
  const token = useSelector((state) => state.auth.token);

  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    entryTime: '',
    outTime: '',
  });
  const [file, setFile] = useState(null);
  const fileRef = useRef();
  const [isFormImageValid, setIsFormImageValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);
      setFormData({
        lastName: response.data.lastName,
        firstName: response.data.firstName,
        middleName: response.data.middleName,
        entryTime: response.data.entryTime || '', // Перевіряємо, щоб не було null
        outTime: response.data.outTime || '', // Перевіряємо, щоб не було null
      });
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveChanges = async () => {
    try {
      await axios.put(`http://localhost:5000/user/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchUser();
      setIsEditing(false);
      console.log('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteProfile = async () => {
    if (window.confirm('Ви впевнені, що хочете видалити цей профіль?')) {
      try {
        await axios.delete(`http://localhost:5000/user/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('User deleted successfully!');
        navigate('/userList'); // Перенаправлення на головну сторінку після видалення
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Ви впевнені, що хочете видалити цю фотографію?')) {
      try {
        await axios.delete(`http://localhost:5000/user/${user._id}/image/${imageId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Image deleted successfully!');
        fetchUser();
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setIsFormImageValid(true);
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      await axios.post(`http://localhost:5000/user/${id}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Image uploaded successfully!');
      // Оновлюємо дані користувача після завантаження фотографії
      fetchUser();
      setIsFormImageValid(false);
      fileRef.current.value = '';
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile__container">
      <div className="profile">
        {isEditing ? (
          <div>
            <h2>Редагувати профіль користувача</h2>
            <form className="profile__form">
              <div className="profile__form-group">
                <label className="profile__form-label">Прізвище:</label>
                <input
                  className="profile__form-input"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="profile__form-group">
                <label className="profile__form-label">Ім'я:</label>
                <input
                  className="profile__form-input"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="profile__form-group">
                <label className="profile__form-label">По батькові:</label>
                <input
                  className="profile__form-input"
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="profile__form-group">
                <label className="profile__form-label">Час початку роботи:</label>
                <input
                  className="profile__form-input"
                  type="time"
                  name="entryTime"
                  value={formData.entryTime}
                  onChange={handleInputChange}
                />
              </div>
              <div className="profile__form-group">
                <label className="profile__form-label">Час завершення роботи:</label>
                <input
                  className="profile__form-input"
                  type="time"
                  name="outTime"
                  value={formData.outTime}
                  onChange={handleInputChange}
                />
              </div>
              <button className="profile__form-button" type="button" onClick={handleSaveChanges}>
                Зберегти зміни
              </button>
              <button
                className="profile__form-button profile__form-button--cancel"
                type="button"
                onClick={() => setIsEditing(false)}
              >
                Скасувати
              </button>
            </form>
          </div>
        ) : (
          <div className="profile__details">
            <h2>Профіль користувача</h2>
            <p className="profile__details-item">Прізвище: {user.lastName}</p>
            <p className="profile__details-item">Ім'я: {user.firstName}</p>
            <p className="profile__details-item">По батькові: {user.middleName}</p>
            <p className="profile__details-item">Час початку роботи: {formData.entryTime}</p>
            <p className="profile__details-item">Час завершення роботи: {formData.outTime}</p>
            <button className="profile__button" type="button" onClick={() => setIsEditing(true)}>
              Редагувати профіль
            </button>
            <button
              className="profile__button profile__button--delete"
              type="button"
              onClick={handleDeleteProfile}
            >
              Видалити профіль
            </button>
          </div>
        )}

        <h3>Фотографії:</h3>
        <div className="profile__images">
          {user.images.map((image) => (
            <div className="profile__images-item" key={image._id}>
              <img
                className="profile__images-img"
                src={`http://localhost:5000/${image.url}`}
                alt="user"
                height={200}
              />
              <button
                className="profile__images-button"
                onClick={() => handleDeleteImage(image._id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                >
                  <path d="M 10 2 L 9 3 L 5 3 C 4.4 3 4 3.4 4 4 C 4 4.6 4.4 5 5 5 L 7 5 L 17 5 L 19 5 C 19.6 5 20 4.6 20 4 C 20 3.4 19.6 3 19 3 L 15 3 L 14 2 L 10 2 z M 5 7 L 5 20 C 5 21.1 5.9 22 7 22 L 17 22 C 18.1 22 19 21.1 19 20 L 19 7 L 5 7 z M 9 9 C 9.6 9 10 9.4 10 10 L 10 19 C 10 19.6 9.6 20 9 20 C 8.4 20 8 19.6 8 19 L 8 10 C 8 9.4 8.4 9 9 9 z M 15 9 C 15.6 9 16 9.4 16 10 L 16 19 C 16 19.6 15.6 20 15 20 C 14.4 20 14 19.6 14 19 L 14 10 C 14 9.4 14.4 9 15 9 z"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="profile__upload">
          <h3>Додати нову фотографію:</h3>
          <input
            className="profile__upload-input"
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={handleFileChange}
          />
          <button
            className="profile__upload-button"
            type="button"
            onClick={handleUpload}
            disabled={!isFormImageValid}
          >
            Завантажити
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
