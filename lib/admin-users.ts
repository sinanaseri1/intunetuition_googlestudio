import { getAdminAuth, getAdminFirestore } from './firebase-admin.js';

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  /** null when the user exists in Firebase Auth but has no Firestore profile yet. */
  role: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  /** Whether a users/{uid} document exists. */
  hasProfile: boolean;
  /** Whether a Firebase Auth account exists (false for orphaned profile docs). */
  hasAuthAccount: boolean;
  disabled: boolean;
  providers: string[];
}

function toIsoOrNull(value: string | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Lists every registered account by joining Firebase Auth with the Firestore
 * `users` collection.
 *
 * Reading Firestore alone silently omits anyone whose profile document was
 * never written — e.g. a sign-up where the profile write failed, or a Google
 * OAuth account created before the profile logic existed. Those users can
 * sign in but are invisible to (and unmanageable by) an admin. Firebase Auth
 * is the authoritative list of who can sign in, so it drives this join;
 * Firestore-only documents are still included so orphans are visible too.
 */
export async function listAllUsers(): Promise<AdminUserRecord[]> {
  const auth = getAdminAuth();
  const db = getAdminFirestore();

  const profilesSnapshot = await db.collection('users').get();
  const profiles = new Map(profilesSnapshot.docs.map((doc) => [doc.id, doc.data()]));

  const records: AdminUserRecord[] = [];
  const seen = new Set<string>();

  // listUsers() pages at 1000; follow pageToken so large accounts aren't truncated.
  let pageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const authUser of page.users) {
      const profile = profiles.get(authUser.uid);
      seen.add(authUser.uid);
      records.push({
        id: authUser.uid,
        email: authUser.email || (profile?.email as string) || '',
        name: (profile?.name as string) || authUser.displayName || '',
        role: (profile?.role as string) ?? null,
        createdAt: (profile?.createdAt as string) || toIsoOrNull(authUser.metadata.creationTime),
        lastSignInAt: toIsoOrNull(authUser.metadata.lastSignInTime),
        hasProfile: Boolean(profile),
        hasAuthAccount: true,
        disabled: authUser.disabled,
        providers: authUser.providerData.map((provider) => provider.providerId),
      });
    }
    pageToken = page.pageToken;
  } while (pageToken);

  // Profile documents with no matching Auth account (e.g. the Auth user was
  // deleted directly in the console) — surface rather than silently drop.
  for (const [uid, profile] of profiles) {
    if (seen.has(uid)) continue;
    records.push({
      id: uid,
      email: (profile.email as string) || '',
      name: (profile.name as string) || '',
      role: (profile.role as string) ?? null,
      createdAt: (profile.createdAt as string) || null,
      lastSignInAt: null,
      hasProfile: true,
      hasAuthAccount: false,
      disabled: false,
      providers: [],
    });
  }

  return records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/**
 * Creates the missing users/{uid} profile for an existing Auth account.
 *
 * Runs through the Admin SDK because firestore.rules only lets a user create
 * their *own* profile (isOwner), so an admin cannot repair someone else's from
 * the client. Defaults to the least-privileged role; promotion stays a
 * separate, explicit admin action.
 */
export async function backfillUserProfile(uid: string): Promise<AdminUserRecord> {
  const auth = getAdminAuth();
  const db = getAdminFirestore();

  const authUser = await auth.getUser(uid);
  const userDocRef = db.collection('users').doc(uid);
  const existing = await userDocRef.get();

  if (!existing.exists) {
    const createdAt = toIsoOrNull(authUser.metadata.creationTime) || new Date().toISOString();
    await userDocRef.set({
      email: authUser.email || '',
      name: authUser.displayName || authUser.email?.split('@')[0] || 'New User',
      role: 'student',
      createdAt,
      updatedAt: new Date().toISOString(),
    });

    // Mirror the client's sign-up scaffold so the rest of the app (credits,
    // purchase history) has the document shape it expects.
    const studentDocRef = db.collection('students').doc(uid);
    if (!(await studentDocRef.get()).exists) {
      await studentDocRef.set({
        userId: uid,
        creditsRemaining: 0,
        packageHistory: [],
      });
    }
  }

  const profile = (await userDocRef.get()).data() || {};
  return {
    id: uid,
    email: authUser.email || (profile.email as string) || '',
    name: (profile.name as string) || authUser.displayName || '',
    role: (profile.role as string) ?? null,
    createdAt: (profile.createdAt as string) || toIsoOrNull(authUser.metadata.creationTime),
    lastSignInAt: toIsoOrNull(authUser.metadata.lastSignInTime),
    hasProfile: true,
    hasAuthAccount: true,
    disabled: authUser.disabled,
    providers: authUser.providerData.map((provider) => provider.providerId),
  };
}
