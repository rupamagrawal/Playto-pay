import { useState, useEffect } from 'react';
import api from './api';

export default function SubmissionDetail({ id, onBack }) {
    const [sub, setSub] = useState(null);
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`reviewer/submissions/${id}/`).then(res => setSub(res.data)).catch(err => setError('Failed to load detail.'));
    }, [id]);

    const handleTransition = async (to_state) => {
        if ((to_state === 'rejected' || to_state === 'more_info_requested') && !note) {
            setError(`A note is strictly required to transition to ${to_state.replace(/_/g, ' ')}`);
            return;
        }
        setError('');
        try {
            const res = await api.post(`reviewer/submissions/${id}/transition/`, { to_state, note });
            setSub(res.data);
            setNote('');
        } catch (err) {
            setError(err.response?.data?.message || 'Transition failed.');
        }
    };

    if (!sub) return <div className="min-h-screen flex items-center justify-center text-neutral-400">Fetching dossier...</div>;

    const isActive = ['submitted', 'under_review'].includes(sub.status);

    return (
        <div className="min-h-screen bg-neutral-50 px-4 py-12 font-sans">
            <div className="max-w-4xl mx-auto">
                <button onClick={onBack} className="text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-8 transition-colors flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Queue
                </button>
                
                <div className="flex flex-col md:flex-row justify-between md:items-end mb-10 pb-6 border-b border-neutral-200">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-2">{sub.business_name || 'Application Data'}</h1>
                        <p className="text-neutral-500 font-medium">#{sub.id.toString().padStart(4, '0')} &bull; {sub.email}</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200">
                            {sub.status.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>

                {error && <div className="mb-8 p-4 rounded-xl bg-orange-50 text-orange-800 text-sm border border-orange-100 font-medium">{error}</div>}

                {/* Read Only Data Blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
                        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-6">Business Entity</h2>
                        <div className="space-y-5">
                            <div>
                                <p className="text-xs text-neutral-500 mb-1">Official Name</p>
                                <p className="font-medium text-neutral-900">{sub.business_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-500 mb-1">Type</p>
                                <p className="font-medium text-neutral-900">{sub.business_type}</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-500 mb-1">Declared Volume (Monthly)</p>
                                <p className="font-medium text-neutral-900">${parseFloat(sub.monthly_volume_usd).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
                        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-6">Primary Contact</h2>
                        <div className="space-y-5">
                            <div>
                                <p className="text-xs text-neutral-500 mb-1">Full Name</p>
                                <p className="font-medium text-neutral-900">{sub.full_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-500 mb-1">Phone</p>
                                <p className="font-medium text-neutral-900">{sub.phone}</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-500 mb-1">Time Submitted</p>
                                <p className="font-medium text-neutral-900">{new Date(sub.submitted_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 mb-8">
                    <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-6">Verified Documents</h2>
                    {sub.documents.length === 0 ? (
                        <p className="text-sm text-neutral-400 italic">No files provided.</p>
                    ) : (
                        <div className="flex flex-wrap gap-4">
                            {sub.documents.map(doc => (
                                <a key={doc.id} href={`http://localhost:8000${doc.file}`} target="_blank" rel="noreferrer" 
                                   className="inline-flex items-center px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 text-sm font-medium hover:bg-neutral-100 hover:border-neutral-300 transition-colors">
                                    <svg className="w-4 h-4 mr-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                    <span className="uppercase">{doc.doc_type.replace('_', ' ')}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Pad */}
                {isActive && (
                    <div className="bg-neutral-100 p-8 rounded-3xl border border-neutral-200">
                        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">Adjudication Decision</h2>
                        
                        {(sub.status === 'under_review' || sub.status === 'submitted') && (
                            <textarea 
                                className="w-full px-4 py-3 rounded-xl border border-white bg-white focus:border-neutral-900 focus:ring-0 outline-none transition-all text-sm min-h-[100px] mb-6 shadow-sm resize-none" 
                                placeholder="Mandatory notes for requests or rejections..." 
                                value={note} onChange={e => setNote(e.target.value)}
                            />
                        )}

                        <div className="flex flex-wrap gap-3">
                            {sub.status === 'submitted' && (
                               <button onClick={() => handleTransition('under_review')} className="px-6 py-2.5 rounded-lg bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 transition-colors">
                                   Lock & Review Application
                               </button>
                            )}
                            {sub.status === 'under_review' && (
                                <>
                                    <button onClick={() => handleTransition('approved')} className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors">
                                        Approve
                                    </button>
                                    <button onClick={() => handleTransition('more_info_requested')} className="px-6 py-2.5 rounded-lg bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition-colors">
                                        Request Additional Info
                                    </button>
                                    <button onClick={() => handleTransition('rejected')} className="px-6 py-2.5 rounded-lg bg-rose-600 text-white font-medium text-sm hover:bg-rose-700 transition-colors">
                                        Reject
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
