import { useState, createContext, useContext, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, User, UserCredential } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'next/navigation'
import React from 'react';

interface AuthContextType {
    user: User | null | undefined;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    createUser: (email: string, password: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
    error: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: undefined,
    loading: true,
    login: async (email: string, password: string) => {
      
    },
  createUser: async (email: string, password: string) => {
      return new Promise<UserCredential>((resolve, reject) => {});
    },
  logout: async () => {},
  error:null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }:{children:React.ReactNode}) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter()

    const login = async (email: string, password: string): Promise<void> => {
        try {
             await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
           
        } catch (error) {
            setError("ログインに失敗しました。");
            console.log(error)
            throw error;
        }
    }


  const createUser = async (email: string, password: string): Promise<UserCredential> => {
    try {
         const userCredential = await createUserWithEmailAndPassword(auth, email, password);
         return userCredential;
       } catch (error) {
         setError("登録に失敗しました。");
         throw error;
       }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }}
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user:any) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, loading, login, createUser, logout, error }}>
        {children}
    </AuthContext.Provider>
  );
    };