import { useState, useEffect } from 'react';
import api from './api';

export default function MerchantDashboard() {
    const [submission, setSubmission] = useState(null);
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '',
        business_name: '', business_type: '', monthly_volume_usd: ''
    });

    const fetchSubmission = async () => {
        try {
            const res = await api.get('submissions/mine/');
            setSubmission(res.data);
            setFormData({
                full_name: res.data.full_name || '',
                email: res.data.email || '',
                phone: res.data.phone || '',
                business_name: res.data.business_name || '',
                business_type: res.data.business_type || '',
                monthly_volume_usd: res.data.monthly_volume_usd || ''
            });
        } catch (err) {
            setError('Failed to load application data.');
        }
    };

    useEffect(() => { fetchSubmission(); }, []);

    const handleSave = async (nextStep) => {
        setError('');
        try {
            await api.put('submissions/mine/', formData);
            if (nextStep) setStep(nextStep);
            else alert('Saved successfully.');
        } catch (err) {
            setError('Could not save progress.');
        }
    };

    const handleUpload = async (doc_type, file) => {
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('doc_type', doc_type);
        uploadData.append('file', file);
        try {
            await api.post('submissions/mine/documents/', uploadData);
            fetchSubmission();
        } catch (err) {
            setError(err.response?.data?.message || `Upload failed.`);
        }
    };

    const handleSubmit = async () => {
        try {
            await api.post('submissions/mine/submit/');
            fetchSubmission();
        } catch (err) {
            setError('Final submission failed.');
        }
    };

    if (!submission) return <div className="min-h-screen flex items-center justify-center text-neutral-400">Loading workspace...</div>;

    const isReadOnly = submission.status !== 'draft';

    const StatusBadge = () => (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider 
            bg-neutral-100 text-neutral-600 border border-neutral-200">
            Current Status: {submission.status.replace(/_/g, ' ')}
        </span>
    );

    return (
        <div className="min-h-screen bg-neutral-50 px-4 py-12 font-sans text-neutral-900">
            <div className="max-w-3xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight mb-2">Merchant Application</h1>
                        <p className="text-neutral-500">Provide the details necessary to verify your business.</p>
                    </div>
                    <div className="mt-4 md:mt-0"><StatusBadge /></div>
                </div>

                {error && <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 font-medium">{error}</div>}

                {/* Read Only State */}
                {isReadOnly ? (
                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-neutral-100 text-center">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                        <h2 className="text-xl font-medium text-neutral-900 mb-2">Application Locked</h2>
                        <p className="text-neutral-500 max-w-md mx-auto mb-6">
                            Your application is currently <span className="font-semibold text-neutral-700">{submission.status.replace(/_/g, ' ')}</span>. 
                            You cannot edit fields whilst it is under review.
                        </p>
                        {submission.reviewer_note && (
                            <div className="text-left bg-neutral-50 p-6 rounded-xl border border-neutral-200 mt-6 max-w-lg mx-auto">
                                <span className="block text-xs uppercase tracking-wide font-semibold text-neutral-500 mb-2">Reviewer Note</span>
                                <p className="text-sm text-neutral-800">{submission.reviewer_note}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden">
                        
                        {/* Step Navigation */}
                        <div className="bg-neutral-50 flex border-b border-neutral-200 px-6">
                            {[1, 2, 3].map((num) => (
                                <button key={num} onClick={() => setStep(num)} 
                                    className={`flex-1 py-5 text-sm font-medium transition-colors ${step === num ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}>
                                    {num === 1 ? 'Personal' : num === 2 ? 'Business' : 'Documents'}
                                </button>
                            ))}
                        </div>

                        {/* Form Area */}
                        <div className="p-8 sm:p-12">
                            <div className="flex flex-col gap-6">
                                {step === 1 && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">Full Legal Name</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-neutral-900 outline-none transition-all text-sm" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">Email</label>
                                                <input type="email" className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-neutral-900 outline-none transition-all text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">Phone</label>
                                                <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-neutral-900 outline-none transition-all text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">Business Name</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-neutral-900 outline-none transition-all text-sm" value={formData.business_name} onChange={e => setFormData({...formData, business_name: e.target.value})} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">Entity Type</label>
                                                <input type="text" placeholder="e.g. LLC, Corporation" className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-neutral-900 outline-none transition-all text-sm" value={formData.business_type} onChange={e => setFormData({...formData, business_type: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">Monthly Processing Vol (USD)</label>
                                                <input type="number" className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-neutral-900 outline-none transition-all text-sm" value={formData.monthly_volume_usd} onChange={e => setFormData({...formData, monthly_volume_usd: e.target.value})} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {step < 3 && (
                                    <div className="mt-4 pt-6 border-t border-neutral-100 flex justify-end">
                                        <button onClick={() => handleSave(step + 1)} className="px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium transition-colors">
                                            Save & Continue &rarr;
                                        </button>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="flex flex-col gap-4">
                                        {['pan', 'aadhaar', 'bank_statement'].map(type => {
                                            const isUploaded = submission.documents.find(d => d.doc_type === type);
                                            return (
                                                <div key={type} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-neutral-200 bg-neutral-50">
                                                    <div>
                                                        <p className="font-medium text-neutral-900 capitalize">{type.replace('_', ' ')}</p>
                                                        <p className="text-xs text-neutral-500 mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                                                    </div>
                                                    <div className="mt-4 sm:mt-0">
                                                        {isUploaded ? (
                                                            <span className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                                Uploaded safely
                                                            </span>
                                                        ) : (
                                                            <input type="file" 
                                                                className="text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer"
                                                                onChange={(e) => handleUpload(type, e.target.files[0])} 
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="mt-8 pt-8 border-t border-neutral-100 text-center">
                                            <button onClick={handleSubmit} className="px-8 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-sm w-full sm:w-auto transition-transform active:scale-95">
                                                Submit Final Application
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
