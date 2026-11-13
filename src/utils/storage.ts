import { 
  PurchaseTransaction, 
  ShopDetails, 
  BullionMarketRates 
} from '../types/bullion';
import { 
  generateVoucherNumber, 
  generateVerificationHash, 
  getCurrentDateBS, 
  getCurrentFiscalYearBS, 
  formatNPR,
  numberToNepaliWords,
  numberToEnglishWords
} from './nepalBullionCalculations';

const TRANSACTIONS_KEY = 'nepal_bullion_legal_transactions_v1';
const SHOP_DETAILS_KEY = 'nepal_bullion_shop_profile_v1';
const RATES_KEY = 'nepal_bullion_market_rates_v1';

export const DEFAULT_SHOP_DETAILS: ShopDetails = {
  nameNepali: 'श्री अन्नपूर्ण सुनचाँदी गहना मन्दिर प्रा.लि.',
  nameEnglish: 'Shree Annapurna Gold & Silver Jewellers Pvt. Ltd.',
  proprietorName: 'रमेश कुमार शाक्य (Ramesh Kumar Shakya)',
  panVatNumber: '601284912',
  businessRegNumber: '148201/072/073',
  fenegosidaMembershipNo: 'KTM-FENEGOSIDA-084',
  address: 'न्यूरोड, वडा नं. २२, काठमाडौं, नेपाल (New Road, Ward 22, Kathmandu)',
  phone: '+977-01-4245678 / 9851023456',
  email: 'annapurnajewellers.ktm@gmail.com',
};

export const DEFAULT_RATES: BullionMarketRates = {
  chhapawalGoldPerTola: 172500, // NPR 1,72,500 per Tola
  tezabiGoldPerTola: 171700,    // NPR 1,71,700 per Tola
  gold18kPerTola: 138000,       // NPR 1,38,000 per Tola
  fineSilverPerTola: 2050,      // NPR 2,050 per Tola
  lastUpdated: new Date().toISOString(),
};

// Seed sample transaction that showcases full legal KYC compliance
export const SAMPLE_INITIAL_TRANSACTIONS: PurchaseTransaction[] = [
  {
    id: 'tx-2083-001',
    serialNo: 1,
    contractSerialNumber: 'SN-2083-0001',
    voucherNumber: 'NP-GOLD-2083-0001',
    fiscalYear: getCurrentFiscalYearBS(),
    dateBS: getCurrentDateBS(),
    dateAD: new Date().toISOString().split('T')[0],
    time: '11:45 AM',
    seller: {
      fullNameNepali: 'सरिता थापा मगर',
      fullNameEnglish: 'Sarita Thapa Magar',
      grandfatherName: 'हर्क बहादुर थापा मगर',
      fatherName: 'कर्ण बहादुर थापा मगर',
      spouseName: 'प्रकाश थापा मगर',
      fatherOrHusbandName: 'कर्ण बहादुर थापा मगर / प्रकाश थापा मगर',
      idType: 'citizenship',
      idNumber: '२७-०१-७५-०३८४२',
      issuedDistrict: 'काठमाडौं (Kathmandu)',
      issuedDateBS: '२०७५/०३/१४',
      province: 'बागमती प्रदेश (Bagmati)',
      district: 'काठमाडौं',
      municipality: 'चन्द्रागिरि नगरपालिका',
      wardNo: '४',
      tole: 'थानकोट',
      currentAddress: 'थानकोट, काठमाडौं',
      mobileNumber: '9841892341',
      isMobileVerified: true,
      sellerPhotoUrl: '',
    },
    items: [
      {
        id: 'item-1',
        metalType: 'gold',
        purity: '24K_chhapawal',
        purityLabel: 'छापावाल सुन (24K Gold - 99.5%)',
        itemName: 'पुराना सुनको तिलहरी (Old Tilhari)',
        quantity: 1,
        grossWeightGrams: 23.32,
        grossWeightTola: 2,
        grossWeightLal: 0,
        stoneWeightGrams: 1.20,
        stoneDeductionGrams: 1.20,
        waxDirtWeightGrams: 0.45,
        jartiPercentage: 2,
        jartiWeightGrams: 0.43,
        netWeightGrams: 21.24,
        netWeightTola: 1.82,
        netWeightLal: 82,
        testingMethod: 'touchstone_acid',
        testedPurityPercentage: 99.2,
        ratePerTola: 172500,
        ratePerGram: 14789.35,
        totalItemValue: 314125,
        itemCondition: 'intact_wearable',
        notes: 'पारिवारिक स्त्रीधन, कसी जाँचमा पूर्ण शुद्ध प्रमाणित',
      },
    ],
    declaration: {
      source: 'marriage_stridhan_dowry',
      sourceDescription: 'विवाहको समयमा माइती पक्षबाट प्राप्त स्त्रीधन (Personal Marriage Stridhan)',
      hasOriginalReceipt: false,
      isAbsoluteOwner: true,
      isNotStolenOrLooted: true,
      isNotMortgagedOrDisputed: true,
      acceptsCriminalLiabilityUnderSection244: true,
      acceptsAmlCompliance2064: true,
      indemnifiesJewelerFromAllClaims: true,
      declarationTextNepali: 'यो गहना मेरो आफ्नै वैध आर्जन/स्त्रीधन भएको र कुनै चोरी, डकैती वा गैरकानुनी स्रोतको नभएको व्यहोरा सत्य हो। पछि कुनै कानुनी दावी परेमा मुलुकी अपराध संहिता २०७४ बमोजिम सम्पूर्ण जवाफदेहिता म स्वयंले बेहोर्नेछु।',
      declarationTextEnglish: 'I solemnly affirm under Muluki Criminal Code 2074 that I am the sole lawful owner of these items. They are neither stolen nor disputed. I fully indemnify the buyer against any civil or criminal liability.',
      declaredAt: new Date().toISOString(),
    },
    payment: {
      method: 'bank_transfer',
      amount: 314125,
      amountInWordsNepali: 'तीन लाख चौध हजार एक सय पच्चिस रुपैयाँ मात्र',
      amountInWordsEnglish: 'Three Lakh Fourteen Thousand One Hundred Twenty Five Rupees Only',
      bankName: 'Nabil Bank Ltd.',
      accountNumber: '01902017500392',
      transactionReference: 'NBL-RTGS-9823419',
      sellerPAN: '109842103',
      isCashOverLimit: false,
    },
    witness: {
      witness1Name: 'प्रकाश थापा मगर (Prakash Thapa Magar)',
      witness1Address: 'चन्द्रागिरि न.पा.-४, काठमाडौं',
      witness1Phone: '9851098231',
      witness1IdNumber: '२७-०१-७२-०१८३१',
    },
    shop: DEFAULT_SHOP_DETAILS,
    totalGrossGrams: 23.32,
    totalNetGrams: 21.24,
    totalNetTola: 1.82,
    grandTotalAmount: 314125,
    tamperVerificationHash: 'NEP-LEGAL-7A8B9C0D-4912',
    complianceRating: 'COMPLIANT_SECURE',
    status: 'completed',
    createdAt: new Date().toISOString(),
  },
];

export function getStoredTransactions(): PurchaseTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(SAMPLE_INITIAL_TRANSACTIONS));
      return SAMPLE_INITIAL_TRANSACTIONS;
    }
    const parsed: PurchaseTransaction[] = JSON.parse(raw);
    // Ensure backwards compatibility: every transaction has serialNo and contractSerialNumber
    let hasModified = false;
    const normalized = parsed.map((tx, idx) => {
      if (!tx.serialNo || !tx.contractSerialNumber) {
        hasModified = true;
        const serialNo = tx.serialNo || (parsed.length - idx);
        const contractSerialNumber = tx.contractSerialNumber || `SN-2083-${String(serialNo).padStart(4, '0')}`;
        return { ...tx, serialNo, contractSerialNumber };
      }
      return tx;
    });
    if (hasModified) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return SAMPLE_INITIAL_TRANSACTIONS;
  }
}

export function saveTransaction(tx: PurchaseTransaction): void {
  const current = getStoredTransactions();
  // If transaction with same ID exists, update it; otherwise prepend
  const existsIndex = current.findIndex((item) => item.id === tx.id);
  let updated: PurchaseTransaction[];
  if (existsIndex >= 0) {
    updated = [...current];
    updated[existsIndex] = tx;
  } else {
    updated = [tx, ...current];
  }
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
}

export function getShopDetails(): ShopDetails {
  try {
    const raw = localStorage.getItem(SHOP_DETAILS_KEY);
    if (!raw) return DEFAULT_SHOP_DETAILS;
    return { ...DEFAULT_SHOP_DETAILS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SHOP_DETAILS;
  }
}

export function saveShopDetails(shop: ShopDetails): void {
  localStorage.setItem(SHOP_DETAILS_KEY, JSON.stringify(shop));
}

export function getMarketRates(): BullionMarketRates {
  try {
    const raw = localStorage.getItem(RATES_KEY);
    if (!raw) return DEFAULT_RATES;
    return { ...DEFAULT_RATES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_RATES;
  }
}

export function saveMarketRates(rates: BullionMarketRates): void {
  localStorage.setItem(RATES_KEY, JSON.stringify(rates));
}

export function deleteTransaction(id: string): void {
  const current = getStoredTransactions();
  const filtered = current.filter((t) => t.id !== id);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
}

export function exportFullBackupJSON(): string {
  const data = {
    app: 'Nepal Bullion Legal Purchase System',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    shop: getShopDetails(),
    rates: getMarketRates(),
    transactions: getStoredTransactions(),
  };
  return JSON.stringify(data, null, 2);
}

export function importFullBackupJSON(jsonStr: string): { success: boolean; message: string; count?: number } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.transactions || !Array.isArray(data.transactions)) {
      return { success: false, message: 'अमान्य ब्याकअप फाइल ढाँचा (Invalid backup format: missing transactions).' };
    }
    
    // Validate and normalize imported transactions
    const validTransactions: PurchaseTransaction[] = data.transactions.map((tx: any, idx: number) => {
      const serialNo = tx.serialNo || (idx + 1);
      const contractSerialNumber = tx.contractSerialNumber || `SN-2083-${String(serialNo).padStart(4, '0')}`;
      return {
        ...tx,
        serialNo,
        contractSerialNumber,
      };
    });

    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(validTransactions));

    if (data.shop && typeof data.shop === 'object') {
      saveShopDetails(data.shop);
    }
    if (data.rates && typeof data.rates === 'object') {
      saveMarketRates(data.rates);
    }

    return { 
      success: true, 
      message: `${validTransactions.length} वटा खरिद सम्झौता तथा पसल विवरण सफलतापूर्वक रिस्टोर भयो।`,
      count: validTransactions.length 
    };
  } catch (err: any) {
    return { success: false, message: `ब्याकअप रिस्टोर गर्न सकिएन: ${err?.message || 'पार्सिङ त्रुटि'}` };
  }
}

export function resetToSampleTransactions(): PurchaseTransaction[] {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(SAMPLE_INITIAL_TRANSACTIONS));
  return SAMPLE_INITIAL_TRANSACTIONS;
}
