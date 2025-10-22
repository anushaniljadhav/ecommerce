import React, { useEffect, useState } from 'react';
import api from '../services/Api';
import '../styles/Admin.css';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/admin/users');
      setUsers(resp.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (id, isAdmin) => {
    try {
      await api.post(`/admin/users/${id}/admin`, { is_admin: !isAdmin });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-page container">
      <h1>Admin — User Management</h1>
      <p>Manage registered users: promote to admin or remove accounts.</p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Logins</th>
            <th>Last Login</th>
            <th>Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.login_count ?? 0}</td>
              <td>{u.last_login ? new Date(u.last_login).toLocaleString() : '—'}</td>
              <td>{u.is_admin ? 'Yes' : 'No'}</td>
              <td style={{display:'flex',gap:8}}>
                <button className="btn btn-outline" onClick={() => toggleAdmin(u.id, u.is_admin)}>
                  {u.is_admin ? 'Demote' : 'Promote'}
                </button>
                <button className="btn btn-danger" onClick={() => deleteUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Admin;
