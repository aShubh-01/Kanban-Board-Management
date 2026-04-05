import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import api from '../api/client';
import { UserPlus, Mail, Lock, User, Loader2, CheckCircle2 } from 'lucide-react';

const Register: React.FC = () => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/signup', { name, email, password });
      const { token, ...user } = response.data;
      dispatch(loginSuccess({ user, token }));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md animate-fade-in">
        <div className="card p-8 shadow-xl bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-primary-600 p-3 rounded-2xl text-white mb-4 shadow-lg shadow-primary-600/30">
              <UserPlus size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Create Account</h1>
            <p className="text-slate-500 mt-2">Join us to start managing tasks</p>
          </div>

          {success ? (
            <div className="text-center p-8 animate-slide-up">
              <div className="flex justify-center mb-4 text-green-500">
                <CheckCircle2 size={64} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Registration Successful!</h2>
              <p className="text-slate-600 mt-2">Redirecting to login page...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2 animate-slide-down">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      className="input pl-10 h-11"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      className="input pl-10 h-11"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      className="input pl-10 h-11"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">At least 6 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full h-11 flex items-center justify-center gap-2 text-base mt-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                </button>
              </form>

              <p className="text-center mt-8 text-slate-600 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 font-bold hover:underline transition-all">
                  Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
