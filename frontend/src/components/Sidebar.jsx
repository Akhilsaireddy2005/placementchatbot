import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
    { to: '/', icon: '🏠', label: 'Dashboard' },
    { to: '/chat', icon: '🤖', label: 'AI Chatbot' },
    { to: '/resume', icon: '📄', label: 'Resume Upload' },
    { to: '/analytics', icon: '📊', label: 'Analytics' },
    { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <aside style={{
            position: 'fixed', top: 0, left: 0,
            width: 'var(--sidebar-width)',
            height: '100vh',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--glass-border)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            padding: '32px 0 24px',
            boxShadow: 'var(--shadow-md)',
            transition: 'background 0.3s ease',
        }}>
            {/* Logo */}
            <div style={{ padding: '0 28px 32px', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: 'var(--glass)', border: '1px solid var(--glass-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, boxShadow: 'var(--shadow-sm)'
                    }}>🎓</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'Outfit, sans-serif' }}>PlacementBot</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI Career Guide</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {navItems.map(({ to, icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '12px 16px', borderRadius: '12px',
                            textDecoration: 'none', fontSize: 15, fontWeight: isActive ? 600 : 500,
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            background: isActive ? 'var(--accent-glow)' : 'transparent',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            borderLeft: isActive ? '3px solid var(--accent-1)' : '3px solid transparent',
                            transform: isActive ? 'translateX(4px)' : 'none'
                        })}
                    >
                        <span style={{ fontSize: 20, opacity: 0.9 }}>{icon}</span>
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* User info + logout */}
            <div style={{ padding: '24px 20px 0', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    padding: '8px', background: 'var(--glass)', borderRadius: 'var(--radius)',
                    border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)'
                }}>
                    {/* Mini avatar */}
                    <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: user?.profilePhoto ? 'transparent' : 'linear-gradient(135deg, var(--accent-1), var(--accent-3))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 16, color: '#fff',
                        overflow: 'hidden', border: '1px solid var(--glass-border-light)'
                    }}>
                        {user?.profilePhoto
                            ? <img src={user.profilePhoto} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : user?.name?.[0]?.toUpperCase()
                        }
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                        {user?.branch && (
                            <span className="badge badge-accent" style={{ fontSize: 9, marginTop: 4 }}>{user?.branch}</span>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}
                >
                    🚪 Sign Out
                </button>
            </div>
        </aside>
    );
}
