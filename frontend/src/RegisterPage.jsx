import { useState } from 'react';
import api from './api';

export default function RegisterPage({ navigate }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('auth/register/', { email, password, role: 'merchant' });
            navigate('login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 px-4 font-sans">
            <div className="w-full max-w-sm bg-white p-10 rounded-2xl shadow-sm border border-neutral-100">
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">Join Playto Pay</h1>
                    <p className="text-sm text-neutral-500">Create your merchant identity</p>
                </div>
                
                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Business Email</label>
                        <input 
                            type="email" 
                            className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 
                                     focus:bg-white focus:border-neutral-900 focus:ring-0 outline-none transition-all text-sm" 
                            value={email} onChange={e => setEmail(e.target.value)} required 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Secure Password</label>
                        <input 
                            type="password" 
                            className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 
                                     focus:bg-white focus:border-neutral-900 focus:ring-0 outline-none transition-all text-sm" 
                            value={password} onChange={e => setPassword(e.target.value)} required 
                        />
                    </div>
                    <button type="submit" className="w-full mt-2 bg-neutral-900 text-white font-medium py-3 rounded-lg hover:bg-neutral-800 transition-colors">
                        Create Account
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button onClick={() => navigate('login')} className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
                        &larr; Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
