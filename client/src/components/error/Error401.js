import { NavLink } from 'react-router-dom';

const Error401 = () => {
  return (
    <div>
      <h1>Користувач не авторизований!!!</h1>
      <NavLink to="/">Перейдіть за посиланям.</NavLink>
    </div>
  );
};

export default Error401;
