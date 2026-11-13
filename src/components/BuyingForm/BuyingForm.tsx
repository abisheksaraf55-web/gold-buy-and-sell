import React, { useState } from 'react';
import { 
  PurchaseTransaction, 
  MetalItem, 
  SellerKYC, 
  LegalDeclaration, 
  PaymentRecord, 
  WitnessDetails, 
  ShopDetails, 
  BullionMarketRates,
  AcquisitionSource,
  PaymentMethod,
  TestingMethod,
  GoldPurity,
  SilverPurity
} from '../../types/bullion';
import { 
  GRAMS_PER_TOLA, 
  gramsToTolaLal, 
  tolaAanaLalToGrams,
  formatNPR, 
  numberToNepaliWords, 
  numberToEnglishWords,
  getCurrentDateBS,
  getCurrentFiscalYearBS,
  generateVoucherNumber,
  generateContractSerialNumber,
  generateVerificationHash
} from '../../utils/nepalBullionCalculations';
import { SignaturePad } from '../SignaturePad';
import { ThumbprintPad } from '../ThumbprintPad';
import { DocumentCropModal } from '../DocumentCropModal';
import { extractKycFromIdImage, ExtractedIdData } from '../../utils/idOcrHelper';
import { optimizeImageForOcr } from '../../utils/imageOptimizer';
import { 
  UserCheck, 
  Scale, 
  FileCheck2, 
  CreditCard, 
  PenTool, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Camera, 
  Upload, 
  CheckCircle2, 
  ShieldCheck,
  Calculator,
  ArrowRight,
  ArrowLeft,
  Info,
  Copy,
  Layers,
  Sparkles,
  Loader2,
  ScanText,
  Crop
} from 'lucide-react';

interface BuyingFormProps {
  rates: BullionMarketRates;
  shop: ShopDetails;
  existingCount: number;
  onComplete: (tx: PurchaseTransaction) => void;
  onCancel: () => void;
}

export const BuyingForm: React.FC<BuyingFormProps> = ({
  rates,
  shop,
  existingCount,
  onComplete,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  // 1. Seller KYC State
  const [seller, setSeller] = useState<SellerKYC>({
    fullNameNepali: '',
    fullNameEnglish: '',
    grandfatherName: '',
    fatherName: '',
    spouseName: '',
    fatherOrHusbandName: '',
    idType: 'citizenship',
    idNumber: '',
    issuedDistrict: 'काठमाडौं',
    issuedDateBS: '२०७६/०५/१२',
    province: 'बागमती प्रदेश (Bagmati)',
    district: 'काठमाडौं',
    municipality: '',
    wardNo: '',
    tole: '',
    currentAddress: '',
    mobileNumber: '',
    isMobileVerified: true,
    sellerPhotoUrl: '',
    idCardFrontUrl: '',
    idCardBackUrl: '',
  });

  // 2. Items State
  const [items, setItems] = useState<MetalItem[]>([
    {
      id: 'item-1',
      metalType: 'gold',
      purity: '24K_chhapawal',
      purityLabel: 'छापावाल सुन (24K Gold)',
      itemName: 'सुनको सिक्री (Gold Chain)',
      quantity: 1,
      grossWeightGrams: 11.66,
      grossWeightTola: 1,
      grossWeightLal: 0,
      stoneWeightGrams: 0,
      stoneDeductionGrams: 0,
      waxDirtWeightGrams: 0.15,
      jartiPercentage: 2,
      jartiWeightGrams: 0.23,
      netWeightGrams: 11.28,
      netWeightTola: 0.97,
      netWeightLal: 97,
      testingMethod: 'touchstone_acid',
      testedPurityPercentage: 99.5,
      ratePerTola: rates.chhapawalGoldPerTola,
      ratePerGram: Math.round(rates.chhapawalGoldPerTola / GRAMS_PER_TOLA),
      totalItemValue: Math.round((11.28 / GRAMS_PER_TOLA) * rates.chhapawalGoldPerTola),
      itemCondition: 'intact_wearable',
      notes: '',
    },
  ]);

  // Converter state for modal / quick calc
  const [converterGrams, setConverterGrams] = useState<number>(11.664);
  const [converterTola, setConverterTola] = useState<number>(1);
  const [converterAana, setConverterAana] = useState<number>(0);
  const [converterLal, setConverterLal] = useState<number>(0);

  // 3. Legal Declaration State
  const [declaration, setDeclaration] = useState<LegalDeclaration>({
    source: 'marriage_stridhan_dowry',
    sourceDescription: '',
    hasOriginalReceipt: false,
    isAbsoluteOwner: true,
    isNotStolenOrLooted: true,
    isNotMortgagedOrDisputed: true,
    acceptsCriminalLiabilityUnderSection244: true,
    acceptsAmlCompliance2064: true,
    indemnifiesJewelerFromAllClaims: true,
    declarationTextNepali: 'यो गहना मेरो आफ्नै वैध आर्जन भएको र कुनै चोरी, डकैती वा गैरकानुनी स्रोतको नभएको व्यहोरा सत्य हो। पछि कुनै कानुनी दावी परेमा मुलुकी अपराध संहिता २०७४ बमोजिम सम्पूर्ण जवाफदेहिता म स्वयंले बेहोर्नेछु।',
    declarationTextEnglish: 'I solemnly affirm under Muluki Criminal Code 2074 that I am the sole lawful owner of these items. They are neither stolen nor disputed. I fully indemnify the buyer against any civil or criminal liability.',
    declaredAt: new Date().toISOString(),
  });

  // Calculate Grand Totals
  const totalGrossGrams = items.reduce((sum, item) => sum + (Number(item.grossWeightGrams) || 0), 0);
  const totalNetGrams = items.reduce((sum, item) => sum + (Number(item.netWeightGrams) || 0), 0);
  const grandTotalAmount = items.reduce((sum, item) => sum + (Number(item.totalItemValue) || 0), 0);
  const totalNetTola = Math.round((totalNetGrams / GRAMS_PER_TOLA) * 100) / 100;

  // 4. Payment State
  const [payment, setPayment] = useState<PaymentRecord>({
    method: 'bank_transfer',
    amount: grandTotalAmount,
    amountInWordsNepali: numberToNepaliWords(grandTotalAmount),
    amountInWordsEnglish: numberToEnglishWords(grandTotalAmount),
    bankName: 'Nabil Bank Ltd.',
    accountNumber: '',
    transactionReference: '',
    sellerPAN: '',
    isCashOverLimit: false,
  });

  // Sync payment amounts whenever grand total changes
  React.useEffect(() => {
    setPayment((prev) => ({
      ...prev,
      amount: grandTotalAmount,
      amountInWordsNepali: numberToNepaliWords(grandTotalAmount),
      amountInWordsEnglish: numberToEnglishWords(grandTotalAmount),
      isCashOverLimit: prev.method === 'cash' && grandTotalAmount > 50000,
    }));
  }, [grandTotalAmount]);

  // 5. Witness State
  const [witness, setWitness] = useState<WitnessDetails>({
    witness1Name: '',
    witness1Address: '',
    witness1Phone: '',
    witness1IdNumber: '',
  });

  // Automatic ID OCR & document frame cropper state
  const [isScanningId, setIsScanningId] = useState(false);
  const [ocrSuccessMessage, setOcrSuccessMessage] = useState<string | null>(null);
  const [ocrErrorMessage, setOcrErrorMessage] = useState<string | null>(null);
  const [cropModalState, setCropModalState] = useState<{
    isOpen: boolean;
    field: 'idCardFrontUrl' | 'idCardBackUrl';
    mode: 'camera' | 'crop';
    imageSrc?: string;
  } | null>(null);

  // Photo handlers with rectangular cropper for ID documents & automated OCR
  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'sellerPhotoUrl' | 'idCardFrontUrl' | 'idCardBackUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      let dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      // For Front/Back ID documents, always open the automatic rectangular cropper first
      if (field === 'idCardFrontUrl' || field === 'idCardBackUrl') {
        setCropModalState({
          isOpen: true,
          field,
          mode: 'crop',
          imageSrc: dataUrl,
        });
        return;
      }

      // Seller portrait photo: optimize & save directly
      try {
        dataUrl = await optimizeImageForOcr(dataUrl);
      } catch (optErr) {
        console.warn('Image optimization skipped:', optErr);
      }

      setSeller((prev) => ({ ...prev, [field]: dataUrl }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = async (croppedDataUrl: string) => {
    if (!cropModalState) return;
    const targetField = cropModalState.field;
    setCropModalState(null);

    let finalUrl = croppedDataUrl;
    try {
      finalUrl = await optimizeImageForOcr(croppedDataUrl);
    } catch (optErr) {
      console.warn('Cropped image optimization skipped:', optErr);
    }

    setSeller((prev) => ({ ...prev, [targetField]: finalUrl }));

    if (targetField === 'idCardFrontUrl') {
      await processIdOcr(finalUrl, seller.idCardBackUrl);
    } else {
      await processIdOcr(seller.idCardFrontUrl, finalUrl);
    }
  };

  const processIdOcr = async (frontUrl?: string, backUrl?: string) => {
    if (!frontUrl && !backUrl) return;

    setIsScanningId(true);
    setOcrSuccessMessage(null);
    setOcrErrorMessage(null);
    try {
      const extracted = await extractKycFromIdImage({
        frontImage: frontUrl,
        backImage: backUrl,
      });

      if (extracted) {
        // Determine ID type from document detection
        let detectedType: 'citizenship' | 'national_id' | 'passport' | 'voter_id' = seller.idType;
        if (extracted.idType && ['citizenship', 'national_id', 'passport', 'voter_id'].includes(extracted.idType)) {
          detectedType = extracted.idType as any;
        } else if (extracted.detectedDocType && ['citizenship', 'national_id', 'passport', 'voter_id'].includes(extracted.detectedDocType)) {
          detectedType = extracted.detectedDocType as any;
        }

        const docNames: Record<string, string> = {
          citizenship: 'नागरिकता (Citizenship)',
          national_id: 'राष्ट्रिय परिचयपत्र (National ID)',
          passport: 'राहदानी (Passport)',
          voter_id: 'मतदाता परिचयपत्र (Voter ID)',
          driving_license: 'सवारी चालक अनुमतिपत्र (Driving License)',
        };

        const docTitle = docNames[detectedType] || docNames[extracted.detectedDocType || ''] || 'परिचयपत्र';
        const sideNote = frontUrl && backUrl ? 'अगाडि र पछाडि दुवै भागबाट' : backUrl ? 'पछाडिको भागबाट' : 'अगाडिको भागबाट';

        setSeller((prev) => ({
          ...prev,
          fullNameNepali: extracted.fullNameNepali || prev.fullNameNepali,
          fullNameEnglish: extracted.fullNameEnglish || prev.fullNameEnglish,
          grandfatherName: extracted.grandfatherName || prev.grandfatherName,
          fatherName: extracted.fatherName || prev.fatherName,
          spouseName: extracted.spouseName || prev.spouseName,
          fatherOrHusbandName: extracted.fatherOrHusbandName || extracted.fatherName || prev.fatherOrHusbandName,
          idType: detectedType,
          idNumber: extracted.idNumber || prev.idNumber,
          issuedDistrict: extracted.issuedDistrict || prev.issuedDistrict,
          issuedDateBS: extracted.issuedDateBS || prev.issuedDateBS,
          province: extracted.province || prev.province,
          district: extracted.district || prev.district,
          municipality: extracted.municipality || prev.municipality,
          wardNo: extracted.wardNo || prev.wardNo,
          tole: extracted.tole || prev.tole,
          currentAddress: extracted.currentAddress || prev.currentAddress,
        }));
        setOcrSuccessMessage(`${docTitle} ${sideNote} विवरण पहिचान भई भरियो (Auto-detected & merged successfully!)`);
      } else {
        setOcrErrorMessage('तस्बिरबाट परिचयपत्र स्पष्ट पढ्न सकिएन, कृपया स्पष्ट फोटो खिच्नुहोस् वा विवरण आफैं भर्नुहोस्।');
      }
    } catch (err: any) {
      console.error('OCR detection error:', err);
      setOcrErrorMessage(err.message || 'फोटो प्रोसेस गर्न सकिएन। कृपया विवरण हातैले भर्नुहोस्।');
    } finally {
      setIsScanningId(false);
    }
  };

  // Item management
  const addItem = (presetName?: string, presetPurity: GoldPurity | SilverPurity = '24K_chhapawal', presetGrams: number = 5.0) => {
    const isSilver = presetPurity.includes('silver');
    const rate = isSilver ? rates.fineSilverPerTola : rates.chhapawalGoldPerTola;
    const label = isSilver 
      ? 'फाइन चाँदी (Fine Silver 999)' 
      : presetPurity === '22K_tezabi' 
      ? 'तेजाबी सुन (22K Gold)' 
      : 'छापावाल सुन (24K Gold)';

    const baseGross = presetGrams;
    const jartiCut = Math.round(((baseGross * 2) / 100) * 100) / 100;
    const netGrams = Math.round((baseGross - jartiCut) * 100) / 100;
    const tolaInfo = gramsToTolaLal(netGrams);

    const newItem: MetalItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      metalType: isSilver ? 'silver' : 'gold',
      purity: presetPurity,
      purityLabel: label,
      itemName: presetName || `गहना #${items.length + 1}`,
      quantity: 1,
      grossWeightGrams: baseGross,
      grossWeightTola: tolaInfo.tola,
      grossWeightLal: tolaInfo.lal,
      stoneWeightGrams: 0,
      stoneDeductionGrams: 0,
      waxDirtWeightGrams: 0,
      jartiPercentage: 2,
      jartiWeightGrams: jartiCut,
      netWeightGrams: netGrams,
      netWeightTola: tolaInfo.tola,
      netWeightLal: tolaInfo.lal,
      testingMethod: 'touchstone_acid',
      testedPurityPercentage: isSilver ? 99.9 : 99.5,
      ratePerTola: rate,
      ratePerGram: Math.round(rate / GRAMS_PER_TOLA),
      totalItemValue: Math.round((netGrams / GRAMS_PER_TOLA) * rate),
      itemCondition: 'intact_wearable',
    };
    setItems((prev) => [...prev, newItem]);
  };

  const cloneItem = (sourceItem: MetalItem) => {
    const cloned: MetalItem = {
      ...sourceItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      itemName: `${sourceItem.itemName} (प्रतिलिपि)`,
    };
    setItems((prev) => [...prev, cloned]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<MetalItem>) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;

        const merged = { ...item, ...updates };

        // Recalculate net weight and valuation
        const gross = Number(merged.grossWeightGrams) || 0;
        const deductionMode = merged.deductionMode || 'itemized';

        let netGrams = 0;
        const stone =
          'stoneDeductionGrams' in updates
            ? Number(updates.stoneDeductionGrams) || 0
            : 'stoneWeightGrams' in updates
              ? Number(updates.stoneWeightGrams) || 0
              : Number(merged.stoneDeductionGrams ?? merged.stoneWeightGrams) || 0;
        const wax = Number(merged.waxDirtWeightGrams) || 0;
        const jartiPct = Number(merged.jartiPercentage) || 0;
        let jartiCut = 0;

        if (deductionMode === 'direct_grams') {
          const manualCut = Number(merged.manualDeductionGrams) || 0;
          netGrams = Math.max(0, Math.round((gross - manualCut) * 100) / 100);
        } else {
          const baseAfterStone = Math.max(0, gross - stone - wax);
          jartiCut = Math.round(((baseAfterStone * jartiPct) / 100) * 100) / 100;
          netGrams = Math.max(0, Math.round((baseAfterStone - jartiCut) * 100) / 100);
        }

        const tolaInfo = gramsToTolaLal(netGrams);
        const rateTola = Number(merged.ratePerTola) || rates.chhapawalGoldPerTola;
        const rateGram = Math.round((rateTola / GRAMS_PER_TOLA) * 100) / 100;
        const totalVal = Math.round((netGrams / GRAMS_PER_TOLA) * rateTola);

        return {
          ...merged,
          stoneWeightGrams: stone,
          stoneDeductionGrams: stone,
          jartiWeightGrams: jartiCut,
          netWeightGrams: netGrams,
          netWeightTola: tolaInfo.tola,
          netWeightLal: tolaInfo.lal,
          ratePerGram: rateGram,
          totalItemValue: totalVal,
        };
      })
    );
  };

  const handlePurityChange = (
    id: string, 
    purity: GoldPurity | SilverPurity, 
    metalType: 'gold' | 'silver', 
    customPct?: number
  ) => {
    let rate = rates.chhapawalGoldPerTola;
    let label = 'छापावाल सुन (24K Gold)';
    let purityPct = 99.5;

    if (metalType === 'gold') {
      if (purity === 'custom_percentage') {
        const pct = customPct !== undefined ? customPct : 85.0;
        purityPct = pct;
        // Calculated prorated rate: (Chhapawal Rate * Percentage) / 99.5
        rate = Math.round((rates.chhapawalGoldPerTola * pct) / 99.5);
        label = `कस्टम शुद्धता (${pct}% Purity Gold)`;
      } else if (purity === '22K_tezabi') {
        rate = rates.tezabiGoldPerTola;
        label = 'तेजाबी सुन (22K Gold)';
        purityPct = 91.6;
      } else if (purity === '18K_hallmark') {
        rate = rates.gold18kPerTola;
        label = '१८ क्यारेट सुन (18K Hallmark)';
        purityPct = 75.0;
      } else if (purity === '14K_jewelry') {
        rate = Math.round((rates.chhapawalGoldPerTola * 14) / 24);
        label = '१४ क्यारेट सुन (14K Gold)';
        purityPct = 58.5;
      }
    } else {
      if (purity === 'custom_percentage') {
        const pct = customPct !== undefined ? customPct : 80.0;
        purityPct = pct;
        rate = Math.round((rates.fineSilverPerTola * pct) / 99.9);
        label = `कस्टम चाँदी (${pct}% Purity Silver)`;
      } else {
        rate = rates.fineSilverPerTola;
        label = purity === 'fine_silver_999' ? 'फाइन चाँदी (Fine Silver 999)' : 'स्टर्लिंग चाँदी (Silver 925)';
        purityPct = purity === 'fine_silver_999' ? 99.9 : 92.5;
      }
    }

    updateItem(id, {
      metalType,
      purity,
      purityLabel: label,
      ratePerTola: rate,
      testedPurityPercentage: purityPct,
    });
  };

  const handleCustomPercentageChange = (id: string, pctVal: number, metalType: 'gold' | 'silver') => {
    const safePct = Math.min(100, Math.max(1, pctVal || 0));
    const baseRate = metalType === 'gold' ? rates.chhapawalGoldPerTola : rates.fineSilverPerTola;
    const basePurity = metalType === 'gold' ? 99.5 : 99.9;
    const calculatedRate = Math.round((baseRate * safePct) / basePurity);
    const label = metalType === 'gold' 
      ? `कस्टम शुद्धता (${safePct}% Purity Gold)` 
      : `कस्टम चाँदी (${safePct}% Purity Silver)`;

    updateItem(id, {
      purity: 'custom_percentage',
      purityLabel: label,
      ratePerTola: calculatedRate,
      testedPurityPercentage: safePct,
    });
  };

  // Final submit handler
  const handleFinalSubmit = () => {
    const nextSerial = existingCount + 1;
    const contractSerialNumber = generateContractSerialNumber(nextSerial);
    const voucherNumber = generateVoucherNumber(nextSerial);
    const verificationHash = generateVerificationHash(
      contractSerialNumber,
      seller.idNumber || 'NOID',
      grandTotalAmount
    );

    const fullTx: PurchaseTransaction = {
      id: `tx-${Date.now()}`,
      serialNo: nextSerial,
      contractSerialNumber,
      voucherNumber,
      fiscalYear: getCurrentFiscalYearBS(),
      dateBS: getCurrentDateBS(),
      dateAD: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      seller,
      items,
      declaration,
      payment: {
        ...payment,
        amount: grandTotalAmount,
        amountInWordsNepali: numberToNepaliWords(grandTotalAmount),
        amountInWordsEnglish: numberToEnglishWords(grandTotalAmount),
      },
      witness,
      shop,
      totalGrossGrams,
      totalNetGrams,
      totalNetTola,
      grandTotalAmount,
      tamperVerificationHash: verificationHash,
      complianceRating: seller.idNumber && seller.signatureUrl ? 'COMPLIANT_SECURE' : 'REQUIRES_REVIEW',
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    onComplete(fullTx);
  };

  const steps = [
    { num: 1, title: 'बिक्रेता पहिचान', subtitle: 'Seller KYC', icon: UserCheck },
    { num: 2, title: 'गहना/धातु तौल', subtitle: 'Metal & Weight', icon: Scale },
    { num: 3, title: 'कानुनी स्वघोषणा', subtitle: 'Affidavit / Source', icon: FileCheck2 },
    { num: 4, title: 'भुक्तानी तथा कर', subtitle: 'Payment & AML', icon: CreditCard },
    { num: 5, title: 'साक्षी तथा ल्याप्चे', subtitle: 'Biometrics & Sign', icon: PenTool },
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="bg-neutral-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
              कानुनी सुरक्षा फाराम
            </span>
            <span className="text-neutral-500">/</span>
            <span className="text-xs text-neutral-300">
              मुलुकी अपराध संहिता दफा २४४ अनुपालित
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white mt-0.5">
            सुनचाँदी खरिद सम्झौता तथा भरपाई फाराम (Precious Metals Purchase Form)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-300 bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700">
            मिति: {getCurrentDateBS()} (वि.सं.)
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            रद्द गर्नुहोस्
          </button>
        </div>
      </div>

      {/* Steps Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-neutral-200 bg-neutral-50">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = activeStep === s.num;
          const isDone = activeStep > s.num;

          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num)}
              className={`p-3 text-left border-r border-b sm:border-b-0 border-neutral-200 transition-colors flex items-center gap-2.5 ${
                isActive
                  ? 'bg-white text-neutral-900 shadow-xs border-b-2 border-b-amber-600'
                  : isDone
                  ? 'text-neutral-700 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:bg-neutral-100'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  isActive
                    ? 'bg-amber-600 text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate leading-tight">{s.title}</div>
                <div className="text-[10px] text-neutral-500 truncate">{s.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Step Content */}
      <div className="p-6">
        {/* STEP 1: SELLER KYC */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
                <div className="text-xs text-amber-900">
                  <strong>कानुनी सूचना:</strong> मुलुकी अपराध संहिता २०७४ अनुसार, बिक्रेताको नाम र नागरिकता नम्बर प्रमाणित नगरी खरिद गर्दा चोरीको माल किन्ने कसूरमा मुछिइने कानुनी जोखिम रहन्छ।
                </div>
              </div>
            </div>

            {/* Auto-OCR Status Notification */}
            {isScanningId && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-900 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block">नागरिकता पहिचान हुँदैछ (AI Vision ID OCR in progress...)</span>
                  <span className="text-[11px] text-blue-700">तस्बिरबाट नाम, नागरिकता नं, जारी जिल्ला र ठेगाना स्वतः पढ्दैछ र फाराममा भर्दैछ। कृपया केही सेकेन्ड पर्खनुहोस्।</span>
                </div>
              </div>
            )}

            {ocrSuccessMessage && !isScanningId && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-emerald-900">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{ocrSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOcrSuccessMessage(null)}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
                >
                  हटाउनुहोस् ✕
                </button>
              </div>
            )}

            {ocrErrorMessage && !isScanningId && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-2 text-red-900">
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{ocrErrorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOcrErrorMessage(null)}
                  className="text-[11px] text-red-700 hover:text-red-900 font-medium cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Personal info */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      बिक्रेताको पूरा नाम (नेपालीमा) *
                    </label>
                    <input
                      type="text"
                      required
                      value={seller.fullNameNepali}
                      onChange={(e) => setSeller({ ...seller, fullNameNepali: e.target.value })}
                      placeholder="उदा: सरिता थापा मगर"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Full Name (In English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={seller.fullNameEnglish}
                      onChange={(e) => setSeller({ ...seller, fullNameEnglish: e.target.value })}
                      placeholder="e.g. Sarita Thapa Magar"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* 3-Puste Lineage Section (३ पुस्ते पारिवारिक विवरण) */}
                <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-700" />
                      <span>३ पुस्ते विवरण (3-Generation Lineage for Legal Deed)</span>
                    </h4>
                    <span className="text-[10px] text-amber-800 font-medium">नेपाली कानुनी लिखतका लागि अनिवार्य</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        १. बाजेको नाम (Grandfather Name) *
                      </label>
                      <input
                        type="text"
                        value={seller.grandfatherName || ''}
                        onChange={(e) => setSeller({ ...seller, grandfatherName: e.target.value })}
                        placeholder="उदा: हर्क बहादुर थापा"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        २. बाबुको नाम (Father Name) *
                      </label>
                      <input
                        type="text"
                        value={seller.fatherName || seller.fatherOrHusbandName || ''}
                        onChange={(e) => setSeller({ 
                          ...seller, 
                          fatherName: e.target.value,
                          fatherOrHusbandName: e.target.value 
                        })}
                        placeholder="उदा: कर्ण बहादुर थापा"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        ३. पति / पत्नीको नाम (Spouse Name)
                      </label>
                      <input
                        type="text"
                        value={seller.spouseName || ''}
                        onChange={(e) => setSeller({ ...seller, spouseName: e.target.value })}
                        placeholder="विवाहित भएमा (वैकल्पिक)"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      मोवाइल नम्बर (Mobile Number) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={seller.mobileNumber}
                      onChange={(e) => setSeller({ ...seller, mobileNumber: e.target.value })}
                      placeholder="98XXXXXXXX"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      आमाको नाम (Mother Name)
                    </label>
                    <input
                      type="text"
                      value={seller.motherName || ''}
                      onChange={(e) => setSeller({ ...seller, motherName: e.target.value })}
                      placeholder="वैकल्पिक (नागरिकतामा भए अनुसार)"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* ID Type & Details */}
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-neutral-700">
                    <span className="font-semibold text-neutral-900">परिचयपत्रको प्रकार:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="idType"
                        checked={seller.idType === 'citizenship'}
                        onChange={() => setSeller({ ...seller, idType: 'citizenship' })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>नागरिकता (Citizenship)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="idType"
                        checked={seller.idType === 'national_id'}
                        onChange={() => setSeller({ ...seller, idType: 'national_id' })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>राष्ट्रिय परिचयपत्र (National ID)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="idType"
                        checked={seller.idType === 'passport'}
                        onChange={() => setSeller({ ...seller, idType: 'passport' })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>राहदानी (Passport)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="idType"
                        checked={seller.idType === 'voter_id'}
                        onChange={() => setSeller({ ...seller, idType: 'voter_id' })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>मतदाता परिचयपत्र (Voter ID)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        परिचयपत्र नं. (ID Number) *
                      </label>
                      <input
                        type="text"
                        required
                        value={seller.idNumber}
                        onChange={(e) => setSeller({ ...seller, idNumber: e.target.value })}
                        placeholder="उदा: २७-०१-७५-०३८४२"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-md focus:ring-1 focus:ring-amber-500 tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        जारी जिल्ला (District) *
                      </label>
                      <input
                        type="text"
                        required
                        value={seller.issuedDistrict}
                        onChange={(e) => setSeller({ ...seller, issuedDistrict: e.target.value })}
                        placeholder="उदा: काठमाडौं"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-md focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        जारी मिति (वि.सं.) *
                      </label>
                      <input
                        type="text"
                        required
                        value={seller.issuedDateBS}
                        onChange={(e) => setSeller({ ...seller, issuedDateBS: e.target.value })}
                        placeholder="२०७५/०३/१४"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-md focus:ring-1 focus:ring-amber-500 tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                {/* Permanent Address */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wide">
                    स्थायी ठेगाना (Permanent Address)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-600 mb-1">प्रदेश (Province)</label>
                      <select
                        value={seller.province}
                        onChange={(e) => setSeller({ ...seller, province: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md bg-white"
                      >
                        <option value="कोशी प्रदेश (Koshi)">कोशी प्रदेश</option>
                        <option value="मधेश प्रदेश (Madhesh)">मधेश प्रदेश</option>
                        <option value="बागमती प्रदेश (Bagmati)">बागमती प्रदेश</option>
                        <option value="गण्डकी प्रदेश (Gandaki)">गण्डकी प्रदेश</option>
                        <option value="लुम्बिनी प्रदेश (Lumbini)">लुम्बिनी प्रदेश</option>
                        <option value="कर्णाली प्रदेश (Karnali)">कर्णाली प्रदेश</option>
                        <option value="सुदूरपश्चिम प्रदेश (Sudurpashchim)">सुदूरपश्चिम प्रदेश</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-neutral-600 mb-1">जिल्ला (District)</label>
                      <input
                        type="text"
                        value={seller.district}
                        onChange={(e) => setSeller({ ...seller, district: e.target.value })}
                        placeholder="काठमाडौं"
                        className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-neutral-600 mb-1">न.पा./गाउँपालिका</label>
                      <input
                        type="text"
                        value={seller.municipality}
                        onChange={(e) => setSeller({ ...seller, municipality: e.target.value })}
                        placeholder="चन्द्रागिरि न.पा."
                        className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-neutral-600 mb-1">वडा नं. (Ward)</label>
                      <input
                        type="text"
                        value={seller.wardNo}
                        onChange={(e) => setSeller({ ...seller, wardNo: e.target.value })}
                        placeholder="४"
                        className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md bg-white tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    हालको अस्थायी बसोबास ठेगाना (Current Living Address)
                  </label>
                  <input
                    type="text"
                    value={seller.currentAddress}
                    onChange={(e) => setSeller({ ...seller, currentAddress: e.target.value })}
                    placeholder="थानकोट, काठमाडौं (यदि स्थायी भन्दा फरक भएमा)"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Right Column: Photo & ID Document Upload */}
              <div className="space-y-4">
                <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/70 text-center">
                  <h4 className="text-xs font-bold text-neutral-900 mb-2 flex items-center justify-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-700" />
                    <span>बिक्रेताको तस्बिर (Seller Photo)</span>
                  </h4>

                  {seller.sellerPhotoUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={seller.sellerPhotoUrl}
                        alt="Seller"
                        className="w-32 h-40 object-cover rounded-lg border-2 border-amber-600 shadow-sm mx-auto"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setSeller({ ...seller, sellerPhotoUrl: '' })}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 text-[10px] hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block border-2 border-dashed border-neutral-300 hover:border-amber-500 rounded-lg p-6 bg-white transition-colors">
                      <Camera className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <span className="text-xs font-medium text-neutral-700 block">फोटो अपलोड गर्नुहोस्</span>
                      <span className="text-[10px] text-neutral-400 block mt-1">
                        सक्कली बिक्रेताको स्पष्ट फोटो
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'sellerPhotoUrl')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="border-2 border-blue-200 bg-blue-50/40 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <ScanText className="w-4 h-4 text-blue-700" />
                    <h4 className="text-xs font-bold text-neutral-900">
                      परिचयपत्र फोटो (Auto AI Multi-ID Reader)
                    </h4>
                  </div>
                  <p className="text-[10px] text-blue-800 font-medium mb-3">
                    नागरिकता, राष्ट्रिय परिचयपत्र (NID), राहदानी वा मतदाता परिचयपत्रको <strong>अगाडि (Front)</strong> र <strong>पछाडि (Back)</strong> दुवै तस्बिरबाट ठेगाना र विवरण स्वतः पहिचान हुन्छ
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Front Side Card */}
                    <div className="border border-blue-200 bg-white rounded-lg p-2.5 flex flex-col justify-between min-h-[185px]">
                      <div className="text-[11px] font-bold text-neutral-700 mb-1 flex items-center justify-between">
                        <span>अगाडिको भाग (Front Side)</span>
                        {seller.idCardFrontUrl && (
                          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            फ्रेम क्रप भयो
                          </span>
                        )}
                      </div>

                      {seller.idCardFrontUrl ? (
                        <div className="space-y-2 my-auto">
                          <div className="relative inline-block">
                            <img
                              src={seller.idCardFrontUrl}
                              alt="Front ID"
                              className="w-40 h-24 object-contain bg-neutral-50 rounded border-2 border-blue-400 shadow-xs mx-auto"
                              referrerPolicy="no-referrer"
                            />
                            {isScanningId && (
                              <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-xs rounded flex flex-col items-center justify-center text-white p-1">
                                <Loader2 className="w-4 h-4 animate-spin mb-0.5 text-amber-300" />
                                <span className="text-[9px] font-bold">पढ्दैछ...</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSeller({ ...seller, idCardFrontUrl: '' });
                                setOcrSuccessMessage(null);
                                setOcrErrorMessage(null);
                              }}
                              className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1 text-[9px] hover:bg-red-700 cursor-pointer shadow-xs"
                              title="हटाउनुहोस्"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setCropModalState({
                                  isOpen: true,
                                  field: 'idCardFrontUrl',
                                  mode: 'crop',
                                  imageSrc: seller.idCardFrontUrl,
                                })
                              }
                              className="px-2.5 py-1 text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Crop className="w-3 h-3" />
                              <span>फ्रेम मिलाउनुहोस् (Crop)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCropModalState({
                                  isOpen: true,
                                  field: 'idCardFrontUrl',
                                  mode: 'camera',
                                })
                              }
                              className="px-2 py-1 text-[10px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded inline-flex items-center gap-1 cursor-pointer"
                              title="क्यामेरा फ्रेमबाट पुनः खिच्नुहोस्"
                            >
                              <Camera className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 my-auto">
                          <label className="cursor-pointer block border-2 border-dashed border-blue-400 hover:border-blue-600 rounded-md p-2.5 bg-blue-50/25 transition-all hover:shadow-xs relative">
                            <div className="w-10 h-6 border-2 border-blue-500/80 rounded-xs mx-auto mb-1 flex items-center justify-center bg-white/80">
                              <Upload className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <span className="text-[11px] font-semibold text-neutral-800 block">
                              अगाडि फोटो अपलोड (Auto Frame)
                            </span>
                            <span className="text-[9px] text-neutral-500 block">
                              आयताकार फ्रेम भित्रको भाग मात्र प्रिन्ट/PDF हुन्छ
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, 'idCardFrontUrl')}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setCropModalState({
                                isOpen: true,
                                field: 'idCardFrontUrl',
                                mode: 'camera',
                              })
                            }
                            className="w-full py-1.5 px-2 text-[10px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-700" />
                            <span>क्यामेरा फ्रेमबाट खिच्नुहोस् (Camera Frame)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Back Side Card */}
                    <div className="border border-blue-200 bg-white rounded-lg p-2.5 flex flex-col justify-between min-h-[185px]">
                      <div className="text-[11px] font-bold text-neutral-700 mb-1 flex items-center justify-between">
                        <span>पछाडिको भाग (Back Side)</span>
                        {seller.idCardBackUrl && (
                          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            फ्रेम क्रप भयो
                          </span>
                        )}
                      </div>

                      {seller.idCardBackUrl ? (
                        <div className="space-y-2 my-auto">
                          <div className="relative inline-block">
                            <img
                              src={seller.idCardBackUrl}
                              alt="Back ID"
                              className="w-40 h-24 object-contain bg-neutral-50 rounded border-2 border-blue-400 shadow-xs mx-auto"
                              referrerPolicy="no-referrer"
                            />
                            {isScanningId && (
                              <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-xs rounded flex flex-col items-center justify-center text-white p-1">
                                <Loader2 className="w-4 h-4 animate-spin mb-0.5 text-amber-300" />
                                <span className="text-[9px] font-bold">पढ्दैछ...</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSeller({ ...seller, idCardBackUrl: '' });
                                setOcrSuccessMessage(null);
                                setOcrErrorMessage(null);
                              }}
                              className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1 text-[9px] hover:bg-red-700 cursor-pointer shadow-xs"
                              title="हटाउनुहोस्"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setCropModalState({
                                  isOpen: true,
                                  field: 'idCardBackUrl',
                                  mode: 'crop',
                                  imageSrc: seller.idCardBackUrl,
                                })
                              }
                              className="px-2.5 py-1 text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Crop className="w-3 h-3" />
                              <span>फ्रेम मिलाउनुहोस् (Crop)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCropModalState({
                                  isOpen: true,
                                  field: 'idCardBackUrl',
                                  mode: 'camera',
                                })
                              }
                              className="px-2 py-1 text-[10px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded inline-flex items-center gap-1 cursor-pointer"
                              title="क्यामेरा फ्रेमबाट पुनः खिच्नुहोस्"
                            >
                              <Camera className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 my-auto">
                          <label className="cursor-pointer block border-2 border-dashed border-blue-400 hover:border-blue-600 rounded-md p-2.5 bg-blue-50/25 transition-all hover:shadow-xs relative">
                            <div className="w-10 h-6 border-2 border-blue-500/80 rounded-xs mx-auto mb-1 flex items-center justify-center bg-white/80">
                              <Upload className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <span className="text-[11px] font-semibold text-neutral-800 block">
                              पछाडि फोटो अपलोड (Auto Frame)
                            </span>
                            <span className="text-[9px] text-neutral-500 block">
                              आयताकार फ्रेम भित्रको भाग मात्र प्रिन्ट/PDF हुन्छ
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, 'idCardBackUrl')}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setCropModalState({
                                isOpen: true,
                                field: 'idCardBackUrl',
                                mode: 'camera',
                              })
                            }
                            className="w-full py-1.5 px-2 text-[10px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-700" />
                            <span>क्यामेरा फ्रेमबाट खिच्नुहोस् (Camera Frame)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rescan / Re-read combined button */}
                  {(seller.idCardFrontUrl || seller.idCardBackUrl) && (
                    <div className="mt-3 flex justify-center">
                      <button
                        type="button"
                        disabled={isScanningId}
                        onClick={() => processIdOcr(seller.idCardFrontUrl, seller.idCardBackUrl)}
                        className="px-3.5 py-1.5 text-[11px] font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ScanText className="w-3.5 h-3.5" />
                        <span>
                          {seller.idCardFrontUrl && seller.idCardBackUrl 
                            ? 'दुवै भाग पुनः पहिचान गर्नुहोस् (Re-read Both Sides)' 
                            : 'पुनः पहिचान गर्नुहोस् (Re-read ID)'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-6 py-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span>अर्को: गहना/धातु विवरण भरौँ (Next: Metal Evaluation)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ITEMS & WEIGHT EVALUATION */}
        {activeStep === 2 && (
          <div className="space-y-6">
            {/* Quick Weight Converter Helper Box */}
            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-700" />
                <span className="font-semibold text-neutral-900">
                  तोला-आना-लाल तथा ग्राम रूपान्तरक (Nepal Standard Metrology Converter):
                </span>
                <span className="text-neutral-500 text-[11px]">१ तोला = ११.६६३८ ग्राम = १०० लाल = १६ आना</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded px-2 py-1">
                  <input
                    type="number"
                    step="0.01"
                    value={converterGrams}
                    onChange={(e) => {
                      const g = parseFloat(e.target.value) || 0;
                      setConverterGrams(g);
                      const res = gramsToTolaLal(g);
                      setConverterTola(res.tola);
                      setConverterLal(res.lal);
                    }}
                    className="w-16 text-xs text-right tabular-nums focus:outline-hidden"
                  />
                  <span className="text-[11px] text-neutral-500">ग्राम (g)</span>
                </div>
                <span>=</span>
                <div className="px-2 py-1 bg-amber-50 border border-amber-200 rounded font-semibold text-amber-900">
                  {gramsToTolaLal(converterGrams).formatted}
                </div>
              </div>
            </div>

            {/* Itemized Cards */}
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 border border-neutral-300 rounded-xl bg-white shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <h4 className="text-xs font-bold text-neutral-900">
                        गहना / वस्तुको विवरण (Item #{index + 1})
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-xs">
                        <span className="text-neutral-500">कुल रकम: </span>
                        <strong className="text-neutral-950 font-bold tabular-nums">
                          {formatNPR(item.totalItemValue, true)}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => cloneItem(item)}
                        className="px-2 py-1 text-[11px] text-neutral-600 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded flex items-center gap-1 transition-colors cursor-pointer"
                        title="यस्तै अर्को गहना थप्नुहोस् (Duplicate this item)"
                      >
                        <Copy className="w-3 h-3 text-neutral-500" />
                        <span>कपि (Clone)</span>
                      </button>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="यो वस्तु हटाउनुहोस्"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                    {/* Item Name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                        गहनाको नाम / विवरण *
                      </label>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateItem(item.id, { itemName: e.target.value })}
                        placeholder="उदा: सुनको सिक्री, औंठी, तिलहरी"
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* Metal Type */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                        धातुको किसिम (Metal Type) *
                      </label>
                      <select
                        value={item.metalType}
                        onChange={(e) =>
                          handlePurityChange(
                            item.id,
                            e.target.value === 'gold' ? '24K_chhapawal' : 'fine_silver_999',
                            e.target.value as 'gold' | 'silver'
                          )
                        }
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white"
                      >
                        <option value="gold">सुन (Gold)</option>
                        <option value="silver">चाँदी (Silver)</option>
                      </select>
                    </div>

                    {/* Purity */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                        क्यारेट / शुद्धता (Purity Grade) *
                      </label>
                      <select
                        value={item.purity}
                        onChange={(e) =>
                          handlePurityChange(
                            item.id,
                            e.target.value as GoldPurity | SilverPurity,
                            item.metalType
                          )
                        }
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white font-medium"
                      >
                        {item.metalType === 'gold' ? (
                          <>
                            <option value="24K_chhapawal">छापावाल सुन (24K - 99.5%)</option>
                            <option value="22K_tezabi">तेजाबी सुन (22K - 91.6%)</option>
                            <option value="18K_hallmark">१८ क्यारेट हलमार्क (18K - 75.0%)</option>
                            <option value="14K_jewelry">१४ क्यारेट सुन (14K - 58.5%)</option>
                            <option value="custom_percentage">म्यानुअल शुद्धता % (Custom Purity)</option>
                          </>
                        ) : (
                          <>
                            <option value="fine_silver_999">फाइन चाँदी (Fine Silver 999 - 99.9%)</option>
                            <option value="sterling_silver_925">स्टर्लिंग चाँदी (Sterling 925 - 92.5%)</option>
                            <option value="silver_traditional">परम्परागत चाँदीका गहना (80%)</option>
                            <option value="custom_percentage">म्यानुअल चाँदी % (Custom Silver)</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Condition */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                        गहनाको अवस्था (Condition)
                      </label>
                      <select
                        value={item.itemCondition}
                        onChange={(e) =>
                          updateItem(item.id, {
                            itemCondition: e.target.value as MetalItem['itemCondition'],
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white"
                      >
                        <option value="intact_wearable">सग्लो / प्रयोगयोग्य (Wearable)</option>
                        <option value="broken_scrap">टुक्रिएको / पुरानो (Scrap / Broken)</option>
                        <option value="melted_bullion">गालेको ढिक्का (Melted Bullion)</option>
                        <option value="traditional_antique">पुरातन / एन्टिक (Antique)</option>
                      </select>
                    </div>
                  </div>

                  {/* Weights & Deductions Row (जम्मा तौल तथा कट्टा विवरण) */}
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                          <span>तौल तथा कट्टा हिसाब (Weight & Deductions)</span>
                        </span>
                        {item.purity === 'custom_percentage' && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold border border-amber-300">
                            शुद्धता: {item.testedPurityPercentage}%
                          </span>
                        )}
                      </div>

                      {/* Toggle: विस्तृत कट्टा vs सिधै म्यानुअल कट्टा */}
                      <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-neutral-300 text-[10px]">
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { deductionMode: 'itemized' })}
                          className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                            (item.deductionMode || 'itemized') === 'itemized'
                              ? 'bg-amber-600 text-white font-bold shadow-2xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          विस्तृत कट्टा (Stone/Wax/Jarti)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(item.id, {
                              deductionMode: 'direct_grams',
                              manualDeductionGrams:
                                item.manualDeductionGrams !== undefined
                                  ? item.manualDeductionGrams
                                  : Math.round(
                                      ((item.stoneDeductionGrams || 0) +
                                        (item.waxDirtWeightGrams || 0) +
                                        (item.jartiWeightGrams || 0)) *
                                        100
                                    ) / 100,
                            })
                          }
                          className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                            item.deductionMode === 'direct_grams'
                              ? 'bg-amber-600 text-white font-bold shadow-2xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          सिधै कट्टा तौल (Direct Manual Deduction)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {/* Gross Weight (जम्मा तौल) */}
                      <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-neutral-900">
                            जम्मा तौल (Gross Grams) *
                          </label>
                          <span className="text-[10px] text-neutral-400">काँटा तौल</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={item.grossWeightGrams}
                          onChange={(e) =>
                            updateItem(item.id, { grossWeightGrams: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2.5 py-1.5 bg-neutral-50/50 border border-neutral-300 rounded-md tabular-nums font-bold text-neutral-900 focus:bg-white text-sm"
                        />
                        <span className="text-[10px] text-neutral-600 mt-1 block font-medium">
                          = {gramsToTolaLal(item.grossWeightGrams).tola} तोला {gramsToTolaLal(item.grossWeightGrams).lal} लाल
                        </span>
                      </div>

                      {/* Mode A: Direct Manual Deduction Grams */}
                      {item.deductionMode === 'direct_grams' ? (
                        <>
                          <div className="sm:col-span-2 bg-amber-50/70 p-2.5 rounded-lg border border-amber-300">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-bold text-amber-950">
                                घटेको कट्टा तौल (Manually Deducted Weight g) *
                              </label>
                              <span className="text-[10px] font-mono text-amber-800 font-bold">
                                -{Number(item.manualDeductionGrams || 0).toFixed(2)} g
                              </span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={item.manualDeductionGrams !== undefined ? item.manualDeductionGrams : ''}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  manualDeductionGrams: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="उदा: ०.५० वा १.२० ग्राम"
                              className="w-full px-2.5 py-1.5 bg-white border border-amber-400 rounded-md tabular-nums font-bold text-red-700 text-sm focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="text-[10px] text-amber-900 mt-1 block">
                              जम्मा तौलबाट सिधै यो कट्टा घटाई खुद तौल निस्कन्छ
                            </span>
                          </div>

                          {/* Custom Percentage field if manual purity is also selected */}
                          {item.purity === 'custom_percentage' ? (
                            <div className="bg-amber-100/60 p-2.5 rounded-lg border border-amber-300">
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[11px] font-bold text-amber-950">
                                  म्यानुअल शुद्धता %
                                </label>
                                <span className="text-[10px] font-mono font-bold text-amber-900">
                                  {item.testedPurityPercentage}%
                                </span>
                              </div>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                step="0.1"
                                value={item.testedPurityPercentage || ''}
                                onChange={(e) =>
                                  handleCustomPercentageChange(
                                    item.id,
                                    parseFloat(e.target.value) || 0,
                                    item.metalType
                                  )
                                }
                                className="w-full px-2.5 py-1.5 bg-white border border-amber-400 rounded-md tabular-nums font-bold text-neutral-900 text-sm"
                              />
                              <span className="text-[10px] text-amber-800 mt-1 block">
                                दर: रु. {formatNPR(item.ratePerTola)}/तोला
                              </span>
                            </div>
                          ) : (
                            <div className="bg-white p-2.5 rounded-lg border border-neutral-200 flex flex-col justify-center">
                              <span className="text-[10px] text-neutral-500 block">गुणस्तर/क्यारेट:</span>
                              <span className="text-xs font-bold text-neutral-800 mt-0.5">{item.purityLabel}</span>
                              <span className="text-[10px] text-neutral-500 mt-0.5">दर: रु. {formatNPR(item.ratePerTola)}/तोला</span>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Mode B: Detailed Itemized Deductions (Stone + Wax + Jarti) */
                        <>
                          {/* Stone Deduction */}
                          <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                              पत्थर कट्टा (Stone g)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.stoneDeductionGrams}
                              onChange={(e) =>
                                updateItem(item.id, { stoneDeductionGrams: parseFloat(e.target.value) || 0 })
                              }
                              className="w-full px-2.5 py-1.5 bg-neutral-50/50 border border-neutral-300 rounded-md tabular-nums text-sm focus:bg-white"
                            />
                            <span className="text-[10px] text-neutral-500 mt-1 block">नग/पत्थर</span>
                          </div>

                          {/* Wax/Dirt Deduction */}
                          <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                              लाहा/धागो (Wax/Dirt g)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.waxDirtWeightGrams}
                              onChange={(e) =>
                                updateItem(item.id, { waxDirtWeightGrams: parseFloat(e.target.value) || 0 })
                              }
                              className="w-full px-2.5 py-1.5 bg-neutral-50/50 border border-neutral-300 rounded-md tabular-nums text-sm focus:bg-white"
                            />
                            <span className="text-[10px] text-neutral-500 mt-1 block">मैलो/धागो</span>
                          </div>

                          {/* Jarti % */}
                          <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-semibold text-neutral-700">
                                जर्ती % (Wastage %)
                              </label>
                              <span className="text-[10px] font-mono text-neutral-500">
                                -{item.jartiWeightGrams}g
                              </span>
                            </div>
                            <input
                              type="number"
                              step="0.5"
                              value={item.jartiPercentage}
                              onChange={(e) =>
                                updateItem(item.id, { jartiPercentage: parseFloat(e.target.value) || 0 })
                              }
                              className="w-full px-2.5 py-1.5 bg-neutral-50/50 border border-neutral-300 rounded-md tabular-nums text-sm focus:bg-white"
                            />
                            {item.purity === 'custom_percentage' ? (
                              <div className="mt-1 flex items-center justify-between text-[10px] text-amber-800 font-bold">
                                <span>शुद्धता %:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  step="0.1"
                                  value={item.testedPurityPercentage || ''}
                                  onChange={(e) =>
                                    handleCustomPercentageChange(
                                      item.id,
                                      parseFloat(e.target.value) || 0,
                                      item.metalType
                                    )
                                  }
                                  className="w-16 px-1 py-0.5 border border-amber-300 rounded text-right bg-amber-50"
                                />
                              </div>
                            ) : (
                              <span className="text-[10px] text-neutral-500 mt-1 block">
                                कट्टा: {item.jartiWeightGrams} g
                              </span>
                            )}
                          </div>
                        </>
                      )}

                      {/* Net Pure Weight (Calculated) */}
                      <div className="bg-emerald-50/90 p-2.5 rounded-lg border border-emerald-300 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold text-emerald-950">
                              खुद तौल (Net Pure Weight)
                            </label>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                              चोखो
                            </span>
                          </div>
                          <div className="text-base font-extrabold text-emerald-950 tabular-nums mt-1">
                            {item.netWeightGrams.toFixed(2)} ग्राम
                          </div>
                          <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                            {item.netWeightTola} तोला {item.netWeightLal} लाल
                          </div>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-emerald-200/80 text-[10px] text-emerald-900 font-medium">
                          मूल्यांकन: रु. {formatNPR(item.totalItemValue)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Testing & Rate Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                        जाँच विधि (Testing Method)
                      </label>
                      <select
                        value={item.testingMethod}
                        onChange={(e) =>
                          updateItem(item.id, {
                            testingMethod: e.target.value as TestingMethod,
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white"
                      >
                        <option value="touchstone_acid">कसी तथा नाइट्रिक एसिड जाँच (Touchstone)</option>
                        <option value="electronic_densimeter">इलेक्ट्रोनिक डेन्सिमिटर (Densimeter)</option>
                        <option value="xrf_spectrometer">XRF स्पेक्ट्रोमिटर यन्त्र (X-Ray)</option>
                        <option value="hallmark_stamp">सरकारी/ब्युरो मानक हलमार्क छाप</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                        सहमति भएको दर (Rate / Tola) *
                      </label>
                      <input
                        type="number"
                        value={item.ratePerTola}
                        onChange={(e) =>
                          updateItem(item.id, { ratePerTola: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md tabular-nums font-semibold"
                      />
                      <span className="text-[10px] text-neutral-500 mt-0.5 block">
                        प्रति ग्राम: {formatNPR(item.ratePerGram)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                        विशेष कैफियत (Testing Notes)
                      </label>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                        placeholder="उदा: कसीमा खार्दा पूर्ण चोखो प्रमाणित"
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Multi-Item Quick Addition Toolbar */}
            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold text-neutral-900">
                    ग्राहकले ल्याएका बहु-गहनाहरू (Multiple Items - {items.length} वटा गहना दर्ता)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addItem()}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ नयाँ गहना थप्नुहोस् (Add New Item)</span>
                  </button>
                </div>
              </div>

              {/* Fast Nepali Jewelry Preset Buttons */}
              <div className="pt-2 border-t border-amber-200/60">
                <span className="text-[11px] font-semibold text-neutral-600 block mb-1.5">
                  छिटो थप्ने गहनाहरू (Quick Click Presets):
                </span>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => addItem('सुनको सिक्री (Gold Chain)', '24K_chhapawal', 11.66)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100/70 border border-amber-300 text-neutral-800 rounded-md transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <span>+ सुनको सिक्री (1 तोला)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addItem('सुनको औंठी (Gold Ring)', '24K_chhapawal', 4.5)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100/70 border border-amber-300 text-neutral-800 rounded-md transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <span>+ सुनको औंठी (Ring)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addItem('सुनको तिलहरी (Tilhari)', '24K_chhapawal', 11.66)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100/70 border border-amber-300 text-neutral-800 rounded-md transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <span>+ तिलहरी (Tilhari)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addItem('सुनको बाला/चुरा (Bangles)', '24K_chhapawal', 23.32)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100/70 border border-amber-300 text-neutral-800 rounded-md transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <span>+ सुनको बाला २ तोला (Bangles)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addItem('झुम्का / टप (Earrings)', '22K_tezabi', 5.83)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100/70 border border-amber-300 text-neutral-800 rounded-md transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <span>+ झुम्का/टप २२ क्यारेट (Earrings)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addItem('चाँदीको पाउजु (Silver Payal)', 'fine_silver_999', 58.3)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-neutral-800 rounded-md transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <span>+ चाँदीको पाउजु (Payal)</span>
                  </button>
                </div>
              </div>

              {/* Multi-Item Running Totals Box */}
              <div className="p-3 bg-white border border-amber-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">जम्मा गहना संख्या:</span>
                    <strong className="text-neutral-900 font-bold">{items.length} वटा (Items)</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">कुल खुद तौल (Total Net):</span>
                    <strong className="text-emerald-900 font-bold tabular-nums">
                      {totalNetGrams.toFixed(2)} g ({totalNetTola} तोला)
                    </strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-neutral-500 block text-[10px]">सबै गहनाको कुल मूल्य (Grand Total):</span>
                  <span className="text-base font-extrabold text-amber-900 tabular-nums">
                    {formatNPR(grandTotalAmount, true)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>अघिल्लो (Back)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-6 py-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span>अर्को: कानुनी स्वघोषणा (Next: Legal Affidavit)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SOURCE & STATUTORY DECLARATION */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>मुलुकी अपराध संहिता २०७४ बमोजिम कानुनी दायित्व तथा जिम्मेवारी</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                यो खण्ड नेपालको कानुन अनुसार सुनचाँदी व्यवसायीलाई कुनै पनि फौजदारी मुद्दा वा प्रहरी अनुसन्धानबाट १००% कानुनी संरक्षण प्रदान गर्न तयार पारिएको हो। बिक्रेताले यी सबै बुँदाहरू स्वीकार गरी सहिछाप गर्नुपर्दछ।
              </p>
            </div>

            {/* Source of Acquisition */}
            <div className="p-4 border border-neutral-200 rounded-xl bg-white space-y-3 text-xs">
              <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wide">
                १. गहना तथा धातु प्राप्तिको वैधानिक स्रोत (Lawful Source of Acquisition) *
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'marriage_stridhan_dowry', label: 'विवाहको स्त्रीधन / दाइजो / पेवा', desc: 'माइती पक्ष वा विवाह उपहार' },
                  { id: 'ancestral_property', label: 'पैतृक / बाबुबाजेको सम्पत्ति', desc: 'अंशबण्डा वा पारिवारिक धरोहर' },
                  { id: 'purchased_with_receipt', label: 'पहिले आफैंले खरिद गरेको', desc: 'सक्कली खरिद बिल उपलब्ध भएको' },
                  { id: 'foreign_remittance', label: 'वैदेशिक रोजगारीबाट ल्याएको', desc: 'भन्सार छुट वा विदेशबाट आयातित' },
                  { id: 'personal_savings', label: 'व्यक्तिगत नियमित बचतबाट', desc: 'पारिश्रमिक वा व्यापारको बचत' },
                  { id: 'gift_inheritance', label: 'उपहार / दान प्राप्त', desc: 'नातेदारबाट प्राप्त उपहार' },
                ].map((s) => (
                  <label
                    key={s.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all flex flex-col justify-between ${
                      declaration.source === s.id
                        ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="acquisitionSource"
                        checked={declaration.source === s.id}
                        onChange={() => setDeclaration({ ...declaration, source: s.id as AcquisitionSource })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-semibold text-neutral-900">{s.label}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1 pl-5">{s.desc}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  प्राप्तिको थप स्पष्टीकरण / विवरण (Source Details):
                </label>
                <input
                  type="text"
                  value={declaration.sourceDescription}
                  onChange={(e) => setDeclaration({ ...declaration, sourceDescription: e.target.value })}
                  placeholder="उदा: वि.सं. २०७६ को विवाहमा प्राप्त स्त्रीधन तिलहरी"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="hasReceipt"
                  checked={declaration.hasOriginalReceipt}
                  onChange={(e) => setDeclaration({ ...declaration, hasOriginalReceipt: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="hasReceipt" className="text-xs text-neutral-800 font-medium cursor-pointer">
                  यस गहनाको पुरानो खरिद रसिद/बिल मसँग छ र संलग्न गरिएको छ
                </label>
              </div>
            </div>

            {/* Mandatory Statutory Warranties Checklist */}
            <div className="p-4 border border-neutral-300 rounded-xl bg-neutral-50/50 space-y-3 text-xs">
              <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wide flex items-center justify-between">
                <span>२. बिक्रेताको कानुनी कबुलियतनामा तथा सपथ (Sworn Affidavit Checklist)</span>
                <span className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> सबै बुँदा अनिवार्य
                </span>
              </h4>

              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declaration.isAbsoluteOwner}
                    onChange={(e) => setDeclaration({ ...declaration, isAbsoluteOwner: e.target.checked })}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-neutral-800 leading-tight">
                    <strong>पूर्ण स्वामित्वको घोषणा:</strong> म बिक्री गरिएका गहना तथा धातुको एकछत्र वैध हकदार तथा पूर्ण मालिक हुँ।
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declaration.isNotStolenOrLooted}
                    onChange={(e) => setDeclaration({ ...declaration, isNotStolenOrLooted: e.target.checked })}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-neutral-800 leading-tight">
                    <strong>चोरी वा अपराधमुक्त भएको ग्यारेन्टी:</strong> यो मालवस्तु कुनै चोरी, लुटपाट, डकैती, तस्करी, वा कुनै गैरकानुनी कसूरबाट प्राप्त भएको होइन।
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declaration.isNotMortgagedOrDisputed}
                    onChange={(e) => setDeclaration({ ...declaration, isNotMortgagedOrDisputed: e.target.checked })}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-neutral-800 leading-tight">
                    <strong>धितो वा बन्धकमुक्त:</strong> यो धातु कसैलाई धितो, बन्धक, रोक्का वा अदालतको विवादमा परेको छैन।
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declaration.acceptsCriminalLiabilityUnderSection244}
                    onChange={(e) =>
                      setDeclaration({
                        ...declaration,
                        acceptsCriminalLiabilityUnderSection244: e.target.checked,
                      })
                    }
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-neutral-800 leading-tight">
                    <strong>मुलुकी अपराध संहिता दफा २४४ दायित्व:</strong> यदि पछि यो धातु चोरी वा गैरकानुनी ठहरिएमा यसको सम्पूर्ण देवानी तथा फौजदारी सजाय म स्वयं बिक्रेताले बेहोर्नेछु।
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declaration.indemnifiesJewelerFromAllClaims}
                    onChange={(e) =>
                      setDeclaration({
                        ...declaration,
                        indemnifiesJewelerFromAllClaims: e.target.checked,
                      })
                    }
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-neutral-800 leading-tight">
                    <strong>पसललाई क्षतिपूर्ति कबुलियतनामा:</strong> यस कारोबारबाट पसल वा व्यवसायीलाई कुनै हानि, नोक्सानी वा कानुनी झमेला परेमा सोको शतप्रतिशत क्षतिपूर्ति म आफैंले तिर्नेछु।
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>अघिल्लो (Back)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="px-6 py-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span>अर्को: भुक्तानी तथा अनुपालन (Next: Payment & AML)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PAYMENT & AML COMPLIANCE */}
        {activeStep === 4 && (
          <div className="space-y-6">
            {/* AML Cash Warning Banner if applicable */}
            {payment.method === 'cash' && grandTotalAmount > 50000 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-900 space-y-1">
                  <strong>सम्पत्ति शुद्धीकरण (AML) कानुनी सतर्कता:</strong>
                  <p>
                    नेपाल राष्ट्र बैंकको निर्देशन अनुसार, रु. ५०,००० भन्दा बढीको कारोबार सम्भव भएसम्म बैंकिङ माध्यम (चेक, कनेक्ट आइपिएस वा बैंक ट्रान्सफर) बाट गर्नुपर्दछ। नगद भुक्तानी गर्दा बिक्रेताको स्थायी लेखा नम्बर (PAN) र औचित्य खुलाउनु कानुनी सुरक्षाका लागि अनिवार्य छ।
                  </p>
                </div>
              </div>
            )}

            {/* Total Summary Header */}
            <div className="p-4 bg-neutral-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-neutral-400 block">अन्तिम भुक्तानी गर्नुपर्ने कुल रकम:</span>
                <span className="text-2xl font-extrabold tracking-tight tabular-nums text-amber-400">
                  {formatNPR(grandTotalAmount, true)}
                </span>
                <span className="text-xs text-neutral-300 block font-serif mt-1">
                  {payment.amountInWordsNepali}
                </span>
              </div>

              <div className="text-right text-xs text-neutral-300">
                <div>जम्मा खुद तौल: <strong>{totalNetGrams.toFixed(2)} ग्राम</strong></div>
                <div>तोलामा: <strong>{totalNetTola} तोला</strong></div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wide">
                भुक्तानी माध्यम छनोट गर्नुहोस् (Select Payment Method) *
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { id: 'bank_transfer', label: 'बैंक ट्रान्सफर / RTGS', note: 'सबैभन्दा सुरक्षित' },
                  { id: 'account_cheque', label: 'एकाउन्ट पेयी चेक', note: 'पारदर्शी प्रमाण' },
                  { id: 'fonepay_ips', label: 'फोनपे / कनेक्ट IPS', note: 'डिजिटल कारोबार' },
                  { id: 'cash', label: 'नगद (Cash Payment)', note: 'रु. ५०,००० सम्म सिफारिस' },
                ].map((m) => (
                  <label
                    key={m.id}
                    className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                      payment.method === m.id
                        ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={payment.method === m.id}
                        onChange={() =>
                          setPayment({
                            ...payment,
                            method: m.id as PaymentMethod,
                            isCashOverLimit: m.id === 'cash' && grandTotalAmount > 50000,
                          })
                        }
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-semibold text-neutral-900">{m.label}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1 pl-5">{m.note}</span>
                  </label>
                ))}
              </div>

              {/* Dynamic Trace Inputs */}
              <div className="p-4 border border-neutral-200 rounded-xl bg-neutral-50/50 space-y-3 text-xs">
                <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wide">
                  भुक्तानी ट्र्याकिङ तथा प्रमाण विवरण (Payment Audit Trail)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {payment.method !== 'cash' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          बैंकको नाम (Bank Name) *
                        </label>
                        <input
                          type="text"
                          value={payment.bankName}
                          onChange={(e) => setPayment({ ...payment, bankName: e.target.value })}
                          placeholder="e.g. Nabil Bank Ltd."
                          className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          खाता नं. वा चेक नं. (Account / Cheque No.) *
                        </label>
                        <input
                          type="text"
                          value={payment.accountNumber || payment.chequeNumber || ''}
                          onChange={(e) =>
                            setPayment({
                              ...payment,
                              accountNumber: e.target.value,
                              chequeNumber: e.target.value,
                            })
                          }
                          placeholder="01902017500392"
                          className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md tabular-nums focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          ट्रान्जेक्सन रेफरेन्स (Txn Ref / UTR No.)
                        </label>
                        <input
                          type="text"
                          value={payment.transactionReference}
                          onChange={(e) =>
                            setPayment({ ...payment, transactionReference: e.target.value })
                          }
                          placeholder="NBL-RTGS-9823419"
                          className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md tabular-nums focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Seller PAN */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      बिक्रेताको स्थायी लेखा नम्बर (Seller PAN No.)
                    </label>
                    <input
                      type="text"
                      value={payment.sellerPAN}
                      onChange={(e) => setPayment({ ...payment, sellerPAN: e.target.value })}
                      placeholder="उदा: 109842103"
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md tabular-nums focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-[10px] text-neutral-500 mt-0.5 block">
                      ठूलो रकमको कारोबारमा अनिवार्य
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>अघिल्लो (Back)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(5)}
                className="px-6 py-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span>अर्को: साक्षी तथा ल्याप्चे (Next: Biometrics & Sign)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: WITNESS & BIOMETRICS (SIGNATURE + THUMBPRINTS) */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <strong>अकाट्य प्रमाण (Irrefutable Evidence):</strong> नेपालको अदालत र प्रहरी प्रशासनमा हस्ताक्षर मात्र भएको कागज भन्दा दुवै हातको बुढी औंठाको छाप (ल्याप्चे) र रोहवर साक्षी भएको भरपाईलाई पूर्ण वैधानिक मान्यता दिइन्छ।
              </div>
            </div>

            {/* Witness Info */}
            <div className="p-4 border border-neutral-200 rounded-xl bg-neutral-50/50 space-y-3 text-xs">
              <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wide">
                १. रोहवर साक्षीको विवरण (Witness Particulars)
              </h4>
              <p className="text-[11px] text-neutral-500">
                बिक्रेतासँगै आएका नातेदार वा चिनेजानेको साक्षीको विवरण (वैकल्पिक तर कानुनी सुरक्षाका लागि उच्च सिफारिस):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    साक्षीको नाम (Witness Name)
                  </label>
                  <input
                    type="text"
                    value={witness.witness1Name}
                    onChange={(e) => setWitness({ ...witness, witness1Name: e.target.value })}
                    placeholder="उदा: प्रकाश थापा मगर"
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    ठेगाना (Address)
                  </label>
                  <input
                    type="text"
                    value={witness.witness1Address}
                    onChange={(e) => setWitness({ ...witness, witness1Address: e.target.value })}
                    placeholder="चन्द्रागिरि, काठमाडौं"
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    मोवाइल नम्बर (Phone)
                  </label>
                  <input
                    type="tel"
                    value={witness.witness1Phone}
                    onChange={(e) => setWitness({ ...witness, witness1Phone: e.target.value })}
                    placeholder="98XXXXXXXX"
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md tabular-nums focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    नागरिकता नं. (Citizenship No.)
                  </label>
                  <input
                    type="text"
                    value={witness.witness1IdNumber}
                    onChange={(e) => setWitness({ ...witness, witness1IdNumber: e.target.value })}
                    placeholder="२७-०१-७२-०१८३१"
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md tabular-nums focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Biometrics Capture Section */}
            <div className="space-y-4">
              <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wide">
                २. बिक्रेताको डिजिटल दस्तखत तथा दुवै हातका औंठाछाप (Digital Signature & Thumbprints) *
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left Thumb */}
                <ThumbprintPad
                  label="बायाँ औंठाछाप (Left Thumb)"
                  finger="left"
                  initialValue={seller.leftThumbprintUrl}
                  onChange={(dataUrl) => setSeller((prev) => ({ ...prev, leftThumbprintUrl: dataUrl }))}
                />

                {/* Right Thumb */}
                <ThumbprintPad
                  label="दायाँ औंठाछाप (Right Thumb)"
                  finger="right"
                  initialValue={seller.rightThumbprintUrl}
                  onChange={(dataUrl) => setSeller((prev) => ({ ...prev, rightThumbprintUrl: dataUrl }))}
                />

                {/* Digital Signature */}
                <div className="p-3 border border-neutral-200 rounded-lg bg-neutral-50/70">
                  <SignaturePad
                    label="बिक्रेताको डिजिटल दस्तखत (Seller Signature)"
                    initialValue={seller.signatureUrl}
                    onChange={(dataUrl) => setSeller((prev) => ({ ...prev, signatureUrl: dataUrl }))}
                    height={140}
                  />
                  <p className="text-[10px] text-neutral-400 mt-2 text-center">
                    औंला वा माउसले स्क्रिनमा हस्ताक्षर गर्नुहोस्
                  </p>
                </div>
              </div>
            </div>

            {/* Final Legal Verification Banner */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <div className="text-xs text-emerald-950">
                  <strong>सबै कानुनी चरणहरू पूरा भए!</strong>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    "प्रमाणित खरिद भरपाई तयार गर्नुहोस्" मा थिच्दा प्रणालीले कानुनी सम्झौता पत्र लक गरी दर्ता पुस्तिकामा अभिलेख राख्नेछ।
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>अघिल्लो (Back)</span>
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-8 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>प्रमाणित खरिद भरपाई तयार गर्नुहोस् (Generate Legal Deed)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Document Rectangle Frame & Auto-Crop Modal */}
      {cropModalState?.isOpen && (
        <DocumentCropModal
          isOpen={cropModalState.isOpen}
          sideLabel={
            cropModalState.field === 'idCardFrontUrl'
              ? 'अगाडिको भाग (Front Side)'
              : 'पछाडिको भाग (Back Side)'
          }
          initialMode={cropModalState.mode}
          initialImageSrc={cropModalState.imageSrc}
          onCancel={() => setCropModalState(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
};
