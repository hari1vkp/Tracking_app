import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { Bus, User, KeyRound, Lock, Mail, ArrowRight } from 'lucide-react';

const Login = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/'); 
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: role,
          name: name
        });
        
        navigate('/');
      }
    } catch (err: any) {
      console.error("Login/Signup error:", err);
      let msg = err.message;
      if (err.code === 'auth/network-request-failed') {
          msg = "Network error. Please check your connection.";
      } else if (err.code === 'permission-denied' || err.message.includes("permissions")) {
          msg = "FIREBASE PERMISSION ERROR: Update Firestore Rules.";
          alert(`ACTION REQUIRED:\n\n1. Go to Firebase Console -> Firestore -> Rules\n2. Change 'allow read, write: if false;' to 'allow read, write: if request.auth != null;'\n3. Publish`);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setError('');
      setLoading(true);
      try {
          await signInWithGoogle();
          navigate('/');
      } catch (err: any) {
          console.error("Google Login error", err);
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 relative z-10 animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-tr from-blue-600 to-violet-600 p-4 rounded-2xl shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
            <Bus className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">
          {isLogin ? 'Welcome Back' : 'Get Started'}
        </h2>
        <p className="text-center text-slate-300 mb-8 text-sm">
            {isLogin ? 'Sign in to access your dashboard' : 'Create a new account to start tracking'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            {error}
          </div>
        )}
        
        <div className="mb-6">
            <button
                onClick={handleGoogleLogin}
                type="button"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 hover:bg-gray-50 font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-sm transform hover:scale-[1.02] active:scale-[0.98]"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span>Continue with Google</span>
            </button>
            
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
                    <span className="px-4 bg-transparent text-slate-400">Or continue with email</span>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wide">Full Name</label>
              <div className="relative group">
                <User className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 transition-colors group-focus-within:text-blue-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wide">Email</label>
            <div className="relative group">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 transition-colors group-focus-within:text-blue-400" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wide">Password</label>
            <div className="relative group">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 transition-colors group-focus-within:text-blue-400" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wide">Role</label>
              <select
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="student" className="bg-slate-800 text-white">Student/Parent</option>
                <option value="driver" className="bg-slate-800 text-white">Bus Driver</option>
                <option value="admin" className="bg-slate-800 text-white">Administrator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/20 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : (
                <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
                setIsLogin(!isLogin);
                setError('');
            }}
            className="text-white hover:text-blue-400 font-bold transition-colors ml-1"
          >
            {isLogin ? 'Sign up now' : 'Sign in'}
          </button>
        </div>

        {error && error.includes("already-in-use") && !isLogin && (
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl text-center backdrop-blur-sm animate-pulse">
              <p className="text-sm text-blue-200 mb-3 font-medium">This email is already registered!</p>
              <button 
                  onClick={() => {
                      setIsLogin(true);
                      setError('');
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow transition-colors"
              >
                  Go to Sign In &rarr;
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
