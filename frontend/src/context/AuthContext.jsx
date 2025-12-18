import { createContext, useContext, useState, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';

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

    const login = (credentialResponse) => {
        const jwt = credentialResponse.credential;
        setToken(jwt);
        localStorage.setItem('token', jwt);

        // Decode JWT to get user info (basic info is in the payload)
        // simple decode for display purposes
        try {
            const payload = JSON.parse(atob(jwt.split('.')[1]));
            const userData = {
                name: payload.name,
                email: payload.email,
                picture: payload.picture
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (e) {
            console.error("Failed to decode token", e);
        }
    };

    const loginWithAccessToken = async (accessToken) => {
        setToken(accessToken);
        localStorage.setItem('token', accessToken);

        try {
            // Fetch user info from Google using the access token
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const payload = await response.json();

            const userData = {
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
                sub: payload.sub
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (e) {
            console.error("Failed to fetch user info", e);
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
