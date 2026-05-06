import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  orderBy, 
  limit, 
  setDoc, 
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { AnalysisResult } from '../types';

export const saveUser = async (user: any) => {
  const userRef = doc(db, 'users', user.uid);
  try {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      lastLogin: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
};

// Robust normalization to prevent "Nested arrays are not supported" or "undefined" fields in Firestore
export const normalizeDecision = (data: any): AnalysisResult => {
  if (!data || typeof data !== 'object') return data;

  // Deep clone and clean undefined values
  const clean = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => clean(item));
    }
    if (obj !== null && typeof obj === 'object') {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = clean(value);
        }
        return acc;
      }, {} as any);
    }
    return obj;
  };

  const result = clean(data);

  // 1. Fix comparison rows (string[][] -> ComparisonRow[])
  if (result.comparison?.rows && Array.isArray(result.comparison.rows)) {
    result.comparison.rows = result.comparison.rows.map((row: any) => {
      // If it's already the new format { cells: [...] }, keep it
      if (row && typeof row === 'object' && Array.isArray(row.cells)) {
        return { 
          cells: row.cells.map((c: any) => {
            if (Array.isArray(c)) return c.join(', '); // Flatten nested array in cell
            return String(c || '');
          })
        };
      }
      // If it's the old format string[], convert it
      if (Array.isArray(row)) {
        return { 
          cells: row.map((c: any) => {
            if (Array.isArray(c)) return c.join(', '); // Flatten
            return String(c || '');
          })
        };
      }
      return { cells: [] };
    });
  }

  // 2. Recursively normalize followUps
  if (Array.isArray(result.followUps)) {
    result.followUps = result.followUps.map((f: any) => normalizeDecision(f));
  }

  // 3. Ensure metrics doesn't have nested arrays
  if (result.metrics && typeof result.metrics === 'object') {
    Object.keys(result.metrics).forEach(key => {
      const val = result.metrics[key];
      if (Array.isArray(val)) {
        result.metrics[key] = val.map((item: any) => 
          Array.isArray(item) ? item.join(', ') : String(item || '')
        );
      }
    });
  }

  // 4. Ensure scenarios doesn't have nested arrays
  if (Array.isArray(result.scenarios)) {
    result.scenarios = result.scenarios.map((s: any) => {
      if (typeof s === 'object' && s !== null) {
        return {
          ...s,
          factors: Array.isArray(s.factors) ? s.factors.map((f: any) => Array.isArray(f) ? f.join(', ') : String(f)) : []
        };
      }
      return String(s);
    });
  }

  return result as AnalysisResult;
};

export const saveDecision = async (userId: string, decision: AnalysisResult) => {
  const normalized = normalizeDecision(decision);
  const decisionRef = doc(db, 'users', userId, 'decisions', normalized.id);
  try {
    await setDoc(decisionRef, {
      ...normalized,
      userId,
      updatedAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/decisions/${normalized.id}`);
  }
};

export const fetchDecisions = async (userId: string): Promise<AnalysisResult[]> => {
  const decisionsRef = collection(db, 'users', userId, 'decisions');
  const q = query(
    decisionsRef, 
    orderBy('timestamp', 'desc'), 
    limit(10)
  );
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => normalizeDecision(doc.data()));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/decisions`);
    return [];
  }
};

export const deleteDecisions = async (userId: string) => {
  const decisionsRef = collection(db, 'users', userId, 'decisions');
  const q = query(decisionsRef, where('userId', '==', userId));
  try {
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'users', userId, 'decisions', d.id)));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/decisions`);
  }
};
