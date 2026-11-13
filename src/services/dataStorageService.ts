import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
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
  DEFAULT_SHOP_DETAILS,
  DEFAULT_RATES,
  SAMPLE_INITIAL_TRANSACTIONS
} from '../utils/storage';

const TRANSACTIONS_COLLECTION = 'transactions';
const SETTINGS_COLLECTION = 'shopSettings';
const RATES_COLLECTION = 'marketRates';

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
    console.warn('Firestore sync note (persisted locally):', err);
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
    console.warn('Firestore delete note:', err);
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
    console.warn('Could not fetch from Firestore, using local data:', err);
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
    console.warn('Firestore shop sync note:', err);
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
    console.warn('Firestore shop fetch note:', err);
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
    console.warn('Firestore rates sync note:', err);
  }
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
        console.warn('Firestore onSnapshot note:', err);
      }
    );
  } catch {
    return () => {};
  }
}
