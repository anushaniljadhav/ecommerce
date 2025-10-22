import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Register.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);

    if (result.success) {
      // show success popup then redirect to login with credentials prefilled
      // we'll clear local auth state (AuthContext sets token/user on register) so user must login
      // show a brief modal-like message
      const popup = document.createElement('div');
      popup.style.position = 'fixed';
      popup.style.left = '50%';
      popup.style.top = '20%';
      popup.style.transform = 'translateX(-50%)';
      popup.style.background = '#e8f7e8';
      popup.style.border = '1px solid #cfeccf';
      popup.style.padding = '16px 20px';
      popup.style.borderRadius = '8px';
      popup.style.zIndex = 9999;
      popup.innerText = 'Registered successfully! Redirecting to login...';
      document.body.appendChild(popup);
      setTimeout(() => {
        document.body.removeChild(popup);
        // redirect to login and pass credentials to prefill
        navigate('/login', { state: { prefillEmail: email, prefillPassword: password } });
      }, 1500);
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="container auth-container">
        <h1>Register</h1>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />

          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />

          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account? </span>
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
