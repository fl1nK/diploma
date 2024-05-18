// const User = require('../Models/User'); // This has data to be used
const excelJS = require('exceljs');

const exportUser = async (req, res) => {
  const User = req.body;

  const workbook = new excelJS.Workbook(); // Створюємо новий робочий зошит
  const worksheet = workbook.addWorksheet('Виявлені люди'); // Новий аркуш

  // Колонки для даних в Excel. Ключі повинні відповідати ключам об'єктів User
  worksheet.columns = [
    { header: 'First Name', key: 'firstName', width: 15 },
    { header: 'Last Name', key: 'lastName', width: 15 },
    { header: 'Middle Name', key: 'middleName', width: 15 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Time', key: 'time', width: 15 },
  ];

  // Проходимося по даним користувачів
  let counter = 1;
  User.forEach((user) => {
    // Додаємо рядок з даними в аркуш
    worksheet.addRow({
      firstName: user.userID.firstName,
      lastName: user.userID.lastName,
      middleName: user.userID.middleName,
      date: user.date,
      time: user.time,
    });
    counter++;
  });

  // Робимо перший рядок в Excel жирним
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });

  try {
    // Встановлюємо заголовки для завантаження файлу Excel
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=users.xlsx`);

    // Записуємо Excel файл у відповідь серверу
    return workbook.xlsx.write(res).then(() => {
      res.status(200);
    });
  } catch (err) {
    res.send({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

module.exports = { exportUser };
