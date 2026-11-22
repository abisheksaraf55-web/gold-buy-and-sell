import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  PurchaseTransaction, 
  ShopDetails, 
  BullionMarketRates 
} from '../types/bullion';
import { 
  getStoredTransactions, 
  setStoredTransactions,
  saveTransaction as saveLocalTx, 
  deleteTransaction as deleteLocalTx,
  getShopDetails, 
  saveShopDetails as saveLocalShop,
  getMarketRates,
  saveMarketRates as saveLocalRates,
} from '../utils/storage';

const TRANSACTIONS_SUBCOLLECTION = 'transactions';
const SETTINGS_SUBCOLLECTION = 'shopDetails';
const RATES_SUBCOLLECTION = 'marketRates';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function getActiveUid(): string | undefined {
  return auth.currentUser?.uid || undefined;
}

function logFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error (using offline cache fallback):', JSON.stringify(errInfo));
}

/**
 * Save transaction to both user-scoped Cloud Firestore and local offline storage
 */
export async function persistTransaction(tx: PurchaseTransaction): Promise<void> {
  const uid = getActiveUid();
  saveLocalTx(tx, uid);

  if (!uid) return;
  const path = `users/${uid}/${TRANSACTIONS_SUBCOLLECTION}/${tx.id}`;
  try {
    const docRef = doc(db, 'users', uid, TRANSACTIONS_SUBCOLLECTION, tx.id);
    await setDoc(docRef, tx);
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete transaction from both user-scoped Cloud Firestore and local storage
 */
export async function removeTransaction(id: string): Promise<void> {
  const uid = getActiveUid();
  deleteLocalTx(id, uid);

  if (!uid) return;
  const path = `users/${uid}/${TRANSACTIONS_SUBCOLLECTION}/${id}`;
  try {
    const docRef = doc(db, 'users', uid, TRANSACTIONS_SUBCOLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    logFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Fetch all transactions for the current signed-in user from Firestore; fallback to local storage
 */
export async function fetchTransactions(): Promise<PurchaseTransaction[]> {
  const uid = getActiveUid();
  if (!uid) return [];

  const path = `users/${uid}/${TRANSACTIONS_SUBCOLLECTION}`;
  try {
    const colRef = collection(db, 'users', uid, TRANSACTIONS_SUBCOLLECTION);
    const snap = await getDocs(colRef);
    const records: PurchaseTransaction[] = [];
    snap.forEach((d) => {
      records.push(d.data() as PurchaseTransaction);
    });
    records.sort((a, b) => (b.serialNo || 0) - (a.serialNo || 0));
    setStoredTransactions(records, uid);
    return records;
  } catch (err) {
    logFirestoreError(err, OperationType.LIST, path);
  }
  return getStoredTransactions(uid);
}

/**
 * Persist shop profile to user-scoped Cloud Firestore and local storage
 */
export async function persistShopDetails(shop: ShopDetails): Promise<void> {
  const uid = getActiveUid();
  saveLocalShop(shop, uid);

  if (!uid) return;
  const path = `users/${uid}/${SETTINGS_SUBCOLLECTION}/profile`;
  try {
    const docRef = doc(db, 'users', uid, SETTINGS_SUBCOLLECTION, 'profile');
    await setDoc(docRef, shop);
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Fetch shop details for current signed-in user from Firestore; fallback to local storage
 */
export async function fetchShopDetails(): Promise<ShopDetails> {
  const uid = getActiveUid();
  if (!uid) return getShopDetails();

  const path = `users/${uid}/${SETTINGS_SUBCOLLECTION}/profile`;
  try {
    const docRef = doc(db, 'users', uid, SETTINGS_SUBCOLLECTION, 'profile');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const remote = snap.data() as ShopDetails;
      saveLocalShop(remote, uid);
      return remote;
    }
  } catch (err) {
    logFirestoreError(err, OperationType.GET, path);
  }
  return getShopDetails(uid);
}

/**
 * Persist bullion market rates for current user
 */
export async function persistMarketRates(rates: BullionMarketRates): Promise<void> {
  const uid = getActiveUid();
  saveLocalRates(rates, uid);

  if (!uid) return;
  const path = `users/${uid}/${RATES_SUBCOLLECTION}/current`;
  try {
    const docRef = doc(db, 'users', uid, RATES_SUBCOLLECTION, 'current');
    await setDoc(docRef, rates);
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Fetch bullion market rates for current user from Firestore; fallback to local storage
 */
export async function fetchMarketRates(): Promise<BullionMarketRates> {
  const uid = getActiveUid();
  if (!uid) return getMarketRates();

  const path = `users/${uid}/${RATES_SUBCOLLECTION}/current`;
  try {
    const docRef = doc(db, 'users', uid, RATES_SUBCOLLECTION, 'current');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const remote = snap.data() as BullionMarketRates;
      saveLocalRates(remote, uid);
      return remote;
    }
  } catch (err) {
    logFirestoreError(err, OperationType.GET, path);
  }
  return getMarketRates(uid);
}

/**
 * Subscribe to realtime user-scoped transactions updates if online
 */
export function subscribeToTransactions(onUpdate: (txs: PurchaseTransaction[]) => void): () => void {
  const uid = getActiveUid();
  if (!uid) return () => {};

  const path = `users/${uid}/${TRANSACTIONS_SUBCOLLECTION}`;
  try {
    const colRef = collection(db, 'users', uid, TRANSACTIONS_SUBCOLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: PurchaseTransaction[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as PurchaseTransaction);
        });
        list.sort((a, b) => (b.serialNo || 0) - (a.serialNo || 0));
        setStoredTransactions(list, uid);
        onUpdate(list);
      },
      (err) => {
        logFirestoreError(err, OperationType.LIST, path);
      }
    );
  } catch {
    return () => {};
  }
}
