import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';
import {useDispatch} from "react-redux";
import {setToken} from "../reduser/authSlice";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [message, setMessage] = useState('');
    const [isFormValid, setIsFormValid] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/login', { email, password });

            const token = await response.data.token;
            if (token) {
                dispatch(setToken(token));
            }

            setMessage(response.data.message);
            navigate('/userList');
        } catch (error) {
            setMessage('Невірна ел. пошта чи пароль!!!')
        }
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        validateForm(e.target.value, password);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        validateForm(email, e.target.value);
    };

    const validateForm = (email, password) => {
        if (email.trim() !== '' && password.trim() !== '') {
            setIsFormValid(true);
        } else {
            setIsFormValid(false);
        }
    };

    return (
        <div className='auth__container'>
            <div className='form__container'>
                <h1>Авторизація</h1>
                {message && <div className='form__error'>{message}</div>}
                <form className='form' onSubmit={handleSubmit}>
                    <div className='form__group'>
                        <label className='form__label'>Ел. пошта:</label>
                        <input className='form__input' type="email" value={email}
                               onChange={handleEmailChange} placeholder="Email"/>
                    </div>
                    <div className='form__group'>
                        <label className='form__label'>Пароль:</label>
                        <input className='form__input' type="password" value={password}
                               onChange={handlePasswordChange}
                               placeholder="Password"/>
                    </div>
                    <button className='form__button' type="submit" disabled={!isFormValid}>Увійти</button>
                </form>
            </div>

        </div>

    );
};

export default Login;
