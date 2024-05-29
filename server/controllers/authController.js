const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const Admin = require('../models/Admin');

const registration = async (req, res) => {
    try{
        const {password} = req.body;

        const email = req.body.email.toString();

        const admin = await Admin.findOne({ email: email });
        if (admin) {
            return res.status(400).json({message: `Адмін з таким логіном ${email} вже існує!`})
        }

        const hashPassword = bcrypt.hashSync(password, 7);

        const user = new Admin({email, password: hashPassword})
        await user.save()

        return res.status(201).json({message: "Адміна було створено!"})

    } catch (e) {
        console.log(e)
        res.send({message: "Server error"})
    }
}

const login = async (req, res) => {
    try{
        const {password} = req.body;

        const email = req.body.email.toString();

        const admin = await Admin.findOne({ email: email });
        if (!admin) {
            return res.status(404).json({message: "Такого адмін не існує!"})
        }

        const isPassValid = bcrypt.compareSync(password, admin.password);
        if (!isPassValid) {
            return res.status(400).json({message: "Невірний логін чи пароль"})
        }

        const token = jwt.sign({id: admin.id}, process.env.SECRET_KEY, {expiresIn: "1h"})
        res.json({
            token:token,
            message: 'Користувач успішно авторизувався'
        })

    } catch (e) {
        console.log(e)
        res.send({message: "Server error"})
    }
}

module.exports = {
    registration,
    login,
};