import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Globe,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import { AuthInput } from './AuthInput';
import { PasswordField } from './PasswordField';

const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters long')
    .max(100, 'Full name must not exceed 100 characters')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address format')
    .toLowerCase()
    .trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

type RegisterFields = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.stateSession ?? state.setSession);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [userRole, setUserRole] = useState<'student' | 'professional'>('student');
  const [country, setCountry] = useState('United States');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const mutation = useMutation({
    mutationFn: async (data: RegisterFields) => {
      const response = await apiClient.post('/auth/register', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      setSession(data.user, data.accessToken, data.refreshToken);
      navigate('/home');
    },
  });

  const onSubmit = (data: RegisterFields) => {
    if (confirmPassword && confirmPassword !== data.password) {
      setConfirmError('Passwords do not match');
      return;
    }
    setConfirmError('');
    if (!agreeTerms) {
      alert('Please accept Terms & Privacy Policy to continue.');
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-slate-950/80 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl shadow-black/80 w-full max-w-md">
      {/* Top Ambient Glow inside card */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-linear-to-br from-indigo-500/20 to-cyan-500/10 blur-3xl" />

      {/* Card Header */}
      <div className="text-center space-y-2 mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md mb-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-mono font-bold text-cyan-300 tracking-wider uppercase">
            Build Intelligence Profile
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create Account.
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Create your profile & let SkillBridge navigate your career.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
        {/* Role Selector Tabs */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Primary Role Profile
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setUserRole('student')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                userRole === 'student'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Student / Graduate</span>
            </button>
            <button
              type="button"
              onClick={() => setUserRole('professional')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                userRole === 'professional'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Working Professional</span>
            </button>
          </div>
        </div>

        {/* Full Name */}
        <AuthInput
          label="Full Name"
          type="text"
          placeholder="John Doe"
          icon={User}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        {/* Email */}
        <AuthInput
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password */}
        <PasswordField
          label="Password"
          showStrengthMeter={true}
          error={errors.password?.message}
          {...register('password')}
        />

        {/* Confirm Password */}
        <PasswordField
          label="Confirm Password"
          error={confirmError}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {/* Country Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Country / Region
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Globe className="w-4 h-4" />
            </div>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 focus:border-indigo-400 rounded-xl text-slate-100 text-sm focus:outline-none transition-all"
            >
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="India">India</option>
              <option value="Germany">Germany</option>
              <option value="Australia">Australia</option>
              <option value="Global / Other">Global / Other</option>
            </select>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-400 leading-normal">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-white/20 text-indigo-600 focus:ring-indigo-500/40 mt-0.5 shrink-0"
            />
            <span>
              I agree to the{' '}
              <a href="#" className="text-indigo-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-indigo-400 hover:underline">
                Privacy Policy
              </a>
            </span>
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
                  'Account registration failed. Please try again.'}
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
              <span>Creating Your Workspace...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      {/* Card Footer */}
      <div className="mt-8 pt-6 border-t border-white/10 text-center relative z-10 flex flex-col items-center gap-3">
        <p className="text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign In
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

export default RegisterForm;
