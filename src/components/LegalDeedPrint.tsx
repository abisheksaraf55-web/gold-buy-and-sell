import React, { useState } from 'react';
import { PurchaseTransaction } from '../types/bullion';
import { 
  formatNPR, 
  toNepaliDigits 
} from '../utils/nepalBullionCalculations';
import { generateNepaliDeedPDF, generateNativeDeedPDF, triggerDirectPrint } from '../utils/printHelper';
import { Printer, ArrowLeft, ShieldCheck, CheckCircle, FileCheck, Download, Loader2, AlertCircle, X } from 'lucide-react';
import sealImage from '../assets/images/nepal_bullion_seal_1790317148844.jpg';

interface LegalDeedPrintProps {
  transaction: PurchaseTransaction;
  onBack: () => void;
}

export const LegalDeedPrint: React.FC<LegalDeedPrintProps> = ({
  transaction,
  onBack,
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPureNepaliMode, setIsPureNepaliMode] = useState(true);
  const [printBlockedNotice, setPrintBlockedNotice] = useState(false);

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      await generateNepaliDeedPDF('printable-deed', transaction, `Deed-${transaction.voucherNumber}`);
    } catch (err) {
      console.error('PDF export error:', err);
      generateNativeDeedPDF(transaction, `Deed-${transaction.voucherNumber}`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    triggerDirectPrint('printable-deed', () => {
      setPrintBlockedNotice(true);
      handleDownloadPDF();
    });
    setTimeout(() => setIsPrinting(false), 800);
  };

  const { seller, items, declaration, payment, witness, shop } = transaction;
  const hasIdPhotosPage = Boolean(
    seller.idCardFrontUrl || seller.idCardBackUrl || seller.sellerPhotoUrl
  );
  const totalPages = hasIdPhotosPage ? 2 : 1;

  return (
    <div className="space-y-4 print:space-y-0">
      {/* Screen Toolbar (hidden when printing) */}
      <div className="print:hidden bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>फिर्ता जानुहोस् (Back)</span>
          </button>
          <div>
            <div className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>प्रमाणित खरिद भरपाई (Certified Purchase Deed)</span>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {transaction.contractSerialNumber || `SN-${transaction.voucherNumber}`}
              </span>
              <span className="text-xs font-mono text-neutral-500">#{transaction.voucherNumber}</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              मुलुकी अपराध संहिता २०७४ र सम्पत्ति शुद्धीकरण ऐन २०६४ बमोजिम कानुनी रूपमा सुरक्षित
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Format Mode Toggle: Pure Nepali vs Bilingual */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs">
            <button
              type="button"
              onClick={() => setIsPureNepaliMode(true)}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                isPureNepaliMode 
                  ? 'bg-neutral-900 text-white shadow-xs' 
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="प्रहरी, अदालत तथा महासंघमा पेस गर्न १००% शुद्ध कानुनी नेपाली ढाँचा"
            >
              पूर्ण नेपाली (प्रहरी/अदालत मान्य)
            </button>
            <button
              type="button"
              onClick={() => setIsPureNepaliMode(false)}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                !isPureNepaliMode 
                  ? 'bg-neutral-900 text-white shadow-xs' 
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="नेपाली र अंग्रेजी दुवै भएको द्विभाषी ढाँचा"
            >
              नेपाली + English
            </button>
          </div>

          {/* Direct PDF Download Button */}
          <button
            type="button"
            disabled={isExportingPDF}
            onClick={handleDownloadPDF}
            className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            title="सक्कल A4 भरपाई PDF फाइल सिधै डाउनलोड गर्नुहोस्"
          >
            {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExportingPDF ? 'PDF बन्दैछ...' : 'PDF डाउनलोड (Download A4)'}</span>
          </button>

          {/* Direct Print Button */}
          <button
            type="button"
            disabled={isPrinting}
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="सिधै प्रिन्ट गर्नुहोस् (Print Deed)"
          >
            {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            <span>{isPrinting ? 'प्रिन्ट तयार हुँदैछ...' : 'प्रिन्ट गर्नुहोस् (Print)'}</span>
          </button>
        </div>
      </div>

      {/* Notice Banner if browser iframe blocked direct modal print */}
      {printBlockedNotice && (
        <div className="print:hidden bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">
                ब्राउजर सुरक्षा सूचना (Print Notice):
              </span>
              <p className="text-amber-800 leading-relaxed">
                तपाईंको ब्राउजर वा प्रिभ्यू आईफ्रेमले सिधै प्रिन्ट डायलग खोल्न निषेध गरेको छ। 
                हामीले तपाईंको लागि सक्कल A4 कानुनी भरपाई <strong>PDF फाइल डाउनलोड</strong> गरिदिएका छौं! 
                कृपया डाउनलोड भएको PDF खोलेर सिधै प्रिन्ट (Ctrl+P / Cmd+P) गर्नुहोस्।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPrintBlockedNotice(false)}
            className="text-amber-700 hover:text-amber-950 p-1 rounded-md cursor-pointer"
            title="बन्द गर्नुहोस्"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Official Standard A4 Multi-Page Deed Container */}
      <div id="printable-deed" className="space-y-6 print:space-y-0">
        {/* ==================== PAGE 1: MAIN CONTRACT ==================== */}
        <div className="deed-a4-page bg-white border-2 border-black rounded-lg print:rounded-none p-5 sm:p-7 print:p-1.5 shadow-lg max-w-[210mm] mx-auto text-black font-sans relative overflow-hidden print:overflow-visible">
          {/* Subtle Watermark Seal */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.025] flex items-center justify-center">
            <img 
              src={sealImage} 
              alt="Watermark Seal" 
              className="w-[460px] h-[460px] object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Outer Legal Border Decoration */}
          <div className="border border-black p-4 sm:p-5 print:p-2 relative z-10 space-y-4 print:space-y-1">
            {/* Header Zone: Shop Info */}
            <div className="text-center border-b-2 border-black pb-3 print:pb-1 space-y-1.5 print:space-y-0.5">
              {/* Top Meta Line */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 print:pb-0.5 border-b border-neutral-800 text-xs sm:text-sm print:text-[10px] font-bold text-black">
                <span className="font-mono bg-amber-50 px-2 py-0.5 print:py-0 rounded border border-black">
                  सम्झौता सिरीयल नं.: {transaction.contractSerialNumber || `SN-${transaction.voucherNumber}`}
                </span>
                <div className="flex items-center gap-3 font-mono">
                  <span>आ.व.: {toNepaliDigits(transaction.fiscalYear)}</span>
                  <span>•</span>
                  <span>दर्ता नं: {toNepaliDigits(shop.businessRegNumber)}</span>
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl print:text-lg print:leading-tight font-extrabold tracking-tight text-black font-serif">
                  {shop.nameNepali}
                </h1>
                {!isPureNepaliMode && shop.nameEnglish && (
                  <p className="text-sm print:text-[10.5px] font-bold tracking-wide text-black font-serif mt-0.5 print:mt-0">
                    {shop.nameEnglish}
                  </p>
                )}
              </div>

              <div className="text-sm print:text-[10px] print:leading-tight font-semibold text-black space-y-0.5 print:space-y-0">
                <p>{shop.address} | फोन: {toNepaliDigits(shop.phone)}</p>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm print:text-[10px] font-bold text-black">
                  <span>स्थायी लेखा नं. (PAN / VAT): {toNepaliDigits(shop.panVatNumber)}</span>
                  <span>•</span>
                  <span>महासंघ दर्ता नं.: {shop.fenegosidaMembershipNo}</span>
                </div>
              </div>

              {/* Document Title Banner */}
              <div className="mt-2 print:mt-0.5 inline-block bg-black text-white print-white-text px-6 py-1.5 print:py-0.5 text-base sm:text-lg print:text-xs font-extrabold tracking-wide uppercase rounded-xs">
                सुनचाँदी खरिद भरपाई तथा कानुनी कबुलियतनामा
              </div>
              {!isPureNepaliMode && (
                <p className="text-xs print:text-[9.5px] font-semibold text-black mt-1 print:mt-0 italic">
                  (Deed of Precious Metals Purchase, Sworn Affidavit & Civil/Criminal Indemnity Bond)
                </p>
              )}
            </div>

            {/* Voucher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm print:text-[11px] bg-neutral-100 p-2.5 print:py-0.5 print:px-2 rounded border border-black font-semibold text-black">
              <div>
                <span>भरपाई नं.: </span>
                <strong className="font-mono font-extrabold">#{transaction.voucherNumber}</strong>
              </div>
              <div>
                <span>कारोबार मिति: </span>
                <strong>{toNepaliDigits(transaction.dateBS)} (वि.सं.)</strong>
              </div>
              <div>
                <span>समय: </span>
                <strong>{transaction.time} {!isPureNepaliMode && `(${transaction.dateAD})`}</strong>
              </div>
            </div>

            {/* Section 1: Seller KYC Details */}
            <div className="border border-black rounded p-3 print:p-1.5 bg-white text-black">
              <h2 className="text-sm sm:text-base print:text-[11px] font-extrabold text-black border-b border-black pb-1.5 print:pb-0.5 mb-2.5 print:mb-1 flex flex-wrap items-center justify-between gap-2">
                <span>१. बिक्रेताको पूर्ण व्यक्तिगत तथा ३ पुस्ते विवरण</span>
                <span className="text-xs print:text-[10px] font-bold text-black flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 print:w-3 print:h-3" /> सक्कल परिचयपत्र रुजु प्रमाणित
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2">
                <div className="sm:col-span-3 print:col-span-3 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-4 print:gap-x-3 gap-y-2 print:gap-y-0.5 text-sm print:text-[11px] print:leading-snug">
                  <div>
                    <span className="text-neutral-900 font-semibold text-xs print:text-[10.5px] block print:inline print:mr-1">बिक्रेताको पूरा नाम:</span>
                    <span className="font-extrabold text-black text-base print:text-[11px]">{seller.fullNameNepali}</span>
                    {!isPureNepaliMode && seller.fullNameEnglish && (
                      <span className="text-xs print:text-[10px] font-semibold text-black block print:inline print:ml-1">({seller.fullNameEnglish})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-neutral-900 font-semibold text-xs print:text-[10.5px] block print:inline print:mr-1">सम्पर्क मोवाइल नं.:</span>
                    <span className="font-bold text-black text-base print:text-[11px] tabular-nums">{toNepaliDigits(seller.mobileNumber)}</span>
                  </div>

                  {/* 3-Puste Lineage Grid */}
                  <div className="sm:col-span-2 print:col-span-2 p-2.5 print:py-1 print:px-2 bg-amber-50 border border-black rounded grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-2 print:gap-1.5 text-xs sm:text-sm print:text-[10.5px]">
                    <div>
                      <span className="text-neutral-900 font-semibold block print:inline print:mr-1">१. बाजे:</span>
                      <strong className="text-black font-bold">{seller.grandfatherName || 'खुलाइएको छैन'}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-900 font-semibold block print:inline print:mr-1">२. बाबु:</span>
                      <strong className="text-black font-bold">{seller.fatherName || seller.fatherOrHusbandName || 'खुलाइएको छैन'}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-900 font-semibold block print:inline print:mr-1">३. पति/पत्नी:</span>
                      <strong className="text-black font-bold">{seller.spouseName || 'अविवाहित / खुलाइएको छैन'}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-neutral-900 font-semibold text-xs print:text-[10.5px] block print:inline print:mr-1">
                      {seller.idType === 'citizenship' ? 'नागरिकता प्रमाणपत्र नं.' : 
                       seller.idType === 'national_id' ? 'राष्ट्रिय परिचयपत्र नं.' : 'राहदानी / परिचयपत्र नं.'}:
                    </span>
                    <span className="font-extrabold text-black tabular-nums text-sm sm:text-base print:text-[11px]">{toNepaliDigits(seller.idNumber)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-900 font-semibold text-xs print:text-[10.5px] block print:inline print:mr-1">जारी जिल्ला र मिति:</span>
                    <span className="font-bold text-black">{seller.issuedDistrict} | वि.सं. {toNepaliDigits(seller.issuedDateBS)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-900 font-semibold text-xs print:text-[10.5px] block print:inline print:mr-1">स्थायी ठेगाना:</span>
                    <span className="font-bold text-black">
                      {seller.province}, {seller.district}, {seller.municipality}-{toNepaliDigits(seller.wardNo)}{seller.tole ? `, ${seller.tole}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-900 font-semibold text-xs print:text-[10.5px] block print:inline print:mr-1">हालको बसोबास:</span>
                    <span className="font-bold text-black">{seller.currentAddress || seller.district}</span>
                  </div>
                </div>

                {/* Photo Box */}
                <div className="flex flex-col items-center justify-center p-2 print:p-1 border border-black rounded bg-neutral-50 text-center">
                  {seller.sellerPhotoUrl ? (
                    <img
                      src={seller.sellerPhotoUrl}
                      alt="Seller Photo"
                      className="w-28 h-32 print:w-20 print:h-24 object-cover rounded border border-black"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-28 h-32 print:w-20 print:h-24 border border-dashed border-black rounded bg-white" />
                  )}
                  <span className="text-xs print:text-[10px] font-bold text-black mt-1 print:mt-0.5">बिक्रेताको तस्बिर</span>
                </div>
              </div>
            </div>

            {/* Section 2: Precious Metal Items Table */}
            <div className="border border-black rounded p-3 print:p-1.5 bg-white text-black">
              <h2 className="text-sm sm:text-base print:text-[11px] font-extrabold text-black border-b border-black pb-1.5 print:pb-0.5 mb-2 print:mb-1">
                {isPureNepaliMode 
                  ? '२. खरिद गरिएको गहना तथा धातुको पूर्ण विवरण'
                  : '२. खरिद गरिएको गहना तथा धातुको पूर्ण विवरण (Particulars of Bullion / Jewelry)'}
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left border-collapse border border-black text-xs sm:text-[13px] print:text-[10px] print:leading-tight">
                  <thead>
                    <tr className="bg-neutral-200 font-extrabold text-black border-b border-black">
                      <th className="w-[6%] py-2 print:py-0.5 px-1 text-center border-r border-black align-middle">क्र.सं.</th>
                      <th className="w-[18%] py-2 print:py-0.5 px-1.5 text-left border-r border-black align-middle">विवरण (गहना/धातु)</th>
                      <th className="w-[13%] py-2 print:py-0.5 px-1.5 text-left border-r border-black align-middle">क्यारेट / गुणस्तर</th>
                      <th className="w-[10%] py-2 print:py-0.5 px-1 text-right border-r border-black align-middle">जम्मा (ग्राम)</th>
                      <th className="w-[10%] py-2 print:py-0.5 px-1 text-right border-r border-black align-middle">कट्टा</th>
                      <th className="w-[15%] py-2 print:py-0.5 px-1.5 text-right border-r border-black align-middle">खुद तौल</th>
                      <th className="w-[9%] py-2 print:py-0.5 px-1 text-center border-r border-black align-middle">जाँच विधि</th>
                      <th className="w-[9%] py-2 print:py-0.5 px-1 text-right border-r border-black align-middle">दर/तोला</th>
                      <th className="w-[10%] py-2 print:py-0.5 px-1.5 text-right align-middle">कुल रकम</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {items.map((item, idx) => {
                      const totalDeductions = item.deductionMode === 'direct_grams' && item.manualDeductionGrams !== undefined
                        ? item.manualDeductionGrams
                        : (item.stoneWeightGrams || 0) + (item.waxDirtWeightGrams || 0) + (item.jartiWeightGrams || 0);

                      return (
                        <tr key={item.id} className="text-black font-semibold">
                          <td className="py-2 print:py-0.5 px-1 text-center border-r border-black align-middle tabular-nums font-bold">
                            {toNepaliDigits(idx + 1)}
                          </td>
                          <td className="py-2 print:py-0.5 px-1.5 text-left border-r border-black align-middle font-bold break-words">
                            {item.itemName}
                            {item.notes && <span className="block text-[11px] print:text-[9.5px] font-medium text-neutral-900">{item.notes}</span>}
                          </td>
                          <td className="py-2 print:py-0.5 px-1.5 text-left border-r border-black align-middle break-words">
                            {item.purityLabel}
                          </td>
                          <td className="py-2 print:py-0.5 px-1 text-right border-r border-black align-middle tabular-nums">
                            {toNepaliDigits(item.grossWeightGrams.toFixed(2))} ग्रा.
                          </td>
                          <td className="py-2 print:py-0.5 px-1 text-right border-r border-black align-middle tabular-nums text-red-900 font-bold">
                            -{toNepaliDigits(totalDeductions.toFixed(2))} ग्रा.
                          </td>
                          <td className="py-2 print:py-0.5 px-1.5 text-right border-r border-black align-middle tabular-nums font-bold">
                            <div>{toNepaliDigits(item.netWeightGrams.toFixed(2))} ग्राम</div>
                            <div className="text-[11px] print:text-[9.5px] font-semibold">
                              ({toNepaliDigits(item.netWeightTola)} तोला {toNepaliDigits(item.netWeightLal)} लाल)
                            </div>
                          </td>
                          <td className="py-2 print:py-0.5 px-1 text-center border-r border-black align-middle text-xs print:text-[10px]">
                            {item.testingMethod === 'touchstone_acid' ? 'कसी/एसिड' : 
                             item.testingMethod === 'electronic_densimeter' ? 'डेन्सिमिटर' : 
                             item.testingMethod === 'xrf_spectrometer' ? 'XRF मेशिन' : 'हलमार्क'}
                            <span className="block text-[11px] print:text-[9.5px] font-bold">{toNepaliDigits(item.testedPurityPercentage)}%</span>
                          </td>
                          <td className="py-2 print:py-0.5 px-1 text-right border-r border-black align-middle tabular-nums">
                            {formatNPR(item.ratePerTola, isPureNepaliMode)}
                          </td>
                          <td className="py-2 print:py-0.5 px-1.5 text-right align-middle tabular-nums font-extrabold text-black">
                            {formatNPR(item.totalItemValue, isPureNepaliMode)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-black bg-emerald-50 font-extrabold text-black">
                      <td colSpan={3} className="py-2 print:py-0.5 px-2 text-right border-r border-black align-middle">
                        कुल जम्मा:
                      </td>
                      <td className="py-2 print:py-0.5 px-1 text-right border-r border-black align-middle tabular-nums">
                        {toNepaliDigits(transaction.totalGrossGrams.toFixed(2))} ग्रा.
                      </td>
                      <td className="py-2 print:py-0.5 px-1 border-r border-black"></td>
                      <td className="py-2 print:py-0.5 px-1.5 text-right border-r border-black align-middle tabular-nums">
                        {toNepaliDigits(transaction.totalNetGrams.toFixed(2))} ग्रा.
                        <span className="block text-[11px] print:text-[9.5px] font-bold">
                          ({toNepaliDigits(transaction.totalNetTola.toFixed(2))} तोला)
                        </span>
                      </td>
                      <td colSpan={2} className="py-2 print:py-0.5 px-1.5 text-right border-r border-black align-middle">
                        अन्तिम भुक्तानी:
                      </td>
                      <td className="py-2 print:py-0.5 px-1.5 text-right align-middle tabular-nums text-sm sm:text-base print:text-xs font-extrabold">
                        {formatNPR(transaction.grandTotalAmount, true)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Section 3: Statutory Source & Legal Indemnity Statement */}
            <div className="border border-black bg-white rounded p-3.5 print:p-1.5 text-sm print:text-[10.5px] leading-relaxed print:leading-snug text-black space-y-2 print:space-y-0.5">
              <h2 className="text-sm sm:text-base print:text-[11px] font-extrabold text-black border-b border-black pb-1 print:pb-0.5">
                ३. सम्पत्ति प्राप्ति स्रोत तथा कानुनी कबुलियतनामा
              </h2>

              <div className="flex flex-wrap items-center gap-2 font-bold text-black">
                <span>गहना/धातु प्राप्तिको स्रोत:</span>
                <strong className="underline">
                  {declaration.source === 'ancestral_property' ? 'पैतृक/बाबुबाजेको सम्पत्ति' :
                   declaration.source === 'marriage_stridhan_dowry' ? 'विवाहको स्त्रीधन / दाइजो / पेवा' :
                   declaration.source === 'purchased_with_receipt' ? 'पहिले आफैंले खरिद गरेको (बिल संलग्न)' :
                   declaration.source === 'foreign_remittance' ? 'विदेशबाट ल्याएको वैध सुन' : 'व्यक्तिगत आर्जनबाट खरिद'}
                </strong>
                {declaration.sourceDescription && (
                  <span className="font-semibold">({declaration.sourceDescription})</span>
                )}
              </div>

              {/* Formal Legal Affidavit Clause */}
              <div className="p-2.5 print:p-1 bg-neutral-50 border border-black rounded text-black space-y-1.5 print:space-y-0.5 text-justify text-[13px] sm:text-sm print:text-[10px] leading-relaxed print:leading-[1.28] font-medium">
                <p className="font-extrabold text-black">
                  मुलुकी अपराध संहिता २०७४ दफा २४४ तथा सम्पत्ति शुद्धीकरण (मनि लाउन्डरिङ) निवारण ऐन २०६४ बमोजिमको ३ पुस्ते कबुलियत:
                </p>
                <p>
                  "श्री <strong>{seller.grandfatherName || '........'}</strong> को नाति/नातिनी, श्री <strong>{seller.fatherName || seller.fatherOrHusbandName || '........'}</strong> को छोरा/छोरी, {seller.spouseName ? `श्री ${seller.spouseName} को पति/पत्नी, ` : ''}जिल्ला {seller.district}, {seller.municipality} वडा नं. {toNepaliDigits(seller.wardNo || '..')} बस्ने म बिक्रेता <strong>{seller.fullNameNepali}</strong> ले माथि उल्लेखित सुन/चाँदीका गहना तथा धातु मेरो आफ्नै वैध हकभोग, पूर्ण स्वामित्व तथा वैधानिक स्रोतबाट आर्जित भएको व्यहोरा सत्य हो। यो धातु कुनै चोरी, डकैती, ठगी, तस्करी, वा कुनै गैरकानुनी कसूरबाट प्राप्त भएको होइन, न त कुनै बैंक, वित्तीय संस्था वा व्यक्तिमा धितो, बन्धक वा रोक्का राखिएको छ। मैले यो मालवस्तु आफ्नो राजीखुसीले आजका मितिमा प्रचलित बजार दर अनुसार यस पसललाई बिक्री गरी भुक्तानी बुझिलिएँ। यदि भविष्यमा यो मालवस्तु कुनै मुद्दा-मामिला, चोरी वा गैरकानुनी स्रोत प्रमाणित भएमा त्यसबाट उत्पन्न हुने सम्पूर्ण देवानी तथा फौजदारी दायित्व (मुलुकी अपराध संहिता २०७४ बमोजिम) ३ पुस्तासम्मको हकदाबी समेत म स्वयं बिक्रेताले बेहोर्नेछु। यस खरिद कार्यबाट पसल वा सञ्चालकलाई कुनै पनि प्रकारको क्षति वा कानुनी झमेला परेमा सोको शतप्रतिशत क्षतिपूर्ति म आफैंले बेहोर्नेछु भनी यो भरपाई सहिछाप गरिदिएँ।"
                </p>
              </div>
            </div>

            {/* Section 4: Payment Details */}
            <div className="border border-black rounded p-3 print:p-1.5 text-sm print:text-[11px] bg-white text-black">
              <h2 className="text-sm sm:text-base print:text-[11px] font-extrabold text-black border-b border-black pb-1 print:pb-0.5 mb-2 print:mb-1">
                {isPureNepaliMode 
                  ? '४. भुक्तानी विवरण तथा सम्पत्ति शुद्धीकरण अनुपालन'
                  : '४. भुक्तानी विवरण (Payment & AML Tax Trace)'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-3 print:gap-2">
                <div>
                  <span className="font-semibold text-xs print:text-[10.5px] block print:inline print:mr-1">भुक्तानी माध्यम:</span>
                  <span className="font-extrabold text-black">
                    {payment.method === 'bank_transfer' ? 'बैंक ट्रान्सफर / RTGS' :
                     payment.method === 'account_cheque' ? 'एकाउन्ट पेयी चेक' :
                     payment.method === 'fonepay_ips' ? 'फोनपे / कनेक्ट IPS' : 'नगद भुक्तानी (रु. ५०,००० भित्र)'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-xs print:text-[10.5px] block print:inline print:mr-1">बैंक / चेक / भौचर नं.:</span>
                  <span className="font-mono text-black font-bold">
                    {payment.bankName ? `${payment.bankName} - ` : ''}
                    {payment.transactionReference || payment.chequeNumber || 'नगद भुक्तानी'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-xs print:text-[10.5px] block print:inline print:mr-1">बिक्रेताको PAN नं.:</span>
                  <span className="font-mono font-bold text-black">{toNepaliDigits(payment.sellerPAN || 'लागु नभएको')}</span>
                </div>
                <div className="sm:col-span-3 print:col-span-3 pt-1.5 print:pt-0.5 border-t border-black flex flex-wrap items-baseline gap-2">
                  <span className="font-bold">अक्षरेपी रकम:</span>
                  <span className="font-extrabold text-black font-serif">
                    {payment.amountInWordsNepali}
                  </span>
                  {!isPureNepaliMode && (
                    <span className="text-xs print:text-[10px] font-semibold text-black italic">
                      ({payment.amountInWordsEnglish})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Witness (साक्षी) */}
            {witness.witness1Name && (
              <div className="border border-black rounded p-3 print:p-1.5 text-sm print:text-[10.5px] bg-white text-black">
                <h2 className="text-sm sm:text-base print:text-[11px] font-extrabold text-black border-b border-black pb-1 print:pb-0.5 mb-2 print:mb-1">
                  ५. रोहवर साक्षीको विवरण तथा दस्तखत
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 gap-2 print:gap-1.5">
                  <div>
                    <span className="text-xs print:text-[10px] font-semibold block print:inline print:mr-1">साक्षी:</span>
                    <span className="font-bold text-black">{witness.witness1Name}</span>
                  </div>
                  <div>
                    <span className="text-xs print:text-[10px] font-semibold block print:inline print:mr-1">ठेगाना:</span>
                    <span className="font-bold text-black">{witness.witness1Address}</span>
                  </div>
                  <div>
                    <span className="text-xs print:text-[10px] font-semibold block print:inline print:mr-1">ना./फोन:</span>
                    <span className="font-bold text-black">{toNepaliDigits(witness.witness1IdNumber)} | {toNepaliDigits(witness.witness1Phone)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs print:text-[10px] font-semibold block print:inline print:mr-1">दस्तखत:</span>
                    <span className="font-serif italic font-bold text-black">
                      {witness.witness1Name.split(' ')[0]} (रोहवर)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Open Biometrics, Seller Signature/Info & Buyer Stamp/Signature (NO stamp table!) */}
            <div className="pt-2 print:pt-0.5 text-black break-inside-avoid">
              <h2 className="text-sm sm:text-base print:text-[11px] font-extrabold text-black border-b-2 border-black pb-1.5 print:pb-0.5 mb-4 print:mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span>{witness.witness1Name ? '६.' : '५.'} बिक्रेताको औंठाछाप, दस्तखत तथा खरिदकर्ताको आधिकारिक छाप र हस्ताक्षर</span>
                <span className="text-xs print:text-[10px] font-bold text-black">मुलुकी अपराध संहिता २०७४ दफा २४४ बमोजिम</span>
              </h2>

              <div className="grid grid-cols-2 gap-x-6 sm:gap-x-10 gap-y-5 print:gap-y-1">
                {/* Row 1, Left: Fingerprints (2.5 cm wide x 3 cm length) */}
                <div className="flex items-start gap-4 sm:gap-5 pt-1 print:pt-0 min-w-0">
                  {/* Left Thumbprint */}
                  <div className="flex flex-col items-center">
                    <div className="w-[2.5cm] h-[3cm] border-2 border-black bg-white flex flex-col items-center justify-center p-1 overflow-hidden">
                      {seller.leftThumbprintUrl ? (
                        <img src={seller.leftThumbprintUrl} alt="Left Thumbprint" className="w-full h-full object-contain" />
                      ) : null}
                    </div>
                    <span className="text-xs sm:text-sm print:text-[10.5px] print:leading-tight font-bold text-black mt-1.5 print:mt-0.5">बायाँ ल्याप्चे</span>
                  </div>

                  {/* Right Thumbprint */}
                  <div className="flex flex-col items-center">
                    <div className="w-[2.5cm] h-[3cm] border-2 border-black bg-white flex flex-col items-center justify-center p-1 overflow-hidden">
                      {seller.rightThumbprintUrl ? (
                        <img src={seller.rightThumbprintUrl} alt="Right Thumbprint" className="w-full h-full object-contain" />
                      ) : null}
                    </div>
                    <span className="text-xs sm:text-sm print:text-[10.5px] print:leading-tight font-bold text-black mt-1.5 print:mt-0.5">दायाँ ल्याप्चे</span>
                  </div>
                </div>

                {/* Row 1, Right: Clean open space for Buyer Rubber Stamp */}
                <div className="min-h-[3cm]" />

                {/* Row 2, Left: Seller Signature (under fingerprints) & Open Seller Info */}
                <div className="space-y-2 print:space-y-0.5 min-w-0">
                  <div className="min-h-[48px] print:min-h-[16px] flex items-end">
                    {seller.signatureUrl ? (
                      <img src={seller.signatureUrl} alt="Seller Signature" className="h-11 print:h-7 object-contain mb-0.5" />
                    ) : null}
                  </div>
                  <div className="border-b-2 border-black w-full max-w-[260px]" />
                  <span className="text-sm print:text-[11px] font-extrabold text-black block">
                    बिक्रेताको दस्तखत
                  </span>

                  <div className="space-y-1 print:space-y-0 text-sm print:text-[10.5px] print:leading-[1.28] text-black pt-1 print:pt-0.5 break-words">
                    <div>
                      <span className="font-bold">नाम: </span>
                      <span className="font-extrabold">
                        {seller.fullNameNepali}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold">परिचयपत्र नं.: </span>
                      <span className="font-extrabold font-mono">{toNepaliDigits(seller.idNumber)}</span>
                    </div>
                    <div>
                      <span className="font-bold">ठेगाना: </span>
                      <span className="font-bold">
                        {seller.district}, {seller.municipality}-{toNepaliDigits(seller.wardNo)}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold">सम्पर्क नं.: </span>
                      <span className="font-extrabold font-mono">{toNepaliDigits(seller.mobileNumber)}</span>
                    </div>
                  </div>
                </div>

                {/* Row 2, Right: Buyer Signature (horizontally aligned with Seller Signature) & Open Shop Info */}
                <div className="space-y-2 print:space-y-0.5 min-w-0">
                  <div className="min-h-[48px] print:min-h-[16px]" />
                  <div className="border-b-2 border-black w-full max-w-[260px]" />
                  <span className="text-sm print:text-[11px] font-extrabold text-black block">
                    सञ्चालक / अधिकृत हस्ताक्षर र पसलको छाप
                  </span>

                  <div className="space-y-1 print:space-y-0 text-sm print:text-[10.5px] print:leading-[1.28] text-black pt-1 print:pt-0.5 break-words">
                    <div>
                      <span className="font-bold">पसल: </span>
                      <span className="font-extrabold">{shop.nameNepali}</span>
                    </div>
                    <div>
                      <span className="font-bold">सञ्चालक: </span>
                      <span className="font-bold">{shop.proprietorName || 'सञ्चालक'}</span>
                    </div>
                    <div>
                      <span className="font-bold">PAN नं.: </span>
                      <span className="font-extrabold font-mono">{toNepaliDigits(shop.panVatNumber)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Security Hash & Bottom-Right Page Numbering */}
            <div className="border-t-2 border-black pt-2.5 print:pt-1 flex flex-wrap items-center justify-between gap-2 text-xs print:text-[9.5px] font-bold text-black font-mono">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 print:w-3 print:h-3 text-black shrink-0" />
                <span>प्रमाणीकरण कोड: {transaction.tamperVerificationHash}</span>
              </div>
              <div className="ml-auto text-right">
                <span>नेपाल कानुन अनुसार प्रमाणित आधिकारिक भरपाई • </span>
                <span className="font-extrabold">
                  पृष्ठ {toNepaliDigits(1)} / {toNepaliDigits(totalPages)} (Page 1 of {totalPages})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== PAGE 2: ATTACHED ID PHOTOS (NEXT PAGE) ==================== */}
        {hasIdPhotosPage && (
          <div className="deed-a4-page deed-page-break bg-white border-2 border-black rounded-lg print:rounded-none p-5 sm:p-7 print:p-2 shadow-lg max-w-[210mm] mx-auto text-black font-sans relative overflow-hidden print:overflow-visible">
            <div className="border border-black p-4 sm:p-5 print:p-2.5 space-y-4 print:space-y-2.5">
              {/* Page 2 Header */}
              <div className="text-center border-b-2 border-black pb-3 print:pb-2 space-y-1.5 print:space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 print:pb-1 border-b border-black text-xs sm:text-sm print:text-[11px] font-bold text-black">
                  <span className="font-mono">
                    सम्झौता सिरीयल नं.: {transaction.contractSerialNumber || `SN-${transaction.voucherNumber}`} | भरपाई नं.: #{transaction.voucherNumber}
                  </span>
                  <span className="font-mono">मिति: {toNepaliDigits(transaction.dateBS)} (वि.सं.)</span>
                </div>
                <h2 className="text-xl sm:text-2xl print:text-lg font-extrabold text-black font-serif">
                  {shop.nameNepali}
                </h2>
                <div className="inline-block bg-black text-white print-white-text px-6 py-1 text-base print:text-sm font-extrabold rounded-xs">
                  संलग्न परिचयपत्र तथा प्रमाणित तस्बिर प्रतिलिपि (पृष्ठ २)
                </div>
              </div>

              {/* Seller Summary */}
              <div className="p-3 print:p-2 bg-neutral-100 border border-black rounded text-sm print:text-xs font-bold text-black flex flex-wrap items-center justify-between gap-2">
                <span>बिक्रेता: {seller.fullNameNepali}</span>
                <span>परिचयपत्र नं.: {toNepaliDigits(seller.idNumber)}</span>
                <span>सम्पर्क: {toNepaliDigits(seller.mobileNumber)}</span>
              </div>

              {/* ID Front & Back Cards (Large & Clear on Page 2) */}
              <div className="space-y-4 print:space-y-2.5">
                <div className="border-2 border-black rounded bg-white overflow-hidden">
                  <div className="bg-neutral-200 border-b border-black px-3 py-2 print:py-1 text-sm print:text-xs font-extrabold text-black">
                    १. परिचयपत्र / नागरिकता प्रमाणपत्रको अगाडिको भाग (ID Card Front)
                  </div>
                  <div className="p-4 print:p-2 flex items-center justify-center min-h-[280px] print:min-h-[205px] bg-white">
                    {seller.idCardFrontUrl ? (
                      <img 
                        src={seller.idCardFrontUrl} 
                        alt="ID Front" 
                        className="max-h-[340px] print:max-h-[240px] max-w-full object-contain mx-auto border border-black rounded"
                        referrerPolicy="no-referrer"
                      />
                    ) : seller.sellerPhotoUrl && !seller.idCardBackUrl ? (
                      <img 
                        src={seller.sellerPhotoUrl} 
                        alt="Seller Portrait" 
                        className="max-h-[340px] print:max-h-[240px] max-w-full object-contain mx-auto border border-black rounded"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-sm print:text-xs font-bold text-black">
                        परिचयपत्र अगाडिको भाग संलग्न गरिएको छैन (वा सक्कल प्रतिलिपि यहाँ टाँस्नुहोस्)
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-2 border-black rounded bg-white overflow-hidden">
                  <div className="bg-neutral-200 border-b border-black px-3 py-2 print:py-1 text-sm print:text-xs font-extrabold text-black">
                    २. परिचयपत्र / नागरिकता प्रमाणपत्रको पछाडिको भाग (ID Card Back)
                  </div>
                  <div className="p-4 print:p-2 flex items-center justify-center min-h-[280px] print:min-h-[205px] bg-white">
                    {seller.idCardBackUrl ? (
                      <img 
                        src={seller.idCardBackUrl} 
                        alt="ID Back" 
                        className="max-h-[340px] print:max-h-[240px] max-w-full object-contain mx-auto border border-black rounded"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-sm print:text-xs font-bold text-black">
                        परिचयपत्र पछाडिको भाग संलग्न गरिएको छैन (वा सक्कल प्रतिलिपि यहाँ टाँस्नुहोस्)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Verification Signatures on Page 2 (with generous vertical gap above lines for physical signing) */}
              <div className="pt-16 print:pt-12 pb-2 print:pb-1 flex flex-wrap items-end justify-between gap-8 text-sm print:text-xs font-bold text-black">
                <div>
                  <div className="border-b-2 border-black w-60 mb-1.5" />
                  <span>बिक्रेताको दस्तखत</span>
                </div>
                <div className="text-right">
                  <div className="border-b-2 border-black w-68 ml-auto mb-1.5" />
                  <span>सक्कल बमोजिम नक्कल ठीक छ (सञ्चालक)</span>
                </div>
              </div>

              {/* Footer Page 2 & Bottom-Right Page Numbering */}
              <div className="border-t-2 border-black pt-2.5 print:pt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs print:text-[10px] font-bold text-black font-mono">
                <span>प्रमाणीकरण कोड: {transaction.tamperVerificationHash}</span>
                <div className="ml-auto text-right">
                  <span>नेपाल कानुन अनुसार प्रमाणित आधिकारिक अभिलेख • </span>
                  <span className="font-extrabold">
                    पृष्ठ {toNepaliDigits(2)} / {toNepaliDigits(totalPages)} (Page 2 of {totalPages})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
