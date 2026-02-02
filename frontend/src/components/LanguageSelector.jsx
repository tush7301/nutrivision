import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'hi', label: 'Hindi' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ja', label: 'Japanese' }
];

export default function LanguageSelector() {
    const { user, updateUser, token } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleLanguageChange = async (e) => {
        const newLang = e.target.value;
        setLoading(true);

        // Optimistic update
        updateUser({ language: newLang });

        if (token) {
            try {
                // Use the configured api client which handles base URL and auth headers
                await api.put('/users/me', { language: newLang });
            } catch (error) {
                console.error("Error updating language:", error);
                // Optionally revert optimistic update here if needed
            }
        }

        setLoading(false);
    };

    return (
        <div className="flex items-center space-x-2">
            <span className="text-sm text-text-muted">Language:</span>
            <select
                value={user?.language || 'en'}
                onChange={handleLanguageChange}
                disabled={loading}
                className="flex-1 bg-card-bg text-text-main text-sm rounded-lg border border-border-base p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-0"
            >
                {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-card-bg text-text-main">
                        {lang.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
