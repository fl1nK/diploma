import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const Registration = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isFormValid, setIsFormValid] = useState(false);

    const token = useSelector((state) => state.auth.token);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/register', { email, password }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            alert('User registered');
        } catch (error) {
            alert('Registration failed');
        }
    };

    const handleEmailChange = (e) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        setEmailError(validateEmail(newEmail));
        validateForm(newEmail, password);
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordError(validatePassword(newPassword));
        validateForm(email, newPassword);
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(email)) {
            return 'Email недійсний';
        }
        return '';
    };

    const validatePassword = (password) => {
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        if (password.length < 8) {
            return 'Пароль повинен містити принаймні 8 символів';
        }
        if (!re.test(password)) {
            return 'Пароль повинен містити хоча б одну маленьку літеру, одну велику літеру та одну цифру';
        }
        return '';
    };

    const validateForm = (email, password) => {
        const emailValid = validateEmail(email) === '';
        const passwordValid = validatePassword(password) === '';
        if (emailValid && passwordValid && email.trim() !== '' && password.trim() !== '') {
            setIsFormValid(true);
        } else {
            setIsFormValid(false);
        }
    };

    return (
        <div className='auth__container'>
            <div className='form__container'>
                <h1>Реєстрація адміна</h1>
                <form className='form' onSubmit={handleSubmit}>
                    <div className='form__group'>
                        <label className='form__label'>Ел. пошта:</label>
                        <input
                            className='form__input'
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="Email"
                        />
                        {emailError && <p className='form__error'>{emailError}</p>}
                    </div>
                    <div className='form__group'>
                        <label className='form__label'>Пароль:</label>
                        <input
                            className='form__input'
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            placeholder="Password"
                        />
                        {passwordError && <p className='form__error'>{passwordError}</p>}
                    </div>
                    <button className='form__button' type="submit" disabled={!isFormValid}>
                        Створити
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Registration;
