import { supabase } from '../lib/supabase';

/**
 * Profile service -- reads/writes user profile data via Supabase.
 *
 * Tables used:
 *   - users     (id, email, name, tier, onboarding_completed, last_seen_at)
 *   - profiles  (user_id, target_job_title, location, phone, summary, languages,
 *                certifications, years_experience, preferences_json)
 *
 * Avatar storage:
 *   - Bucket: "avatars" in Supabase Storage
 *   - Path:   avatars/{user_id}.{ext}
 */

/* ─── Fetch profile (joined user + profile) ─── */
export async function getProfile(userId) {
  // Get user record
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userErr && userErr.code !== 'PGRST116') throw userErr;

  // Get profile record
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (profErr && profErr.code !== 'PGRST116') throw profErr;

  return {
    user: user || null,
    profile: profile || null,
  };
}

/* ─── Fetch profile by email ─── */
export async function getProfileByEmail(email) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error) throw error;
  if (!user) return { user: null, profile: null };

  return getProfile(user.id);
}

/* ─── Update user name ─── */
export async function updateUserName(userId, name) {
  const { error } = await supabase
    .from('users')
    .update({ name })
    .eq('id', userId);

  if (error) throw error;
}

/* ─── Update profile fields ─── */
export async function updateProfile(userId, fields) {
  // Filter to allowed fields only
  const allowed = [
    'target_job_title', 'location', 'phone', 'phone_verified', 'summary',
    'languages', 'certifications', 'years_experience', 'preferences_json',
  ];
  const clean = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) clean[key] = fields[key];
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...clean }, { onConflict: 'user_id' });

  if (error) {
    console.warn('[ProfileService] Upsert failed, trying update:', error.message);
    const { error: updateErr } = await supabase
      .from('profiles')
      .update(clean)
      .eq('user_id', userId);
    if (updateErr) {
      console.warn('[ProfileService] Update also failed:', updateErr.message);
    }
  }
}

/* ─── Upload avatar ─── */
export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop() || 'png';
  const path = `${userId}.${ext}`;

  // Upload (overwrite if exists)
  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (upErr) throw upErr;

  // Get public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  // Store URL in preferences_json (merge with existing prefs)
  let existingPrefs = {};
  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('preferences_json')
      .eq('user_id', userId)
      .single();
    existingPrefs = existingProfile?.preferences_json || {};
  } catch { /* column might not exist yet */ }

  try {
    await supabase
      .from('profiles')
      .upsert(
        { user_id: userId, preferences_json: { ...existingPrefs, avatar_url: data.publicUrl } },
        { onConflict: 'user_id' }
      );
  } catch (e) {
    console.warn('[ProfileService] Avatar URL save failed:', e.message);
  }

  return data.publicUrl;
}

/* ─── Get avatar URL ─── */
export async function getAvatarUrl(userId) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('preferences_json')
      .eq('user_id', userId)
      .single();
    if (!error && profile?.preferences_json?.avatar_url) {
      return profile.preferences_json.avatar_url;
    }
  } catch { /* ignore */ }

  return null;
}

/* ─── Change password (via Supabase Auth) ─── */
export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/* ─── Change email (via Supabase Auth) ─── */
export async function changeEmail(newEmail) {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
}

/* ─── Delete account ─── */
export async function deleteUserData(userId) {
  // Delete profile first (cascade will handle related data)
  await supabase.from('profiles').delete().eq('user_id', userId);
  await supabase.from('users').delete().eq('id', userId);
  // Sign out
  await supabase.auth.signOut();
}
