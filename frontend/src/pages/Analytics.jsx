import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import api from '../services/api';

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedResumeId, setSelectedResumeId] = useState('');

    const fetchAnalytics = async (resumeId = '') => {
        setLoading(true);
        try {
            const endpoint = resumeId ? `/analytics/skills?resumeId=${resumeId}` : '/analytics/skills';
            const res = await api.get(endpoint);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics(selectedResumeId);
    }, [selectedResumeId]);

    const handleResumeChange = (e) => {
        setSelectedResumeId(e.target.value);
    };

    return (
        <div className="page-body animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                <div>
                    <h2 className="page-title">Placement Analytics</h2>
                    <p className="page-subtitle">Understand your skill distribution and resume performance</p>
                </div>
                
                <div style={{ minWidth: 260 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Select Perspective</div>
                    <select 
                        value={selectedResumeId} 
                        onChange={handleResumeChange}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'var(--glass)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: 14,
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">📊 Aggregate (All Resumes)</option>
                        {data?.resumes?.map(r => (
                            <option key={r.id} value={r.id}>📄 {r.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid-cols-2" style={{ gap: 32 }}>
                {/* Chart Section */}
                <div className="glass-card" style={{ padding: 32, gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <div>
                            <h3 style={{ fontSize: 20, fontWeight: 700 }}>Skill Distribution</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                                {selectedResumeId ? `Specific breakdown for selected resume` : `Top frequencies across your entire career profile`}
                            </p>
                        </div>
                        {selectedResumeId && (
                            <div className="badge badge-primary" style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>INDIVIDUAL VIEW</div>
                        )}
                    </div>
                    
                    {loading ? (
                        <div style={{ height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <span className="spinner" style={{ width: 40, height: 40 }} />
                        </div>
                    ) : data?.chartData?.length > 0 ? (
                        <div style={{ height: 400, width: '100%' }}>
                            <ResponsiveContainer>
                                <BarChart data={data.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                                    <XAxis dataKey="skill" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                                    <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--glass)' }}
                                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)' }}
                                        itemStyle={{ color: 'var(--accent-1)', fontWeight: 600 }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {data.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent-1)' : 'var(--accent-2)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty-state">No skill data available. Upload resumes to see analytics.</div>
                    )}
                </div>

                {/* Score Summary & Roadmap */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Individual Insight</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {selectedResumeId ? (
                            (() => {
                                const r = data.resumes.find(res => res.id === selectedResumeId);
                                const fullResume = data.fullResumes?.find(res => res._id === selectedResumeId) || r;
                                return r ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        <div style={{ padding: 20, background: 'var(--accent-glow)', borderRadius: 16, border: '1px solid var(--accent-1)', textAlign: 'center' }}>
                                            <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--accent-1)', marginBottom: 8 }}>{r.atsScore}%</div>
                                            <div style={{ fontWeight: 700, fontSize: 16 }}>{r.name}</div>
                                        </div>

                                        {fullResume?.skillRoadmap?.length > 0 && (
                                            <div>
                                                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--accent-1)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Learning Roadmap</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    {fullResume.skillRoadmap.map((step, i) => (
                                                        <div key={i} style={{ padding: 12, background: 'var(--glass)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                                                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>{i + 1}. {step.topic}</span>
                                                                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: step.priority === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)', color: step.priority === 'High' ? 'var(--red)' : 'var(--accent-1)', fontWeight: 700 }}>{step.priority}</span>
                                                            </div>
                                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{step.tip}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => window.location.href = '/resumes'}>View Full Analysis</button>
                                    </div>
                                ) : null;
                            })()
                        ) : (
                            data?.resumes?.map((r) => (
                                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--glass)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                                    <div style={{ maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{r.skillCount} skills</div>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: r.atsScore >= 70 ? 'var(--green)' : r.atsScore >= 40 ? 'var(--orange)' : 'var(--red)' }}>{r.atsScore}%</div>
                                </div>
                            ))
                        )}
                        {(!data?.resumes || data.resumes.length === 0) && <div className="empty-state" style={{ padding: 30 }}><p>No resumes uploaded</p></div>}
                    </div>
                </div>

                {/* Recommendations */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Growth Opportunities</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                        {selectedResumeId ? `Highly relevant to this specific resume & role:` : `High-demand skills found in top placement candidates:`}
                    </p>
                    <div className="skill-tags">
                        {['System Design', 'AWS', 'Docker', 'Machine Learning', 'CI/CD', 'Kubernetes', 'Microservices', 'Unit Testing'].filter(s => !data?.chartData?.find(d => d.skill.toLowerCase() === s.toLowerCase())).slice(0, 6).map(skill => (
                            <span key={skill} className="skill-tag" style={{ borderStyle: 'dashed', background: 'transparent', opacity: 0.8 }}>+ {skill}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
