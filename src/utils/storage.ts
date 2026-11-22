import { 
  PurchaseTransaction, 
  ShopDetails, 
  BullionMarketRates 
} from '../types/bullion';

const TRANSACTIONS_KEY_PREFIX = 'nepal_bullion_legal_transactions_v2_';
const SHOP_DETAILS_KEY_PREFIX = 'nepal_bullion_shop_profile_v2_';
const RATES_KEY_PREFIX = 'nepal_bullion_market_rates_v2_';

function getKey(prefix: string, uid?: string): string {
  return `${prefix}${uid || 'guest'}`;
}

export const DEFAULT_SHOP_DETAILS: ShopDetails = {
  nameNepali: '',
  nameEnglish: '',
  proprietorName: '',
  panVatNumber: '',
  businessRegNumber: '',
  fenegosidaMembershipNo: '',
  address: '',
  phone: '',
  email: '',
  isSetupCompleted: false,
};

export const DEFAULT_RATES: BullionMarketRates = {
  chhapawalGoldPerTola: 172500, // NPR 1,72,500 per Tola
  tezabiGoldPerTola: 171700,    // NPR 1,71,700 per Tola
  gold18kPerTola: 138000,       // NPR 1,38,000 per Tola
  fineSilverPerTola: 2050,      // NPR 2,050 per Tola
  lastUpdated: new Date().toISOString(),
};

export function getStoredTransactions(uid?: string): PurchaseTransaction[] {
  try {
    const raw = localStorage.getItem(getKey(TRANSACTIONS_KEY_PREFIX, uid));
    if (!raw) {
      return [];
    }
    const parsed: PurchaseTransaction[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    let hasModified = false;
    const normalized = parsed.map((tx, idx) => {
      if (!tx.serialNo || !tx.contractSerialNumber) {
        hasModified = true;
        const serialNo = tx.serialNo || parsed.length - idx;
        const contractSerialNumber =
          tx.contractSerialNumber || `SN-2083-${String(serialNo).padStart(4, '0')}`;
        return { ...tx, serialNo, contractSerialNumber };
      }
      return tx;
    });
    if (hasModified) {
      localStorage.setItem(getKey(TRANSACTIONS_KEY_PREFIX, uid), JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return [];
  }
}

export function setStoredTransactions(transactions: PurchaseTransaction[], uid?: string): void {
  localStorage.setItem(getKey(TRANSACTIONS_KEY_PREFIX, uid), JSON.stringify(transactions));
}

export function saveTransaction(tx: PurchaseTransaction, uid?: string): void {
  const current = getStoredTransactions(uid);
  const existsIndex = current.findIndex((item) => item.id === tx.id);
  let updated: PurchaseTransaction[];
  if (existsIndex >= 0) {
    updated = [...current];
    updated[existsIndex] = tx;
  } else {
    updated = [tx, ...current];
  }
  setStoredTransactions(updated, uid);
}

export function getShopDetails(uid?: string): ShopDetails {
  try {
    const raw = localStorage.getItem(getKey(SHOP_DETAILS_KEY_PREFIX, uid));
    if (!raw) return DEFAULT_SHOP_DETAILS;
    return { ...DEFAULT_SHOP_DETAILS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SHOP_DETAILS;
  }
}

export function saveShopDetails(shop: ShopDetails, uid?: string): void {
  localStorage.setItem(getKey(SHOP_DETAILS_KEY_PREFIX, uid), JSON.stringify(shop));
}

export function getMarketRates(uid?: string): BullionMarketRates {
  try {
    const raw = localStorage.getItem(getKey(RATES_KEY_PREFIX, uid));
    if (!raw) return DEFAULT_RATES;
    return { ...DEFAULT_RATES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_RATES;
  }
}

export function saveMarketRates(rates: BullionMarketRates, uid?: string): void {
  localStorage.setItem(getKey(RATES_KEY_PREFIX, uid), JSON.stringify(rates));
}

export function deleteTransaction(id: string, uid?: string): void {
  const current = getStoredTransactions(uid);
  const filtered = current.filter((t) => t.id !== id);
  setStoredTransactions(filtered, uid);
}

export function exportFullBackupJSON(uid?: string): string {
  const data = {
    app: 'Nepal Bullion Legal Purchase System',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    shop: getShopDetails(uid),
    rates: getMarketRates(uid),
    transactions: getStoredTransactions(uid),
  };
  return JSON.stringify(data, null, 2);
}

export function importFullBackupJSON(
  jsonStr: string,
  uid?: string
): { success: boolean; message: string; count?: number } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.transactions || !Array.isArray(data.transactions)) {
      return {
        success: false,
        message: 'अमान्य ब्याकअप फाइल ढाँचा (Invalid backup format: missing transactions).',
      };
    }

    const validTransactions: PurchaseTransaction[] = data.transactions.map((tx: any, idx: number) => {
      const serialNo = tx.serialNo || idx + 1;
      const contractSerialNumber =
        tx.contractSerialNumber || `SN-2083-${String(serialNo).padStart(4, '0')}`;
      return {
        ...tx,
        serialNo,
        contractSerialNumber,
      };
    });

    setStoredTransactions(validTransactions, uid);

    if (data.shop && typeof data.shop === 'object') {
      saveShopDetails(data.shop, uid);
    }
    if (data.rates && typeof data.rates === 'object') {
      saveMarketRates(data.rates, uid);
    }

    return {
      success: true,
      message: `${validTransactions.length} वटा खरिद सम्झौता तथा पसल विवरण सफलतापूर्वक रिस्टोर भयो।`,
      count: validTransactions.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `ब्याकअप रिस्टोर गर्न सकिएन: ${err?.message || 'पार्सिङ त्रुटि'}`,
    };
  }
}
