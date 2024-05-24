import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

const initialState = {
    token: Cookies.get('token') || '',
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setToken: (state, action) => {
            state.token = action.payload;
            Cookies.set('token', action.payload, { expires: 1/24 });
        },
        clearToken: (state) => {
            state.token = '';
            Cookies.remove('token');
        },
    },
});

export const { setToken, clearToken } = authSlice.actions;

export default authSlice.reducer;
