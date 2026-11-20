import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../services/supabaseClient";

const Icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px] shrink-0">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  tenants: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px] shrink-0">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  addTenant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px] shrink-0">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  power: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px] shrink-0">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  ),
};

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Icons.dashboard },
  { path: "/tenants", label: "Tenants", icon: Icons.tenants },
  { path: "/tenants/new", label: "Add Tenant", icon: Icons.addTenant },
];

export default function Sidebar({ isOpen, closeSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ username: '', avatar_url: '' });
  const [tenantCount, setTenantCount] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single()
        .then(({ data }) => { if (data) setProfile(data); });
      supabase.from('tenants').select('id', { count: 'exact' }).eq('user_id', user.id)
        .then(({ count }) => setTenantCount(count));
    });
  }, []);

  const openProfile = () => {
    setEditName(profile.username || '');
    setAvatarFile(null);
    setAvatarPreview(profile.avatar_url || '');
    setShowProfileModal(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    let avatar_url = profile.avatar_url || '';

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `avatars/${userId}.${ext}`;
      const { error: upErr } = await supabase.storage.from('tenant-files').upload(path, avatarFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = await supabase.storage.from('tenant-files').createSignedUrl(path, 60 * 60 * 24 * 365);
        avatar_url = urlData?.signedUrl || avatar_url;
      }
    }

    await supabase.from('profiles').upsert({ id: userId, username: editName.trim(), avatar_url });
    setProfile({ username: editName.trim(), avatar_url });
    setSaving(false);
    setShowProfileModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const Avatar = ({ size = 'w-9 h-9', textSize = 'text-sm' }) => (
    profile.avatar_url
      ? <img src={profile.avatar_url} alt="avatar" className={`${size} rounded-full object-cover shrink-0`} />
      : <div className={`${size} rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold ${textSize} shrink-0`}>
          {(profile.username || 'A').charAt(0).toUpperCase()}
        </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-7 mb-2">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0">R</div>
        <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">RentManager</span>
      </div>

      <nav className="flex-1 px-3 space-y-[3px]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link key={item.path} to={item.path} onClick={closeSidebar}
              className={`relative flex items-center gap-[10px] px-[18px] h-11 rounded-md text-[15px] font-medium transition-colors duration-150 ${
                active
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white'
              }`}>
              {active && <span className="absolute left-0 top-[8px] bottom-[8px] w-[3px] bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />}
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
              {item.path === '/tenants' && tenantCount !== null && (
                <span className="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">{tenantCount}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5 pt-4">
        <div className="border-t border-gray-200 dark:border-gray-700 mb-5" />
        <div className="px-2 flex items-center gap-3">
          <button onClick={openProfile} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left">
            <Avatar />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{profile.username || 'Admin'}</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </button>
          <button onClick={handleLogout} title="Logout"
            className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-700 text-gray-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0">
            {Icons.power}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[248px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30 transition-colors duration-300">
        {sidebarContent}
      </aside>
      <aside className={`lg:hidden fixed left-0 top-0 bottom-0 w-[260px] flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5">Edit Profile</h2>

            <div className="flex flex-col items-center gap-3 mb-5">
              <div className="relative">
                {avatarPreview
                  ? <img src={avatarPreview} alt="preview" className="w-20 h-20 rounded-full object-cover" />
                  : <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                      {(editName || 'A').charAt(0).toUpperCase()}
                    </div>
                }
                <button onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md hover:bg-indigo-700 transition-colors">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <p className="text-xs text-gray-400">Click the icon to change photo</p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                placeholder="Your name"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={handleSaveProfile} disabled={saving || !editName.trim()}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowProfileModal(false)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
