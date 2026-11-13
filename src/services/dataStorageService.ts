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
  saveTransaction as saveLocalTx, 
  getShopDetails, 
  saveShopDetails as saveLocalShop,
  getMarketRates,
  saveMarketRates as saveLocalRates,
} from '../utils/storage';

const TRANSACTIONS_COLLECTION = 'transactions';
const SETTINGS_COLLECTION = 'shopDetails';
const RATES_COLLECTION = 'marketRates';

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
 * Save transaction to both Cloud Firestore and local offline storage
 */
export async function persistTransaction(tx: PurchaseTransaction): Promise<void> {
  // Always update local cache instantly for zero latency
  saveLocalTx(tx);

  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, tx.id);
    await setDoc(docRef, tx);
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `${TRANSACTIONS_COLLECTION}/${tx.id}`);
  }
}

/**
 * Delete transaction from both Cloud Firestore and local storage
 */
export async function removeTransaction(id: string): Promise<void> {
  // Remove from local storage
  const current = getStoredTransactions();
  const filtered = current.filter((t: PurchaseTransaction) => t.id !== id);
  localStorage.setItem('nepal_bullion_legal_transactions_v1', JSON.stringify(filtered));

  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    logFirestoreError(err, OperationType.DELETE, `${TRANSACTIONS_COLLECTION}/${id}`);
  }
}

/**
 * Fetch all transactions from Firestore; fallback to local storage
 */
export async function fetchTransactions(): Promise<PurchaseTransaction[]> {
  try {
    const colRef = collection(db, TRANSACTIONS_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const records: PurchaseTransaction[] = [];
      snap.forEach((d) => {
        records.push(d.data() as PurchaseTransaction);
      });
      // Sort newest first
      records.sort((a, b) => (b.serialNo || 0) - (a.serialNo || 0));
      localStorage.setItem('nepal_bullion_legal_transactions_v1', JSON.stringify(records));
      return records;
    }
  } catch (err) {
    logFirestoreError(err, OperationType.LIST, TRANSACTIONS_COLLECTION);
  }
  return getStoredTransactions();
}

/**
 * Persist shop profile to Cloud Firestore and local storage
 */
export async function persistShopDetails(shop: ShopDetails): Promise<void> {
  saveLocalShop(shop);
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'profile');
    await setDoc(docRef, shop);
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `${SETTINGS_COLLECTION}/profile`);
  }
}

/**
 * Fetch shop details from Firestore; fallback to local storage
 */
export async function fetchShopDetails(): Promise<ShopDetails> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'profile');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const remote = snap.data() as ShopDetails;
      saveLocalShop(remote);
      return remote;
    }
  } catch (err) {
    logFirestoreError(err, OperationType.GET, `${SETTINGS_COLLECTION}/profile`);
  }
  return getShopDetails();
}

/**
 * Persist bullion market rates
 */
export async function persistMarketRates(rates: BullionMarketRates): Promise<void> {
  saveLocalRates(rates);
  try {
    const docRef = doc(db, RATES_COLLECTION, 'current');
    await setDoc(docRef, rates);
  } catch (err) {
    logFirestoreError(err, OperationType.WRITE, `${RATES_COLLECTION}/current`);
  }
}

/**
 * Fetch bullion market rates from Firestore; fallback to local storage
 */
export async function fetchMarketRates(): Promise<BullionMarketRates> {
  try {
    const docRef = doc(db, RATES_COLLECTION, 'current');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const remote = snap.data() as BullionMarketRates;
      saveLocalRates(remote);
      return remote;
    }
  } catch (err) {
    logFirestoreError(err, OperationType.GET, `${RATES_COLLECTION}/current`);
  }
  return getMarketRates();
}

/**
 * Subscribe to realtime transactions updates if online
 */
export function subscribeToTransactions(onUpdate: (txs: PurchaseTransaction[]) => void): () => void {
  try {
    const colRef = collection(db, TRANSACTIONS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: PurchaseTransaction[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as PurchaseTransaction);
          });
          list.sort((a, b) => (b.serialNo || 0) - (a.serialNo || 0));
          localStorage.setItem('nepal_bullion_legal_transactions_v1', JSON.stringify(list));
          onUpdate(list);
        }
      },
      (err) => {
        logFirestoreError(err, OperationType.LIST, TRANSACTIONS_COLLECTION);
      }
    );
  } catch {
    return () => {};
  }
}
