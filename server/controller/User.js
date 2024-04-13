const User = require("../models/User");
const excelJS = require("exceljs");

const exportUser = async (req, res) => {
  const workbook = new excelJS.Workbook(); // Create a new workbook
  const worksheet = workbook.addWorksheet("My Users"); // New Worksheet
  const path = "./files"; // Path to download excel
  // Column for data in excel. key must match data key
  worksheet.columns = [
    { header: "S no.", key: "s_no", width: 10 },
    { header: "First Name", key: "fname", width: 10 },
    { header: "Last Name", key: "lname", width: 10 },
    { header: "Email Id", key: "email", width: 10 },
    { header: "Gender", key: "gender", width: 10 },
  ];
  // Looping through User data
  let counter = 1;
  User.forEach((user) => {
    user.s_no = counter;
    worksheet.addRow(user); // Add data in worksheet
    counter++;
  });
  // Making first line in excel bold
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  try {
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=users.xlsx`);

    return workbook.xlsx.write(res).then(() => {
      res.status(200);
    });

    // await workbook.xlsx.writeFile(`${path}/users.xlsx`).then(() => {
    //   res.send({
    //     status: "success",
    //     message: "file successfully downloaded",
    //     path: `${path}/users.xlsx`,
    //   });
    // });
  } catch (err) {
    res.send({
      status: "error",
      message: err,
    });
  }
};

const createUser = async (req, res) => {
  const user = new User({
    first_name: "Vlad",
    last_name: "Filonenko",
  });
  await user.save();
  return res.json({ message: "Користувача було створено" });
};

module.exports = { exportUser, createUser };
