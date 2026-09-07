import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters long').trim(),
  avatar: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal('')) // Allow empty string to clear avatar
    .optional()
});

type ProfileFields = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearSession, updateUser, refreshToken } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ProfileFields>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      avatar: user?.avatar || ''
    }
  });

  // Query to fetch profile from `/users/me`
  // This verifies that Authorization header injection and refresh token rotation works
  const {
    data: dbProfile,
    isLoading: isProfileLoading,
    error: profileError
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me');
      const profile = response.data.data;
      setValue('fullName', profile.fullName);
      setValue('avatar', profile.avatar || '');
      return profile;
    }
  });

  // Mutation to update profile via `/users/me` (PUT)
  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFields) => {
      const response = await apiClient.put('/users/me', data);
      return response.data.data;
    },
    onSuccess: data => {
      updateUser({
        fullName: data.fullName,
        avatar: data.avatar,
        profileCompleted: data.profileCompleted
      });
    }
  });

  // Mutation to log out via `/auth/logout` (POST)
  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    },
    onSuccess: () => {
      clearSession();
      navigate('/login');
    },
    onError: () => {
      // Force session clearing if backend logout fails (e.g., token already revoked)
      clearSession();
      navigate('/login');
    }
  });

  const onSubmit = (data: ProfileFields) => {
    updateMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold tracking-tight bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              User Profile
            </h1>
            <p className="text-sm text-slate-400">Authenticated Session Foundation Verification</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/resume"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-700 text-slate-100 font-semibold text-xs rounded-lg transition-colors text-center flex items-center"
            >
              Manage Resume
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {isProfileLoading ? (
          <div className="text-center py-10 text-slate-400">Loading user metadata from API...</div>
        ) : profileError ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm font-medium">
            Authentication Validation Failed: {(profileError as { message?: string }).message}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
                Session Metadata
              </h2>
              <div className="bg-slate-950 border border-slate-850 rounded-lg p-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">User ID</span>
                  <span className="font-mono text-slate-300">{dbProfile?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Address</span>
                  <span className="text-slate-300">{dbProfile?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Role</span>
                  <span className="capitalize text-slate-300">{dbProfile?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Status</span>
                  <span className="capitalize inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                    {dbProfile?.accountStatus}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
                Update Information
              </h2>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter name"
                  {...register('fullName')}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg text-slate-100 focus:outline-none text-xs transition-colors"
                />
                {errors.fullName && (
                  <span className="text-xs text-rose-500">{errors.fullName.message}</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Avatar Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/avatar.png"
                  {...register('avatar')}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg text-slate-100 focus:outline-none text-xs transition-colors"
                />
                {errors.avatar && (
                  <span className="text-xs text-rose-500">{errors.avatar.message}</span>
                )}
              </div>

              {updateMutation.isSuccess && (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">
                  Profile updated successfully.
                </div>
              )}
              {updateMutation.isError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-medium">
                  {(updateMutation.error as { message?: string }).message}
                </div>
              )}

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 font-medium rounded-lg text-xs transition-colors cursor-pointer"
              >
                {updateMutation.isPending ? 'Updating...' : 'Save Profile'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
