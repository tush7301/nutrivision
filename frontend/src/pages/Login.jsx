import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Terminal } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-app-bg text-text-main relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-200/[0.04] dark:bg-grid-slate-800/[0.04] mask-gradient"></div>

            <div className="w-full max-w-md p-8 bg-card-bg rounded-2xl shadow-xl border border-border-base relative z-10 mx-4">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                        <Terminal className="text-white" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">
                        NutriVision
                    </h1>
                    <p className="text-text-muted mt-2 text-center">
                        AI-powered nutrition tracking and analysis. <br />
                        Sign in to start your journey.
                    </p>
                </div>

                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={(credentialResponse) => {
                            login(credentialResponse);
                            navigate('/');
                        }}
                        onError={() => {
                            console.log('Login Failed');
                        }}
                        useOneTap
                        theme="filled_black"
                        shape="pill"
                    />
                </div>

                <div className="mt-8 text-center text-xs text-text-muted">
                    <p>Secure authentication powered by Google.</p>
                </div>
            </div>
        </div>
    );
}
