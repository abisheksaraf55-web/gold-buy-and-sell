/**
 * Type definitions for Nepal Gold and Silver Legal Purchase & Compliance System
 * Fully compliant with Nepal Muluki Criminal Code 2074 (Section 244),
 * Asset (Money) Laundering Prevention Act 2064, and FENEGOSIDA standards.
 */

export type MetalType = 'gold' | 'silver';

export type GoldPurity = '24K_chhapawal' | '22K_tezabi' | '18K_hallmark' | '14K_jewelry' | 'custom_percentage';
export type SilverPurity = 'fine_silver_999' | 'sterling_silver_925' | 'silver_traditional' | 'custom_percentage';

export type TestingMethod = 
  | 'touchstone_acid'       // कसी तथा नाइट्रिक एसिड जाँच
  | 'electronic_densimeter'  // डेन्सिमिटर / घनत्व यन्त्र
  | 'xrf_spectrometer'      // एक्स-रे स्पेक्ट्रोमिटर (XRF)
  | 'hallmark_stamp'        // सरकारी/मानक हलमार्क छाप
  | 'fire_assay_smelting';  // गालेर जाँच

export type AcquisitionSource = 
  | 'ancestral_property'       // पैतृक/बाबुबाजेको सम्पत्ति
  | 'marriage_stridhan_dowry'  // विवाहको स्त्रीधन / दाइजो / पेवा
  | 'purchased_with_receipt'   // पहिले खरिद गरेको (रसिद संलग्न)
  | 'foreign_remittance'       // वैदेशिक रोजगारीबाट ल्याएको
  | 'personal_savings'         // आफ्नै व्यक्तिगत बचतबाट खरिद
  | 'gift_inheritance';        // उपहार वा दान स्वरूप प्राप्त

export type PaymentMethod = 
  | 'bank_transfer'     // बैंक ट्रान्सफर / RTGS
  | 'account_cheque'    // एकाउन्ट पेयी चेक
  | 'fonepay_ips'       // फोनपे / कनेक्ट आइपिएस
  | 'cash';             // नगद (कानुनी सिमा रु. ५०,००० भित्र)

export interface SellerKYC {
  fullNameNepali: string;
  fullNameEnglish: string;
  grandfatherName?: string;       // बाजेको नाम (३ पुस्ते विवरणका लागि)
  fatherName?: string;            // बाबुको नाम
  fatherOrHusbandName: string;    // बाबु वा पतिको नाम (पुराना फारामसँग अनुकूलताका लागि)
  motherName?: string;
  spouseName?: string;            // पति वा पत्नीको नाम
  idType: 'citizenship' | 'national_id' | 'passport' | 'voter_id';
  idNumber: string;               // नागरिकता वा परिचयपत्र नं.
  issuedDistrict: string;         // जारी जिल्ला
  issuedDateBS: string;           // जारी मिति (वि.सं.)
  
  // Permanent Address (स्थायी ठेगाना)
  province: string;
  district: string;
  municipality: string;           // गाउँपालिका वा नगरपालिका
  wardNo: string;
  tole: string;
  
  // Current Address (हालको ठेगाना)
  currentAddress: string;
  
  mobileNumber: string;
  isMobileVerified: boolean;
  
  // KYC Biometrics & Documents
  sellerPhotoUrl?: string;        // लाइभ फोटो
  idCardFrontUrl?: string;        // परिचयपत्र अगाडि
  idCardBackUrl?: string;         // परिचयपत्र पछाडि
  signatureUrl?: string;          // डिजिटल हस्ताक्षर
  leftThumbprintUrl?: string;     // बायाँ औंठाछाप (ल्याप्चे)
  rightThumbprintUrl?: string;    // दायाँ औंठाछाप (ल्याप्चे)
}

export interface MetalItem {
  id: string;
  metalType: MetalType;
  purity: GoldPurity | SilverPurity;
  purityLabel: string;
  itemName: string;               // e.g. सिक्री, औंठी, तिलहरी, बाला, गहनाको टुक्रा
  quantity: number;
  
  // Weights (जम्मा तौल)
  grossWeightGrams: number;
  grossWeightTola: number;
  grossWeightLal: number;
  
  // Deductions (कट्टा विवरण)
  stoneWeightGrams: number;       // पत्थर/नग कट्टा
  stoneDeductionGrams: number;    // पत्थर कट्टा (alias)
  waxDirtWeightGrams: number;     // लाहा, धागो, मैलो कट्टा
  jartiPercentage: number;        // जर्ती कट्टा प्रतिशत (%)
  jartiWeightGrams: number;       // जर्ती कट्टा ग्राम
  manualDeductionGrams?: number;  // सिधै म्यानुअल कट्टा तौल (ग्राम)
  deductionMode?: 'itemized' | 'direct_grams'; // कट्टा विधि (विस्तृत वा एकमुष्ठ म्यानुअल ग्राम)
  
  // Net Pure Weight (खुद तौल)
  netWeightGrams: number;
  netWeightTola: number;
  netWeightLal: number;
  
  // Testing
  testingMethod: TestingMethod;
  testedPurityPercentage: number; // e.g. 99.5%, 91.6%
  
  // Valuation
  ratePerTola: number;
  ratePerGram: number;
  totalItemValue: number;
  
  itemCondition: 'intact_wearable' | 'broken_scrap' | 'melted_bullion' | 'traditional_antique';
  notes?: string;
}

export interface LegalDeclaration {
  source: AcquisitionSource;
  sourceDescription: string;
  hasOriginalReceipt: boolean;
  originalReceiptUrl?: string;
  
  // Mandatory Statutory Declarations under Nepal Law
  isAbsoluteOwner: boolean;                      // आफू पूर्ण हकदार भएको
  isNotStolenOrLooted: boolean;                  // कुनै चोरी, डकैती वा अपराधसँग असम्बन्धित
  isNotMortgagedOrDisputed: boolean;             // कुनै बैंक/व्यक्तिमा धितो वा विवाद नभएको
  acceptsCriminalLiabilityUnderSection244: boolean; // मुलुकी अपराध संहिता २०७४ दफा २४४ अनुसार पूर्ण जिम्मेवारी
  acceptsAmlCompliance2064: boolean;             // सम्पत्ति शुद्धीकरण निवारण ऐन २०६४ को अनुपालन
  indemnifiesJewelerFromAllClaims: boolean;      // पसललाई सम्पूर्ण कानुनी झमेलाबाट मुक्त राख्ने कबुलियतनामा
  
  declarationTextNepali: string;
  declarationTextEnglish: string;
  declaredAt: string;
}

export interface PaymentRecord {
  method: PaymentMethod;
  amount: number;
  amountInWordsNepali: string;
  amountInWordsEnglish: string;
  
  // Bank/Digital payment trace details
  bankName?: string;
  accountNumber?: string;
  chequeNumber?: string;
  transactionReference?: string;
  sellerPAN?: string;
  
  // AML compliance verification
  isCashOverLimit: boolean;      // Warning flag if cash > NPR 50,000
  amlJustificationNote?: string;
}

export interface WitnessDetails {
  witness1Name: string;
  witness1Address: string;
  witness1Phone: string;
  witness1IdNumber: string;
  witness1SignatureUrl?: string;
  
  witness2Name?: string;
  witness2Address?: string;
  witness2Phone?: string;
  witness2IdNumber?: string;
  witness2SignatureUrl?: string;
}

export interface ShopDetails {
  nameNepali: string;
  nameEnglish: string;
  proprietorName: string;
  panVatNumber: string;
  businessRegNumber: string;
  fenegosidaMembershipNo: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  stampSealUrl?: string;      // पसलको आधिकारिक रबर छाप (Official Stamp/Seal Image)
  signatureUrl?: string;      // प्रोपाइटरको डिजिटल दस्तखत (Proprietor Signature)
  isSetupCompleted?: boolean; // Flag to indicate user has completed customized setup
}

export interface PurchaseTransaction {
  id: string;
  serialNo: number;              // दर्ता क्रम संख्या (Sequential Contract Serial: 1, 2, 3...)
  contractSerialNumber: string;  // कानुनी सम्झौता सिरीयल नं. (e.g. DEED-2083-0001 or SN-0001)
  voucherNumber: string;         // e.g. NP-GOLD-2083-0042
  fiscalYear: string;            // e.g. २०८१/०८२
  dateBS: string;                // e.g. २०८१/१२/११
  dateAD: string;                // e.g. 2026-03-25
  time: string;
  
  seller: SellerKYC;
  items: MetalItem[];
  declaration: LegalDeclaration;
  payment: PaymentRecord;
  witness: WitnessDetails;
  shop: ShopDetails;
  
  // Totals
  totalGrossGrams: number;
  totalNetGrams: number;
  totalNetTola: number;
  grandTotalAmount: number;
  
  // Security & Audit
  tamperVerificationHash: string;
  complianceRating: 'COMPLIANT_SECURE' | 'REQUIRES_REVIEW';
  status: 'completed' | 'draft';
  createdAt: string;
}

export interface BullionMarketRates {
  chhapawalGoldPerTola: number;
  tezabiGoldPerTola: number;
  gold18kPerTola: number;
  fineSilverPerTola: number;
  lastUpdated: string;
}
