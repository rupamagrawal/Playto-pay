import { useState, useEffect } from 'react';
import api from './api';
import SubmissionDetail from './SubmissionDetail';

export default function ReviewerDashboard() {
    const [metrics, setMetrics] = useState({});
    const [submissions, setSubmissions] = useState([]);
    const [selectedId, setSelectedId] = useState(null);

    const fetchData = async () => {
        try {
            const metRes = await api.get('reviewer/queue/metrics/');
            setMetrics(metRes.data);
            const subRes = await api.get('reviewer/queue/');
            setSubmissions(subRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
        if(!selectedId) {
            const interval = setInterval(fetchData, 30000); 
            return () => clearInterval(interval);
        }
    }, [selectedId]);

    if (selectedId) {
        return <SubmissionDetail id={selectedId} onBack={() => {setSelectedId(null); fetchData();}} />;
    }

    return (
        <div className="min-h-screen bg-neutral-50 px-4 py-12 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-2">Reviewer Workspace</h1>
                        <p className="text-neutral-500">Monitor and adjudicate incoming merchant applications.</p>
                    </div>
                </div>
                
                {/* Minimalist Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-center">
                        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">Queue Count</div>
                        <div className="text-4xl font-light tracking-tight text-neutral-900">{metrics.queue_count || 0}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-center">
                        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">Avg Time in Queue</div>
                        <div className="text-4xl font-light tracking-tight text-neutral-900">{metrics.avg_time_in_queue_hours || 0} <span className="text-xl text-neutral-400">hrs</span></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-center">
                        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">7-Day Approval Rate</div>
                        <div className="text-4xl font-light tracking-tight text-neutral-900">{metrics.approval_rate_last_7_days || 0}<span className="text-xl text-neutral-400">%</span></div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-500">
                            <tr>
                                <th className="px-8 py-5 font-medium">Application ID</th>
                                <th className="px-8 py-5 font-medium">Business Name</th>
                                <th className="px-8 py-5 font-medium">Current Status</th>
                                <th className="px-8 py-5 font-medium">Time Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {submissions.map(sub => (
                                <tr key={sub.id} 
                                    onClick={() => setSelectedId(sub.id)}
                                    className={`cursor-pointer transition-colors ${sub.is_at_risk ? 'bg-orange-50/50 hover:bg-orange-50' : 'hover:bg-neutral-50'}`}>
                                    <td className="px-8 py-6 font-medium text-neutral-900">#{sub.id.toString().padStart(4, '0')}</td>
                                    <td className="px-8 py-6 text-neutral-600">{sub.business_name || (
                                        <span className="italic text-neutral-400">Incomplete Profile</span>
                                    )}</td>
                                    <td className="px-8 py-6">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wide
                                            ${['approved'].includes(sub.status) ? 'bg-emerald-100 text-emerald-800' : 
                                              ['rejected'].includes(sub.status) ? 'bg-rose-100 text-rose-800' :
                                              ['draft'].includes(sub.status) ? 'bg-neutral-100 text-neutral-600' :
                                              'bg-blue-50 text-blue-700'}`}>
                                            {sub.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-neutral-500">
                                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString(undefined, {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        }) : '--'}
                                    </td>
                                </tr>
                            ))}
                            {submissions.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-8 py-16 text-center text-neutral-400">Queue is completely clear.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
