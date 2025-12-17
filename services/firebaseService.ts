
// Standard modular Firebase v9+ imports
// Fix: Ensured initializeApp is correctly imported from 'firebase/app'
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

// Initialize Firebase App instance using modular initializeApp from firebase/app
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
        
        const userRef = doc(db, "users", user.uid);
        let userSnap;
        try {
            userSnap = await getDoc(userRef);
        } catch (e) {
            console.warn("Could not fetch user doc, might be a new user or rules issue.");
        }
        
        let userProfile: UserProfile;

        if (userSnap && userSnap.exists()) {
            userProfile = userSnap.data() as UserProfile;
            
            if (user.email === ADMIN_EMAIL) {
                const updates: any = {};
                if (userProfile.role !== 'admin') updates.role = 'admin';
                if (userProfile.plan !== 'premium') updates.plan = 'premium';
                
                if (Object.keys(updates).length > 0) {
                    userProfile = { ...userProfile, ...updates };
                    try {
                        await setDoc(userRef, updates, { merge: true });
                    } catch (e) {
                        console.error("Failed to update admin status in Firestore. Check rules.", e);
                    }
                }
            }
        } else {
            const isAdmin = user.email === ADMIN_EMAIL;
            userProfile = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || 'User',
                photoURL: user.photoURL || '',
                role: isAdmin ? 'admin' : 'user',
                plan: isAdmin ? 'premium' : 'free'
            };
            try {
                await setDoc(userRef, userProfile);
            } catch (e) {
                console.error("Failed to create user doc. Check Firestore rules.", e);
            }
        }
        return userProfile;
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error("Login dibatalkan.");
        }
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
            try {
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    callback(userSnap.data() as UserProfile);
                } else {
                    const isAdmin = user.email === ADMIN_EMAIL;
                    callback({
                        uid: user.uid,
                        email: user.email || '',
                        displayName: user.displayName || '',
                        photoURL: user.photoURL || '',
                        role: isAdmin ? 'admin' : 'user',
                        plan: isAdmin ? 'premium' : 'free'
                    });
                }
            } catch (e) {
                 const isAdmin = user.email === ADMIN_EMAIL;
                 callback({
                    uid: user.uid,
                    email: user.email || '',
                    displayName: user.displayName || '',
                    photoURL: user.photoURL || '',
                    role: isAdmin ? 'admin' : 'user',
                    plan: isAdmin ? 'premium' : 'free'
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
        const q = query(collection(db, "upgrade_requests")); 
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data } as UpgradeRequest;
        })
        .sort((a, b) => {
            const tA = a.timestamp?.seconds || (a.timestamp?.toMillis ? a.timestamp.toMillis() / 1000 : 0) || 0;
            const tB = b.timestamp?.seconds || (b.timestamp?.toMillis ? b.timestamp.toMillis() / 1000 : 0) || 0;
            return tB - tA;
        }); 
    } catch (e) {
        console.warn("Get Requests Error (likely permission):", e);
        return []; // Kembalikan array kosong jika tidak punya izin
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
    try {
        const snap = await getDocs(collection(db, "users"));
        return snap.size;
    } catch (e) {
        console.warn("Get Total Users Error (likely permission):", e);
        return 0; 
    }
};

// --- PROJECT STORAGE ---

const generateId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const saveProjectToCloud = async (config: ProjectConfig, files: FileEntry[]): Promise<string> => {
    const projectId = generateId();
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
