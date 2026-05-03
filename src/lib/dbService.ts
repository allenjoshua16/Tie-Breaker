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

export const saveDecision = async (userId: string, decision: AnalysisResult) => {
  const decisionRef = doc(db, 'users', userId, 'decisions', decision.id);
  try {
    await setDoc(decisionRef, {
      ...decision,
      userId,
      updatedAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/decisions/${decision.id}`);
  }
};

export const fetchDecisions = async (userId: string): Promise<AnalysisResult[]> => {
  const decisionsRef = collection(db, 'users', userId, 'decisions');
  const q = query(decisionsRef, orderBy('timestamp', 'desc'), limit(10));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AnalysisResult);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/decisions`);
    return [];
  }
};

export const deleteDecisions = async (userId: string) => {
  const decisionsRef = collection(db, 'users', userId, 'decisions');
  try {
    const snapshot = await getDocs(decisionsRef);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'users', userId, 'decisions', d.id)));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/decisions`);
  }
};
