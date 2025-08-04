import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  preferences: {
    notifications: boolean;
    emailAlerts: boolean;
    theme: 'light' | 'dark';
    language: string;
    timezone: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('gps_auth_token');
        const storedUser = localStorage.getItem('gps_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Set default axios header
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Verify token is still valid
          await axios.get(`${apiUrl}/auth/me`);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid token
        localStorage.removeItem('gps_auth_token');
        localStorage.removeItem('gps_user');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [apiUrl]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);

      const response = await axios.post(`${apiUrl}/auth/login`, {
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data;

      // Store in state
      setToken(newToken);
      setUser(userData);

      // Store in localStorage
      localStorage.setItem('gps_auth_token', newToken);
      localStorage.setItem('gps_user', JSON.stringify(userData));

      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);

      const response = await axios.post(`${apiUrl}/auth/register`, {
        name,
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data;

      // Store in state
      setToken(newToken);
      setUser(userData);

      // Store in localStorage
      localStorage.setItem('gps_auth_token', newToken);
      localStorage.setItem('gps_user', JSON.stringify(userData));

      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    // Clear state
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem('gps_auth_token');
    localStorage.removeItem('gps_user');

    // Clear axios header
    delete axios.defaults.headers.common['Authorization'];

    // Optionally call logout endpoint
    axios.post(`${apiUrl}/auth/logout`).catch(() => {
      // Ignore errors for logout endpoint
    });
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      if (!user) throw new Error('No user logged in');

      const response = await axios.put(`${apiUrl}/auth/profile`, updates);
      const updatedUser = response.data.user;

      setUser(updatedUser);
      localStorage.setItem('gps_user', JSON.stringify(updatedUser));

    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.response?.data?.error || 'Profile update failed');
    }
  };

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
