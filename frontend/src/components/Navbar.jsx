import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const pageTitles = {
    '/': { title: 'Dashboard', sub: 'Your placement overview' },
    '/chat': { title: 'AI Placement Chatbot', sub: 'Ask anything about placements' },
    '/resume': { title: 'Resume Analyzer', sub: 'Upload and analyze your resume' },
    '/analytics': { title: 'Analytics', sub: 'Skills & placement insights' },
    '/profile': { title: 'Profile', sub: 'Your personal details' },
};

export default function Navbar() {
    const { pathname } = useLocation();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { title, sub } = pageTitles[pathname] || { title: 'PlacementBot', sub: '' };

    return (
        <header style={{
            position: 'fixed',
            top: 0, left: 'var(--sidebar-width)',
            right: 0,
            height: 'var(--navbar-height)',
            background: theme === 'dark' ? 'rgba(5, 5, 15, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 40px', zIndex: 99,
            boxShadow: 'var(--shadow-sm)',
            transition: 'background 0.3s ease',
        }}>
            <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>{title}</h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: 'var(--glass)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 18,
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.role || 'Student'}</span>
                </div>
                <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: user?.profilePhoto ? 'transparent' : 'linear-gradient(135deg, var(--accent-1), var(--accent-3))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 16, color: '#fff',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                    border: '1px solid var(--glass-border-light)',
                    overflow: 'hidden',
                }}>
                    {user?.profilePhoto
                        ? <img src={user.profilePhoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (user?.name?.[0]?.toUpperCase() || 'U')
                    }
                </div>
            </div>
        </header>
    );
}
