import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) return toast.error('Please fill all fields');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', form);
            const { token, ...user } = res.data;
            login(user, token);
            toast.success(`Welcome back, ${user.name}! 🎉`);
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="glass-card auth-card animate-in">
                <div className="auth-logo">
                    <div style={{
                        width: 72, height: 72, margin: '0 auto 20px', borderRadius: 20,
                        background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, boxShadow: '0 8px 30px var(--accent-glow)',
                    }}>🎓</div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to your PlacementBot account</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form stagger-1">
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="you@college.edu"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '8px' }}
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" /> : 'Sign In'}
                    </button>
                </form>

                <div className="auth-link stagger-2">
                    Don't have an account? <Link to="/register">Create one now</Link>
                </div>
            </div>
        </div>
    );
}
