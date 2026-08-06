import { getAdminAuth, getAdminFirestore } from './firebase-admin.js';

export interface DeletionResult {
  uid: string;
  removed: string[];
}

/**
 * Permanently deletes an account from BOTH Firebase Auth and Firestore.
 *
 * Removing only one side is what produces the states this codebase keeps
 * tripping over: an Auth account with no profile can still sign in but is
 * unmanageable, and a profile with no Auth account is an orphan nobody can
 * claim. This always does both for the same uid.
 *
 * Runs through the Admin SDK, which bypasses firestore.rules — clients are not
 * permitted to delete these documents directly (see `allow delete` in
 * firestore.rules), so every deletion has to come through an endpoint that has
 * already authorised the caller.
 *
 * Firestore is cleared before Auth on purpose: if the Auth call then fails, the
 * user simply gets a fresh profile on next sign-in, which is recoverable. The
 * reverse order would leave documents with no owner.
 */
export async function deleteAccountCompletely(uid: string): Promise<DeletionResult> {
  const auth = getAdminAuth();
  const db = getAdminFirestore();
  const removed: string[] = [];

  // Bookings reference the uid; leaving them behind strands rows the admin
  // dashboard can no longer resolve to a person.
  const bookings = await db.collection('bookings').where('studentId', '==', uid).get();
  for (const booking of bookings.docs) {
    await booking.ref.delete();
    removed.push(`bookings/${booking.id}`);
  }

  for (const collectionName of ['students', 'teachers', 'users']) {
    const ref = db.collection(collectionName).doc(uid);
    if ((await ref.get()).exists) {
      await ref.delete();
      removed.push(`${collectionName}/${uid}`);
    }
  }

  try {
    await auth.deleteUser(uid);
    removed.push(`auth/${uid}`);
  } catch (error) {
    // Already absent is success for our purposes — the goal is "this account is
    // gone", not "this specific call did the deleting".
    if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
    removed.push(`auth/${uid} (already absent)`);
  }

  return { uid, removed };
}

/**
 * Number of accounts currently holding the admin role.
 *
 * Used to refuse deleting the last one: nothing in this codebase can create the
 * first admin (self-signup is forced to 'student', and granting admin requires
 * an existing admin), so removing the final admin is an unrecoverable lockout
 * that can only be undone by hand-editing Firestore.
 */
export async function countAdmins(): Promise<number> {
  const db = getAdminFirestore();
  const admins = await db.collection('users').where('role', '==', 'admin').get();
  return admins.size;
}
