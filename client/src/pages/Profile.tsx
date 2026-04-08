import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { updateProfileSchema, changePasswordSchema, platforms } from '../schemas';
import { useForm } from '../hooks/useForm';

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [newPlatform, setNewPlatform] = useState('');
  const [platformErr, setPlatformErr] = useState('');
  const [platformMsg, setPlatformMsg] = useState('');

  // Profile form
  const profileForm = useForm({
    schema: updateProfileSchema,
    initial: { name: user?.name ?? '', email: user?.email ?? '', weeklyHoursGoal: user?.weeklyHoursGoal },
    onSubmit: async (data) => {
      await authApi.updateProfile(data);
      await refreshUser();
      setProfileMsg('Profile updated');
      setProfileErr('');
    },
    onError: (err) => {
      setProfileErr((err as Error).message ?? 'Update failed');
      setProfileMsg('');
    },
  });

  // Password form
  const pwForm = useForm({
    schema: changePasswordSchema,
    initial: { currentPassword: '', newPassword: '', confirmPassword: '' },
    onSubmit: async (data) => {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPwMsg('Password changed');
      setPwErr('');
      pwForm.reset();
    },
    onError: (err) => {
      setPwErr((err as Error).message ?? 'Password change failed');
      setPwMsg('');
    },
  });

  const customPlatforms = user?.customPlatforms ?? [];
  const builtinSet = new Set<string>(platforms);

  const handleAddPlatform = async () => {
    const name = newPlatform.trim();
    if (!name) return;
    if (builtinSet.has(name) || customPlatforms.includes(name)) {
      setPlatformErr('Platform already exists');
      return;
    }
    try {
      await authApi.updateProfile({ customPlatforms: [...customPlatforms, name] });
      await refreshUser();
      setNewPlatform('');
      setPlatformErr('');
      setPlatformMsg('Platform added');
      setTimeout(() => setPlatformMsg(''), 2000);
    } catch {
      setPlatformErr('Failed to add platform');
    }
  };

  const handleRemovePlatform = async (platform: string) => {
    try {
      await authApi.updateProfile({ customPlatforms: customPlatforms.filter((p) => p !== platform) });
      await refreshUser();
      setPlatformErr('');
      setPlatformMsg('');
    } catch (err) {
      setPlatformErr((err as Error).message ?? 'Failed to remove platform');
    }
  };

  const inputCls =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-8">

        {/* Profile */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-8 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Profile</h2>

          {profileMsg && <p className="text-sm text-green-600 dark:text-green-400">{profileMsg}</p>}
          {profileErr && <p className="text-sm text-red-600 dark:text-red-400">{profileErr}</p>}

          <form onSubmit={profileForm.handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className={labelCls}>Name</label>
              <input
                type="text"
                name="name"
                value={profileForm.values.name ?? ''}
                onChange={profileForm.handleChange}
                className={inputCls}
              />
              {profileForm.errors.name && (
                <p className="text-xs text-red-500 mt-1">{profileForm.errors.name}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                name="email"
                value={profileForm.values.email ?? ''}
                onChange={profileForm.handleChange}
                className={inputCls}
              />
              {profileForm.errors.email && (
                <p className="text-xs text-red-500 mt-1">{profileForm.errors.email}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Weekly hours goal</label>
              <input
                type="number"
                name="weeklyHoursGoal"
                min={0}
                step={0.5}
                value={profileForm.values.weeklyHoursGoal ?? ''}
                onChange={profileForm.handleChange}
                placeholder="e.g. 10"
                className={inputCls}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Hours you aim to study each week. Shown on the dashboard.
              </p>
            </div>
            <button
              type="submit"
              disabled={profileForm.submitting}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-6 py-2 text-sm transition-colors"
            >
              {profileForm.submitting ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </div>

        {/* Learning Platforms */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-8 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Learning Platforms</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Built-in: {[...platforms].join(', ')}
          </p>

          {platformMsg && <p className="text-sm text-green-600 dark:text-green-400">{platformMsg}</p>}
          {platformErr && <p className="text-sm text-red-600 dark:text-red-400">{platformErr}</p>}

          {customPlatforms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customPlatforms.map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 text-sm">
                  {p}
                  <button
                    onClick={() => void handleRemovePlatform(p)}
                    className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-100 leading-none"
                    aria-label={`Remove ${p}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newPlatform}
              onChange={(e) => { setNewPlatform(e.target.value); setPlatformErr(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleAddPlatform(); } }}
              placeholder="e.g. LinkedIn Learning"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => void handleAddPlatform()}
              className="shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-8 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Change password</h2>

          {pwMsg && <p className="text-sm text-green-600 dark:text-green-400">{pwMsg}</p>}
          {pwErr && <p className="text-sm text-red-600 dark:text-red-400">{pwErr}</p>}

          <form onSubmit={pwForm.handleSubmit} className="space-y-4" noValidate>
            {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
              <div key={field}>
                <label className={labelCls}>
                  {field === 'currentPassword'
                    ? 'Current password'
                    : field === 'newPassword'
                      ? 'New password'
                      : 'Confirm new password'}
                </label>
                <input
                  type="password"
                  name={field}
                  value={pwForm.values[field]}
                  onChange={pwForm.handleChange}
                  className={inputCls}
                />
                {pwForm.errors[field] && (
                  <p className="text-xs text-red-500 mt-1">{pwForm.errors[field]}</p>
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={pwForm.submitting}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-6 py-2 text-sm transition-colors"
            >
              {pwForm.submitting ? 'Saving…' : 'Change password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
