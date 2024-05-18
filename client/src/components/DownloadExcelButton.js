import React from 'react';
import axios from 'axios';

const DownloadExcelButton = ({ users }) => {
  const handleDownload = async () => {
    try {
      const response = await axios.post('http://localhost:5000/get-excel', users, {
        responseType: 'blob', // Вказуємо, що очікуємо файл в форматі blob
      });

      // Створюємо URL для завантаження файлу
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users.xlsx'); // Задаємо ім'я файлу
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Помилка під час завантаження Excel файлу:', error);
    }
  };

  return (
    <div>
      <button onClick={handleDownload}>Завантажити Excel</button>
    </div>
  );
};

export default DownloadExcelButton;