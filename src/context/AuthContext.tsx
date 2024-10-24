import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '../config/firebaseConfig'; // Import Firebase auth
import { signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

// Define types for the AuthContext value
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create AuthContext with default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Define the props type for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider to wrap around components
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Firebase login function
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      navigate('/root/admin'); // Redirect to admin route
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  // Firebase logout function
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    navigate('/root/admin/signin');
  };

  // Check user authentication status on page load
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const value = {
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
