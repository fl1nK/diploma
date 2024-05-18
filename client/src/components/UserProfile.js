import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserProfile = () => {
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
  const [file, setFile] = useState(null); // State для файлу фотографії
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/user/${id}`);
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
      const response = await axios.put(`http://localhost:5000/user/${id}`, formData);
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
        await axios.delete(`http://localhost:5000/user/${id}`);
        console.log('User deleted successfully!');
        navigate('/'); // Перенаправлення на головну сторінку після видалення
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await axios.delete(`http://localhost:5000/user/${user._id}/image/${imageId}`);
      console.log('Image deleted successfully!');
      fetchUser();
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      await axios.post(`http://localhost:5000/user/${id}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Image uploaded successfully!');
      // Оновлюємо дані користувача після завантаження фотографії
      fetchUser();
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <button type="button" onClick={handleDeleteProfile}>
        Видалити профіль
      </button>

      {isEditing ? (
        <div>
          <h2>Редагувати профіль користувача</h2>
          <form>
            <div>
              <label>Прізвище:</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label>Ім'я:</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label>По батькові:</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label>Час початку роботи:</label>
              <input
                type="time"
                name="entryTime"
                value={formData.entryTime}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label>Час завершення роботи:</label>
              <input
                type="time"
                name="outTime"
                value={formData.outTime}
                onChange={handleInputChange}
              />
            </div>
            <button type="button" onClick={handleSaveChanges}>
              Зберегти зміни
            </button>
            <button type="button" onClick={() => setIsEditing(false)}>
              Скасувати
            </button>
          </form>
        </div>
      ) : (
        <div>
          <h2>Профіль користувача</h2>
          <p>Прізвище: {user.lastName}</p>
          <p>Ім'я: {user.firstName}</p>
          <p>По батькові: {user.middleName}</p>
          <p>Час початку роботи: {formData.entryTime}</p>
          <p>Час завершення роботи: {formData.outTime}</p>
          <button type="button" onClick={() => setIsEditing(true)}>
            Редагувати профіль
          </button>
        </div>
      )}

      <h3>Фотографії:</h3>
      <div>
        {user.images.map((image) => (
          <div key={image._id}>
            <img src={`http://localhost:5000/${image.url}`} alt="user" height={200} />
            <button type="button" onClick={() => handleDeleteImage(image._id)}>
              Видалити
            </button>
          </div>
        ))}
      </div>

      {/* Форма для завантаження нової фотографії */}
      <div>
        <h3>Додати нову фотографію:</h3>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="button" onClick={handleUpload}>
          Завантажити
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
