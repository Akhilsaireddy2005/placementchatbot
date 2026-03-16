import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [photo, setPhoto] = useState(user?.profilePhoto || null);
    const [hovering, setHovering] = useState(false);
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        name: user?.name || '',
        college: user?.college || '',
        branch: user?.branch || '',
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Photo must be smaller than 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result;
            setPhoto(base64);
            try {
                // Save photo immediately to the DB
                const res = await api.put('/auth/profile', { ...form, profilePhoto: base64 });
                const { token, ...userData } = res.data;
                updateUser(userData);
                toast.success('Photo saved! ✨');
            } catch {
                toast.error('Failed to save photo');
            }
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = async (e) => {
        e.stopPropagation();
        setPhoto(null);
        try {
            const res = await api.put('/auth/profile', { ...form, profilePhoto: null });
            const { token, ...userData } = res.data;
            updateUser(userData);
            toast.success('Photo removed');
        } catch {
            toast.error('Failed to remove photo');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name) return toast.error('Name is required');
        setLoading(true);
        try {
            const res = await api.put('/auth/profile', { ...form, profilePhoto: photo });
            const { token, ...userData } = res.data;
            updateUser(userData);
            toast.success('Profile updated successfully! ✨');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-body animate-in">
            <div style={{ marginBottom: 40, animationDelay: '0.1s' }} className="animate-in">
                <h2 className="page-title text-gradient">Your Profile</h2>
                <p className="page-subtitle">View and update your personal details</p>
            </div>

            <div className="glass-card animate-in stagger-1" style={{ maxWidth: 800, padding: 40 }}>
                <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>

                    {/* Avatar Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minWidth: 130 }}>

                        {/* Clickable Avatar */}
                        <div
                            style={{ position: 'relative', cursor: 'pointer' }}
                            onMouseEnter={() => setHovering(true)}
                            onMouseLeave={() => setHovering(false)}
                            onClick={() => fileInputRef.current?.click()}
                            title="Click to upload photo"
                        >
                            <div style={{
                                width: 120, height: 120, borderRadius: 30,
                                background: photo ? 'transparent' : 'linear-gradient(135deg, var(--accent-1), var(--accent-3))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: 48, color: '#fff',
                                boxShadow: '0 12px 30px rgba(99, 102, 241, 0.3)',
                                border: hovering ? '2px solid rgba(99,102,241,0.6)' : '1px solid var(--glass-border-light)',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                            }}>
                                {photo
                                    ? <img src={photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : (user?.name?.[0]?.toUpperCase() || 'U')
                                }
                            </div>

                            {/* Hover overlay */}
                            <div style={{
                                position: 'absolute', inset: 0, borderRadius: 30,
                                background: 'rgba(0,0,0,0.4)',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: 4,
                                opacity: hovering ? 1 : 0,
                                transition: 'opacity 0.25s ease',
                                backdropFilter: 'blur(2px)',
                                pointerEvents: 'none',
                            }}>
                                <span style={{ fontSize: 24 }}>📷</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 0.5, textTransform: 'uppercase' }}>Change Photo</span>
                            </div>
                        </div>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handlePhotoChange}
                        />

                        <div className="badge badge-accent">{user?.role || 'Student'}</div>

                        {/* Upload hint */}
                        {!photo && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
                                Click avatar to<br />upload photo
                            </span>
                        )}

                        {photo && (
                            <button onClick={removePhoto} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline', padding: 0
                            }}>
                                Remove photo
                            </button>
                        )}
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="grid-cols-2">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input type="text" name="name" className="form-input" value={form.name} onChange={handleChange} placeholder="Your Full Name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address (Read-Only)</label>
                                <input type="email" className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                            </div>
                        </div>

                        <div className="grid-cols-2">
                            <div className="form-group">
                                <label className="form-label">College Name</label>
                                <input type="text" name="college" className="form-input" value={form.college} onChange={handleChange} placeholder="e.g. IIT Bombay" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Branch / Department</label>
                                <input type="text" name="branch" className="form-input" value={form.branch} onChange={handleChange} placeholder="e.g. Computer Science" />
                            </div>
                        </div>

                        <div style={{ paddingTop: 16, borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 160 }}>
                                {loading ? <span className="spinner" /> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
