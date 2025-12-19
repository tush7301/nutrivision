import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function LandingPage() {
    const { loginWithAccessToken } = useAuth();
    const navigate = useNavigate();

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            await loginWithAccessToken(tokenResponse.access_token);
            navigate('/');
        },
        onError: () => console.log('Login Failed'),
    });

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center font-sans">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 -left-1/4 w-full h-full bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-0 -right-1/4 w-full h-full bg-teal-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse delay-1000"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm animate-fade-in-up">
                    <Sparkles size={14} className="text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-200 tracking-wide uppercase">NUTRIVISION</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/50 animate-fade-in-up delay-100 pb-2">
                    Turn photos into progress
                </h1>

                <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
                    Just snap, eat, and achieve your goals with real-time AI coaching.
                </p>

                <button
                    onClick={() => handleGoogleLogin()}
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] animate-fade-in-up delay-300"
                >
                    Start your journey now!
                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </button>
            </div>

        </div>
    );
}
