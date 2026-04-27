import { useState } from 'react';
import api from './api';

export default function LoginPage({ onLogin, navigate }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('auth/login/', { email, password });
            onLogin(res.data.token, res.data.role);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 px-4">
            <div className="w-full max-w-sm bg-white p-10 rounded-2xl shadow-sm border border-neutral-100">
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">Playto Pay</h1>
                    <p className="text-sm text-neutral-500">Sign in to your account</p>
                </div>
                
                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Email</label>
                        <input 
                            type="email" 
                            className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 
                                     focus:bg-white focus:border-neutral-900 focus:ring-0 outline-none transition-all text-sm" 
                            value={email} onChange={e => setEmail(e.target.value)} required 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Password</label>
                        <input 
                            type="password" 
                            className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 
                                     focus:bg-white focus:border-neutral-900 focus:ring-0 outline-none transition-all text-sm" 
                            value={password} onChange={e => setPassword(e.target.value)} required 
                        />
                    </div>
                    <button type="submit" className="w-full mt-2 bg-neutral-900 text-white font-medium py-3 rounded-lg hover:bg-neutral-800 transition-colors">
                        Continue
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button onClick={() => navigate('register')} className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
                        Apply as a new merchant &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
}
