import { useState } from 'react';
import { setToken } from './api';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import MerchantDashboard from './MerchantDashboard';
import ReviewerDashboard from './ReviewerDashboard';

function App() {
    const [currentPage, setCurrentPage] = useState('login');
    const [role, setRole] = useState(null);

    const handleLogin = (token, userRole) => {
        setToken(token);
        setRole(userRole);
        setCurrentPage(userRole === 'merchant' ? 'merchantDashboard' : 'reviewerDashboard');
    };

    const navigate = (page) => setCurrentPage(page);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {currentPage === 'login' && <LoginPage onLogin={handleLogin} navigate={navigate} />}
            {currentPage === 'register' && <RegisterPage navigate={navigate} />}
            {currentPage === 'merchantDashboard' && <MerchantDashboard />}
            {currentPage === 'reviewerDashboard' && <ReviewerDashboard />}
        </div>
    );
}

export default App;
