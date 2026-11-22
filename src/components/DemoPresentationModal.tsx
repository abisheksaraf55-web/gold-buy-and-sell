import React, { useState, useEffect, useCallback } from 'react';
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Loader2,
  FileText,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { PurchaseTransaction, ShopDetails } from '../types/bullion';
import {
  DEMO_SLIDES,
  exportDemoPresentationToPPTX,
} from '../utils/demoPresentationBuilder';
import { formatNPR } from '../utils/nepalBullionCalculations';
import sealBadge from '../assets/images/nepal_bullion_seal_1790317148844.jpg';

interface DemoPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop?: ShopDetails;
  transactions?: PurchaseTransaction[];
}

export const DemoPresentationModal: React.FC<DemoPresentationModalProps> = ({
  isOpen,
  onClose,
  shop,
  transactions = [],
}) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const totalSlides = DEMO_SLIDES.length;
  const activeSlide = DEMO_SLIDES[slideIndex];

  const totalGoldGrams = transactions.reduce(
    (sum, tx) =>
      sum +
      tx.items
        .filter((i) => i.metalType === 'gold')
        .reduce((s, i) => s + (Number(i.netWeightGrams) || 0), 0),
    0
  );

  const totalSilverGrams = transactions.reduce(
    (sum, tx) =>
      sum +
      tx.items
        .filter((i) => i.metalType === 'silver')
        .reduce((s, i) => s + (Number(i.netWeightGrams) || 0), 0),
    0
  );

  const totalPayoutNPR = transactions.reduce(
    (sum, tx) => sum + (Number(tx.grandTotalAmount) || 0),
    0
  );

  const goNext = useCallback(() => {
    setSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setSlideIndex((prev) => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goNext, goPrev, onClose]);

  if (!isOpen) return null;

  const handleDownloadPptx = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportStatus(null);
    try {
      await exportDemoPresentationToPPTX({
        shop,
        transactionCount: transactions.length,
        totalGoldGrams,
        totalSilverGrams,
        totalPayoutNPR,
      });
      setExportStatus('PowerPoint (.pptx) सफलतापूर्वक डाउनलोड भयो।');
    } catch (err) {
      console.error('PPTX export failed:', err);
      setExportStatus('PowerPoint फाइल तयार गर्न सकिएन। कृपया पुनः प्रयास गर्नुहोस्।');
    } finally {
      setIsExporting(false);
    }
  };

  const shopLabel =
    shop?.nameEnglish || shop?.nameNepali || 'Nepal Bullion Legal Purchase & KYC System';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Demonstration PowerPoint Presentation"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Top Presenter Toolbar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-950">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Presentation className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                प्रदर्शन प्रस्तुति (Demonstration PowerPoint)
              </h2>
              <p className="text-[11px] text-neutral-400 truncate">
                {activeSlide.number} / 0{totalSlides} · {activeSlide.kicker}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowNotes((prev) => !prev)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                showNotes
                  ? 'bg-neutral-800 border-neutral-600 text-white'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Speaker Notes</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPptx}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating PPTX...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PowerPoint (.pptx)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Close Presentation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {exportStatus && (
          <div className="px-6 py-2 bg-emerald-950/90 border-b border-emerald-800 text-xs text-emerald-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportStatus}</span>
            </div>
            <button
              type="button"
              onClick={() => setExportStatus(null)}
              className="text-emerald-300 hover:text-white cursor-pointer"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main 16:9 Slide Stage + Thumbnails */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-900 space-y-4">
          {/* Slide Canvas Frame */}
          <div
            className={`w-full rounded-xl overflow-hidden border shadow-xl transition-colors ${
              activeSlide.layout === 'cover'
                ? 'bg-neutral-950 border-neutral-800 text-white'
                : 'bg-[#FAF9F6] border-neutral-300 text-neutral-900'
            }`}
          >
            {/* Top Accent Line */}
            <div className="h-1.5 w-full bg-amber-600" />

            <div className="p-6 sm:p-10 min-h-[380px] sm:min-h-[430px] flex flex-col justify-between gap-6">
              {activeSlide.layout === 'cover' ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={sealBadge}
                        alt="Seal"
                        className="w-11 h-11 rounded-full border border-amber-500/50 object-contain bg-neutral-900 shrink-0"
                      />
                      <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                        Product & Compliance Demonstration
                      </span>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h3 className="text-2xl sm:text-4xl font-bold font-serif tracking-tight text-white">
                        {activeSlide.title}
                      </h3>
                      <p className="text-base sm:text-lg text-amber-200 font-medium">
                        {activeSlide.subtitleNepali}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {activeSlide.highlights.map((hl, hIdx) => (
                      <div
                        key={hIdx}
                        className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-medium text-neutral-100 flex items-start gap-2.5"
                      >
                        <span className="font-mono text-amber-400 font-bold shrink-0">
                          0{hIdx + 1}.
                        </span>
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Prepared for: {shopLabel}
                    </span>
                    {transactions.length > 0 && (
                      <span className="tabular-nums text-neutral-300">
                        {transactions.length} Recorded Deeds · Gold {totalGoldGrams.toFixed(2)}g · Payout{' '}
                        {formatNPR(totalPayoutNPR, true)}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Standard Content Slide Header */}
                  <div className="border-b border-neutral-200 pb-4 space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-amber-800">
                      {activeSlide.kicker}
                    </p>
                    <h3 className="text-xl sm:text-3xl font-bold font-serif text-neutral-900">
                      {activeSlide.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-600">
                      {activeSlide.subtitleNepali}
                    </p>
                  </div>

                  {/* Slide Body by Layout */}
                  <div className="flex-1 flex flex-col justify-center space-y-4">
                    <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                      {activeSlide.highlights.join(' ')}
                    </p>

                    {activeSlide.layout === 'two-col' &&
                      activeSlide.leftColumn &&
                      activeSlide.rightColumn && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                            <div className="px-4 py-2.5 bg-neutral-100 border-b border-neutral-200 text-xs sm:text-sm font-bold text-neutral-900">
                              {activeSlide.leftColumn.heading}
                            </div>
                            <ul className="p-4 space-y-2.5 text-xs sm:text-sm text-neutral-800">
                              {activeSlide.leftColumn.points.map((pt, pIdx) => (
                                <li key={pIdx} className="flex items-start gap-2">
                                  <span className="text-neutral-400 font-bold">•</span>
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
                            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-xs sm:text-sm font-bold text-amber-950">
                              {activeSlide.rightColumn.heading}
                            </div>
                            <ul className="p-4 space-y-2.5 text-xs sm:text-sm text-neutral-800">
                              {activeSlide.rightColumn.points.map((pt, pIdx) => (
                                <li key={pIdx} className="flex items-start gap-2">
                                  <span className="text-amber-600 font-bold">•</span>
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                    {activeSlide.layout === 'workflow' && activeSlide.cards && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {activeSlide.cards.map((card, cIdx) => (
                          <div
                            key={cIdx}
                            className="bg-white border border-neutral-200 rounded-xl overflow-hidden flex flex-col"
                          >
                            <div
                              className={`px-3 py-2 text-[11px] font-bold tracking-wide text-white ${
                                cIdx === 0 || cIdx === 4 ? 'bg-neutral-900' : 'bg-amber-600'
                              }`}
                            >
                              STEP 0{cIdx + 1}
                            </div>
                            <div className="p-3.5 space-y-2 flex-1">
                              <h4 className="text-xs sm:text-sm font-bold font-serif text-neutral-900">
                                {card.heading.replace(/^\d+\.\s*/, '')}
                              </h4>
                              <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                                {card.body}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeSlide.layout === 'cards' && activeSlide.cards && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeSlide.cards.map((card, cIdx) => (
                          <div
                            key={cIdx}
                            className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 space-y-1.5"
                          >
                            <h4 className="text-xs sm:text-sm font-bold font-serif text-amber-900">
                              0{cIdx + 1}. {card.heading}
                            </h4>
                            <p className="text-xs text-neutral-700 leading-relaxed">
                              {card.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeSlide.layout === 'table' &&
                      activeSlide.tableHeaders &&
                      activeSlide.tableRows && (
                        <div className="space-y-4">
                          <div className="overflow-x-auto border border-neutral-200 rounded-xl bg-white">
                            <table className="w-full text-left border-collapse text-xs sm:text-sm">
                              <thead>
                                <tr className="bg-neutral-900 text-white">
                                  {activeSlide.tableHeaders.map((h, hIdx) => (
                                    <th key={hIdx} className="px-4 py-2.5 font-semibold">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-200">
                                {activeSlide.tableRows.map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className={rIdx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className={`px-4 py-2.5 ${
                                          cIdx === 0 ? 'font-bold text-neutral-900' : 'text-neutral-700'
                                        }`}
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>
                              Deployment Ready: Vite + Express + Cloud Firestore + Gemini Vision OCR Proxy + Real-Time Backup & Printable A4 Compliance Outputs.
                            </span>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Content Slide Footer */}
                  <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
                    <span>
                      {shopLabel} · Muluki Criminal Code 2074 (Sec. 244) &amp; AML Act 2064
                    </span>
                    <span className="font-semibold text-neutral-800 tabular-nums">
                      Slide {slideIndex + 1} of {totalSlides}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Speaker Notes Box */}
          {showNotes && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-300 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Presenter Speaker Notes (Slide {activeSlide.number})
              </div>
              <p className="leading-relaxed">{activeSlide.speakerNotes}</p>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar + Slide Index */}
        <div className="px-4 sm:px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {DEMO_SLIDES.map((s, idx) => (
              <button
                key={s.number}
                type="button"
                onClick={() => setSlideIndex(idx)}
                className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-colors cursor-pointer ${
                  idx === slideIndex
                    ? 'bg-amber-600 border-amber-500 text-white font-bold'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
                title={s.title}
              >
                {s.number}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={slideIndex === 0}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg border border-neutral-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={slideIndex === totalSlides - 1}
              className="px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-neutral-900 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
