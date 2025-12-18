import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
                const response = await fetch('http://localhost:8000/api/v1/users/me', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ language: newLang })
                });

                if (!response.ok) {
                    console.error("Failed to update language on backend");
                }
            } catch (error) {
                console.error("Error updating language:", error);
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
