import React, { useState, useEffect } from 'react';
import { BullionMarketRates } from '../types/bullion';
import { formatNPR, GRAMS_PER_TOLA } from '../utils/nepalBullionCalculations';
import { TrendingUp, Edit2, Check, Scale } from 'lucide-react';

interface RateBoardProps {
  rates: BullionMarketRates;
  onUpdateRates: (updated: BullionMarketRates) => void;
}

export const RateBoard: React.FC<RateBoardProps> = ({ rates, onUpdateRates }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formRates, setFormRates] = useState<BullionMarketRates>(rates);

  useEffect(() => {
    setFormRates(rates);
  }, [rates]);

  const handleSave = () => {
    onUpdateRates({
      ...formRates,
      lastUpdated: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const chhapawalPerGram = Math.round(rates.chhapawalGoldPerTola / GRAMS_PER_TOLA);
  const tezabiPerGram = Math.round(rates.tezabiGoldPerTola / GRAMS_PER_TOLA);
  const silverPerGram = Math.round((rates.fineSilverPerTola / GRAMS_PER_TOLA) * 10) / 10;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
              <span>आजको महासंघ बजार दरभाउ (Today's Bullion Rates)</span>
            </h2>
            <p className="text-[11px] text-neutral-500">
              नेपाल सुनचाँदी व्यवसायी महासंघ (FENEGOSIDA) मानक दर
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-400 tabular-nums">
            अपडेट: {new Date(rates.lastUpdated).toLocaleDateString('ne-NP')}
          </span>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors flex items-center gap-1.5"
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'बन्द गर्नुहोस्' : 'दर सच्याउनुहोस्'}</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-amber-50/50 rounded-lg border border-amber-200/60">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              छापावाल सुन (२४ क्यारेट) / तोला
            </label>
            <input
              type="number"
              value={formRates.chhapawalGoldPerTola}
              onChange={(e) =>
                setFormRates({ ...formRates, chhapawalGoldPerTola: Number(e.target.value) })
              }
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              तेजाबी सुन (२२ क्यारेट) / तोला
            </label>
            <input
              type="number"
              value={formRates.tezabiGoldPerTola}
              onChange={(e) =>
                setFormRates({ ...formRates, tezabiGoldPerTola: Number(e.target.value) })
              }
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              १८ क्यारेट सुन (18K) / तोला
            </label>
            <input
              type="number"
              value={formRates.gold18kPerTola}
              onChange={(e) =>
                setFormRates({ ...formRates, gold18kPerTola: Number(e.target.value) })
              }
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              फाइन चाँदी (Fine Silver) / तोला
            </label>
            <input
              type="number"
              value={formRates.fineSilverPerTola}
              onChange={(e) =>
                setFormRates({ ...formRates, fineSilverPerTola: Number(e.target.value) })
              }
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 tabular-nums"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-200 rounded transition-colors"
            >
              रद्द गर्नुहोस्
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              दर अपडेट गर्नुहोस्
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Card 1: Chhapawal Gold */}
          <div className="p-3 bg-neutral-50/80 rounded-lg border border-neutral-200/70">
            <span className="text-[11px] font-medium text-amber-800 uppercase tracking-wider block">
              छापावाल सुन (24K)
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-bold text-neutral-900 tabular-nums">
                {formatNPR(rates.chhapawalGoldPerTola, true)}
              </span>
              <span className="text-[11px] text-neutral-500 font-normal">/तोला</span>
            </div>
            <div className="mt-1 text-[11px] text-neutral-500 flex items-center gap-1">
              <Scale className="w-3 h-3 text-neutral-400" />
              <span>प्रति ग्राम: {formatNPR(chhapawalPerGram, true)}</span>
            </div>
          </div>

          {/* Card 2: Tezabi Gold */}
          <div className="p-3 bg-neutral-50/80 rounded-lg border border-neutral-200/70">
            <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider block">
              तेजाबी सुन (22K)
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-bold text-neutral-900 tabular-nums">
                {formatNPR(rates.tezabiGoldPerTola, true)}
              </span>
              <span className="text-[11px] text-neutral-500 font-normal">/तोला</span>
            </div>
            <div className="mt-1 text-[11px] text-neutral-500 flex items-center gap-1">
              <Scale className="w-3 h-3 text-neutral-400" />
              <span>प्रति ग्राम: {formatNPR(tezabiPerGram, true)}</span>
            </div>
          </div>

          {/* Card 3: 18K Gold */}
          <div className="p-3 bg-neutral-50/80 rounded-lg border border-neutral-200/70">
            <span className="text-[11px] font-medium text-neutral-600 uppercase tracking-wider block">
              १८ क्यारेट सुन (18K)
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-bold text-neutral-900 tabular-nums">
                {formatNPR(rates.gold18kPerTola, true)}
              </span>
              <span className="text-[11px] text-neutral-500 font-normal">/तोला</span>
            </div>
            <div className="mt-1 text-[11px] text-neutral-500 flex items-center gap-1">
              <Scale className="w-3 h-3 text-neutral-400" />
              <span>प्रति ग्राम: {formatNPR(Math.round(rates.gold18kPerTola / GRAMS_PER_TOLA), true)}</span>
            </div>
          </div>

          {/* Card 4: Fine Silver */}
          <div className="p-3 bg-neutral-50/80 rounded-lg border border-neutral-200/70">
            <span className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block">
              फाइन चाँदी (Silver)
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-bold text-neutral-900 tabular-nums">
                {formatNPR(rates.fineSilverPerTola, true)}
              </span>
              <span className="text-[11px] text-neutral-500 font-normal">/तोला</span>
            </div>
            <div className="mt-1 text-[11px] text-neutral-500 flex items-center gap-1">
              <Scale className="w-3 h-3 text-neutral-400" />
              <span>प्रति ग्राम: {formatNPR(silverPerGram, true)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
