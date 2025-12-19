import { createContext, useContext, useState, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true); // Persist login check

    useEffect(() => {
        // Here we would ideally validate the token with the backend on load
        // For now, we trust the local storage token presence but clear it if decoding fails
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, [token]);

    const login = async (credentialResponse) => {
        const jwt = credentialResponse.credential;
        setToken(jwt);
        localStorage.setItem('token', jwt);

        try {
            // Fetch full user profile from backend
            // The interceptor will pick up the token from localStorage
            const { data } = await api.get('/users/me');
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
        } catch (e) {
            console.error("Failed to fetch user profile", e);
            // Fallback to basic decode if backend fails (unlikely if setup is correct)
            try {
                const payload = JSON.parse(atob(jwt.split('.')[1]));
                const userData = {
                    name: payload.name,
                    email: payload.email,
                    picture: payload.picture
                };
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            } catch (decodeError) {
                console.error("Failed to decode token", decodeError);
            }
        }
    };

    const loginWithAccessToken = async (accessToken) => {
        setToken(accessToken);
        localStorage.setItem('token', accessToken);

        try {
            // First validation/creation via backend implicitly happens when we call an endpoint
            // But get_current_user in backend validates the token with Google

            // Verify and Get Profile from Backend
            const { data } = await api.get('/users/me');
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));

        } catch (e) {
            console.error("Failed to fetch user info from backend", e);
            // If backend fails, maybe try simple google info? 
            // But for Onboarding check we NEED backend info.
        }
    };

    const logout = () => {
        googleLogout();
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const updateUser = (newUserData) => {
        const updatedUser = { ...user, ...newUserData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
    };

    return (
        <AuthContext.Provider value={{ user, token, login, loginWithAccessToken, logout, loading, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
