import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ResumeUpload() {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [analyzingId, setAnalyzingId] = useState(null);

    const loadResumes = useCallback(async () => {
        try {
            const res = await api.get('/resume/list');
            setResumes(res.data);
        } catch (err) {
            toast.error('Failed to load resumes');
        }
    }, []);

    useEffect(() => { loadResumes(); }, [loadResumes]);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            return toast.error('File size must be < 10MB');
        }

        const formData = new FormData();
        formData.append('resume', file);

        setLoading(true);
        const toastId = toast.loading('Uploading and analyzing resume...');

        try {
            await api.post('/resume/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Resume analyzed successfully!', { id: toastId });
            loadResumes();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
        } finally {
            setLoading(false);
        }
    }, [loadResumes]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }, maxFiles: 1,
    });

    const deleteResume = async (id) => {
        if (!window.confirm('Delete this resume?')) return;
        try {
            await api.delete(`/resume/${id}`);
            setResumes(prev => prev.filter(r => r._id !== id));
            toast.success('Resume deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const [selectedResume, setSelectedResume] = useState(null);

    const viewDetails = async (id) => {
        setAnalyzingId(id);
        try {
            const res = await api.get(`/resume/${id}`);
            setSelectedResume(res.data);
        } catch {
            toast.error('Failed to load details');
        } finally {
            setAnalyzingId(null);
        }
    };

    return (
        <div className="page-body animate-in" style={{ display: 'flex', gap: 32 }}>
            {/* Upload & List */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div {...getRootProps()} className="glass-card" style={{
                    padding: 40, textAlign: 'center', cursor: 'pointer', borderStyle: 'dashed',
                    borderColor: isDragActive ? 'var(--accent)' : 'var(--border)',
                    background: isDragActive ? 'rgba(99,102,241,0.05)' : 'var(--glass)',
                }}>
                    <input {...getInputProps()} />
                    <div style={{ fontSize: 48, marginBottom: 16 }}>{isDragActive ? '📥' : '📄'}</div>
                    <h3 style={{ marginBottom: 8 }}>{isDragActive ? 'Drop resume here' : 'Drag & Drop your Resume'}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Supports PDF and DOCX (Max 10MB)</p>
                    <button className="btn btn-primary" disabled={loading}>
                        {loading ? <span className="spinner" /> : 'Browse Files'}
                    </button>
                </div>

                <div className="glass-card" style={{ padding: 24, flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Your Resumes</h3>
                    {resumes.length === 0 ? (
                        <div className="empty-state"><p>No resumes uploaded yet</p></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {resumes.map((r) => (
                                <div key={r._id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16,
                                    background: selectedResume?._id === r._id ? 'rgba(99,102,241,0.1)' : 'var(--glass)',
                                    border: `1px solid ${selectedResume?._id === r._id ? 'var(--accent-glow)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius)', cursor: 'pointer',
                                }} onClick={() => viewDetails(r._id)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ fontSize: 24, padding: 12, background: 'var(--glass-border)', borderRadius: 8 }}>{r.fileType === 'pdf' ? '📕' : '📘'}</div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{r.originalName}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                                {new Date(r.createdAt).toLocaleDateString()} • {r.atsScore}% ATS
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); viewDetails(r._id); }}>
                                            {analyzingId === r._id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '🔍'}
                                        </button>
                                        <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={(e) => { e.stopPropagation(); deleteResume(r._id); }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Analysis Details */}
            <div style={{ width: 400 }}>
                {selectedResume ? (
                    <div className="glass-card animate-in" style={{ padding: 24, position: 'sticky', top: 'calc(var(--navbar-height) + 32px)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>ATS Analysis</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedResume.originalName}</p>
                            </div>
                            <div className={`ats-circle ats-${selectedResume.atsScore >= 70 ? 'high' : selectedResume.atsScore >= 40 ? 'medium' : 'low'}`}>
                                {selectedResume.atsScore}%
                            </div>
                        </div>

                        <div style={{ marginBottom: 24, padding: 16, background: 'var(--accent-glow)', borderRadius: 12, border: '1px solid var(--accent-1)' }}>
                            <div style={{ fontSize: 11, color: 'var(--accent-1)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Best Fit For</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedResume.industryFit}</div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Analysis Summary</h4>
                            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{selectedResume.summary}</p>
                        </div>

                        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                            <div style={{ flex: 1, padding: 12, background: 'var(--glass)', borderRadius: 8, border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedResume.wordCount}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Words</div>
                            </div>
                            <div style={{ flex: 1, padding: 12, background: 'var(--glass)', borderRadius: 8, border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedResume.skills.length}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Skills</div>
                            </div>
                        </div>

                        {selectedResume.improvementTips?.length > 0 && (
                            <div style={{ marginBottom: 32 }}>
                                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 0.5 }}>⚡ Quick Improvements</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {selectedResume.improvementTips.map((tip, i) => (
                                        <div key={i} style={{ fontSize: 13, display: 'flex', gap: 12, color: 'var(--text-secondary)', background: 'rgba(251, 191, 36, 0.05)', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(251, 191, 36, 0.1)' }}>
                                            <span style={{ color: 'var(--orange)', fontWeight: 800 }}>•</span>
                                            {tip}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedResume.skillRoadmap?.length > 0 && (
                            <div style={{ marginBottom: 32 }}>
                                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 20, color: 'var(--accent-1)', textTransform: 'uppercase', letterSpacing: 0.5 }}>🛣️ Personalized Learning Path</h4>
                                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 24, paddingLeft: 8 }}>
                                    {/* Vertical Line */}
                                    <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, var(--accent-1), transparent)', opacity: 0.3 }} />
                                    
                                    {selectedResume.skillRoadmap.map((step, i) => (
                                        <div key={i} style={{ position: 'relative', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                                            <div style={{ 
                                                width: 32, height: 32, borderRadius: '50%', background: step.priority === 'High' ? 'var(--accent-1)' : 'var(--glass)', 
                                                border: '2px solid var(--accent-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                fontSize: 14, fontWeight: 800, color: step.priority === 'High' ? 'white' : 'var(--accent-1)', zIndex: 1, flexShrink: 0
                                            }}>
                                                {i + 1}
                                            </div>
                                            <div style={{ flex: 1, padding: 16, background: 'var(--glass)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{step.topic}</div>
                                                    <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: step.priority === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)', color: step.priority === 'High' ? 'var(--red)' : 'var(--accent-1)', fontWeight: 700 }}>{step.priority}</div>
                                                </div>
                                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step.tip}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: 24 }}>
                            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Technical Skills</h4>
                            <div className="skill-tags">
                                {selectedResume.skills.map((s) => <span key={s} className="skill-tag">{s}</span>)}
                            </div>
                        </div>

                        <div>
                            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Keyword Density</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {Object.entries(selectedResume.keywordsFrequency || {}).slice(0, 8).map(([word, freq]) => (
                                    <div key={word} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '8px 12px', background: 'var(--glass)', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                                        <span style={{ textTransform: 'capitalize' }}>{word}</span>
                                        <span style={{ color: 'var(--accent-1)', fontWeight: 700 }}>{freq}x</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card empty-state" style={{ height: '100%', borderStyle: 'dashed', position: 'sticky', top: 'calc(var(--navbar-height) + 32px)' }}>
                        <span style={{ fontSize: 48, marginBottom: 16 }}>📊</span>
                        <p style={{ maxWidth: 200 }}>Select a resume to view its detailed ATS analysis.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
