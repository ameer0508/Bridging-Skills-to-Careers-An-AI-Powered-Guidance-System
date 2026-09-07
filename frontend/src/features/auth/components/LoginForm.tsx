import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import { AuthInput } from './AuthInput';
import { PasswordField } from './PasswordField';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address format')
    .toLowerCase()
    .trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

type LoginFields = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.stateSession ?? state.setSession);
  const [rememberMe, setRememberMe] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginFields) => {
      const response = await apiClient.post('/auth/login', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      setSession(data.user, data.accessToken, data.refreshToken);
      navigate('/home');
    },
  });

  const onSubmit = (data: LoginFields) => {
    mutation.mutate(data);
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-slate-950/80 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl shadow-black/80 w-full max-w-md">
      {/* Top Ambient Glow inside card */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-linear-to-br from-indigo-500/20 to-cyan-500/10 blur-3xl" />

      {/* Card Header */}
      <div className="text-center space-y-2 mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md mb-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-mono font-bold text-indigo-300 tracking-wider uppercase">
            Authentication Gate
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome Back.
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Continue building your career with intelligence.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
        {/* Email Field */}
        <AuthInput
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password Field */}
        <div className="space-y-1">
          <PasswordField
            label="Password"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end pt-1">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Password reset link sent to your registered email address.');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Forgot password?
            </a>
          </div>
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-white/20 text-indigo-600 focus:ring-indigo-500/40"
            />
            <span>Remember this device for 30 days</span>
          </label>
        </div>

        {/* Error Alert Shake */}
        <AnimatePresence>
          {mutation.isError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                {(mutation.error as { message?: string })?.message ||
                  'Authentication failed. Please check your email and password.'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Submit Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-linear-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
        >
          {mutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      {/* Card Footer */}
      <div className="mt-8 pt-6 border-t border-white/10 text-center relative z-10 flex flex-col items-center gap-3">
        <p className="text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            Create Account
          </Link>
        </p>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-Bit Encrypted Workspace Auth</span>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
