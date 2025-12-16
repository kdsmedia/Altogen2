
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { ProjectConfig, FileEntry, UserProfile, UpgradeRequest } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyD9q0oX-cYsMDmVVQeTq7c_vtDWG9xpcvw",
  authDomain: "altomedia-8f793.firebaseapp.com",
  projectId: "altomedia-8f793",
  storageBucket: "altomedia-8f793.firebasestorage.app",
  messagingSenderId: "327513974065",
  appId: "1:327513974065:web:8cde22ed55811d4691bc10",
  measurementId: "G-69TMT88K81"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ADMIN EMAIL
const ADMIN_EMAIL = "appsidhanie@gmail.com";

// --- AUTHENTICATION ---

export const loginWithGoogle = async (): Promise<UserProfile> => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if user exists in Firestore, if not create basic profile
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        let userProfile: UserProfile;

        if (userSnap.exists()) {
            userProfile = userSnap.data() as UserProfile;
            // Ensure role is correct if it's the hardcoded admin
            if (user.email === ADMIN_EMAIL && userProfile.role !== 'admin') {
                userProfile.role = 'admin';
                await setDoc(userRef, { role: 'admin' }, { merge: true });
            }
        } else {
            // Create new user
            userProfile = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || 'User',
                photoURL: user.photoURL || '',
                role: user.email === ADMIN_EMAIL ? 'admin' : 'user',
                plan: 'free'
            };
            await setDoc(userRef, userProfile);
        }
        return userProfile;
    } catch (error) {
        console.error("Login Failed", error);
        throw error;
    }
};

export const logout = async () => {
    await firebaseSignOut(auth);
};

export const subscribeToAuth = (callback: (user: UserProfile | null) => void) => {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                callback(userSnap.data() as UserProfile);
            } else {
                // Fallback if doc doesn't exist yet (rare race condition)
                callback({
                    uid: user.uid,
                    email: user.email || '',
                    displayName: user.displayName || '',
                    photoURL: user.photoURL || '',
                    role: user.email === ADMIN_EMAIL ? 'admin' : 'user',
                    plan: 'free'
                });
            }
        } else {
            callback(null);
        }
    });
};

// --- UPGRADE SYSTEM ---

export const submitUpgradeRequest = async (request: Omit<UpgradeRequest, 'id' | 'status' | 'timestamp'>) => {
    try {
        await addDoc(collection(db, "upgrade_requests"), {
            ...request,
            status: 'pending',
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Submit Request Error:", e);
        throw e;
    }
};

// --- ADMIN FUNCTIONS ---

export const getUpgradeRequests = async (): Promise<UpgradeRequest[]> => {
    try {
        const q = query(collection(db, "upgrade_requests")); // Get all, can sort later
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UpgradeRequest))
            .sort((a, b) => b.timestamp - a.timestamp); // Newest first
    } catch (e) {
        console.error("Get Requests Error:", e);
        throw e;
    }
};

export const processUpgradeRequest = async (requestId: string, userId: string, action: 'approved' | 'rejected') => {
    try {
        const reqRef = doc(db, "upgrade_requests", requestId);
        
        await updateDoc(reqRef, { status: action });

        if (action === 'approved') {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { plan: 'premium' });
        }
    } catch (e) {
        console.error("Process Request Error:", e);
        throw e;
    }
};

export const getTotalUsersCount = async (): Promise<number> => {
    const snap = await getDocs(collection(db, "users"));
    return snap.size;
};

// --- PROJECT STORAGE (Existing) ---

// Helper to generate a random 6-character ID
const generateId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const saveProjectToCloud = async (config: ProjectConfig, files: FileEntry[]): Promise<string> => {
    const projectId = generateId();
    
    // We only save text files to Firestore to keep document size reasonable
    const textFiles = files.filter(f => !f.nativeFile && !f.isVirtual && f.type.startsWith('text/'));
    
    const payload = {
        config: config,
        files: textFiles,
        savedAt: new Date().toISOString(),
        version: "2.5.0"
    };

    try {
        await setDoc(doc(db, "projects", projectId), payload);
        return projectId;
    } catch (e) {
        console.error("Firebase Save Error:", e);
        throw new Error("Failed to save to cloud.");
    }
};

export const loadProjectFromCloud = async (projectId: string): Promise<{ config: ProjectConfig, files: FileEntry[] } | null> => {
    try {
        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                config: data.config as ProjectConfig,
                files: data.files as FileEntry[]
            };
        } else {
            return null;
        }
    } catch (e) {
        console.error("Firebase Load Error:", e);
        throw new Error("Failed to load from cloud.");
    }
};
