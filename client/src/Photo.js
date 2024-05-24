import React, { useState } from 'react';
import axios from 'axios';

function Photo() {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    photos: [],
  });
  const [photoUrl, setPhotoUrl] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, photos: files });
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formData.photos.forEach((photo, index) => {
      formDataToSend.append(`photo${index + 1}`, photo);
    });
    axios
      .post('http://localhost:5000/test', formDataToSend,{
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then((response) => {
        console.log('Photo uploaded:', response.data.photosUrl);
        console.log('Photo uploaded:', response.data.photosUrl[0]);

        setPhotoUrl(`http://localhost:5000/${response.data.photosUrl[0]}`); // Зберігаємо URL фотографії
      })
      .catch((error) => {
        console.error('Error uploading photo:', error);
      });
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>

      {/* Відображення фотографії, якщо URL доступний */}
      {photoUrl && (
        <img src={photoUrl} alt="Uploaded" style={{ maxWidth: '100%', height: 'auto' }} />
      )}
    </div>
  );
}

export default Photo;
