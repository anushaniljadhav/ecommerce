import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // prefill from registration redirect
  React.useEffect(() => {
    if (location.state?.prefillEmail) setEmail(location.state.prefillEmail);
    if (location.state?.prefillPassword) setPassword(location.state.prefillPassword);
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="container auth-container">
        <h1>Welcome back</h1>
        <p>Sign in to access your account and continue shopping</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{marginTop:12, display:'flex', gap:10}}>
          <button className="btn" style={{background:'rgba(255,255,255,0.06)',color:'#fff',border:'1px solid rgba(255,255,255,0.06)'}}>Continue with Google</button>
          <button className="btn" style={{background:'rgba(255,255,255,0.02)',color:'#fff',border:'1px solid rgba(255,255,255,0.04)'}}>Continue with Apple</button>
        </div>

        <div className="auth-footer">
          <span style={{opacity:0.95}}>Don't have an account? </span>
          <Link to="/register" style={{color:'#ffd1dc',marginLeft:6}}>Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
