import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', college: '', branch: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) return toast.error('Please fill required fields');
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
        setLoading(true);
        try {
            const res = await api.post('/auth/register', form);
            const { token, ...user } = res.data;
            login(user, token);
            toast.success(`Welcome, ${user.name}! 🎓`);
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { key: 'name', label: 'Full Name *', type: 'text', placeholder: 'John Doe' },
        { key: 'email', label: 'Email Address *', type: 'email', placeholder: 'you@college.edu' },
        { key: 'password', label: 'Password *', type: 'password', placeholder: '6+ characters' },
        { key: 'college', label: 'College Name', type: 'text', placeholder: 'e.g. IIT Bombay' },
        { key: 'branch', label: 'Branch / Department', type: 'text', placeholder: 'e.g. Computer Science' },
    ];

    return (
        <div className="auth-page">
            <div className="glass-card auth-card animate-in" style={{ maxWidth: 520, padding: '48px' }}>
                <div className="auth-logo">
                    <div style={{
                        width: 72, height: 72, margin: '0 auto 20px', borderRadius: 20,
                        background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, boxShadow: '0 8px 30px var(--accent-glow)',
                    }}>🎓</div>
                    <h1>Create Account</h1>
                    <p>Join PlacementBot and ace your placements</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form stagger-1" style={{ gap: '20px' }}>
                    {fields.map(({ key, label, type, placeholder }) => (
                        <div className="form-group" key={key}>
                            <label className="form-label">{label}</label>
                            <input
                                className="form-input"
                                type={type}
                                placeholder={placeholder}
                                value={form[key]}
                                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            />
                        </div>
                    ))}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '12px' }}
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" /> : 'Create Account'}
                    </button>
                </form>

                <div className="auth-link stagger-2">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
