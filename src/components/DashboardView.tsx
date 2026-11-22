import React, { useMemo, useState } from 'react';
import {
  BullionMarketRates,
  PurchaseTransaction,
  ShopDetails,
} from '../types/bullion';
import {
  formatNPR,
  getCurrentDateBS,
  gramsToTolaLal,
} from '../utils/nepalBullionCalculations';
import {
  ArrowRight,
  BarChart3,
  Coins,
  Eye,
  FileText,
  PlusCircle,
  Scale,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';

interface DashboardViewProps {
  transactions: PurchaseTransaction[];
  rates: BullionMarketRates;
  shop: ShopDetails;
  onNewTransaction: () => void;
  onViewRegister: () => void;
  onViewDeed: (tx: PurchaseTransaction) => void;
}

type TrendWindow = 7 | 14 | 30;
type TrendMetric = 'payout' | 'weight';

interface DailyBucket {
  dateKey: string; // YYYY-MM-DD
  label: string;
  dateBS: string;
  goldGrams: number;
  silverGrams: number;
  payout: number;
  count: number;
}

function getLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeTxDateKey(tx: PurchaseTransaction): string {
  if (tx.dateAD && /^\d{4}-\d{2}-\d{2}/.test(tx.dateAD)) {
    return tx.dateAD.slice(0, 10);
  }
  if (tx.createdAt) {
    const parsed = new Date(tx.createdAt);
    if (!isNaN(parsed.getTime())) {
      return getLocalDateKey(parsed);
    }
  }
  return getLocalDateKey(new Date());
}

function formatShortCurrency(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k`;
  return String(Math.round(amount));
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  rates,
  shop,
  onNewTransaction,
  onViewRegister,
  onViewDeed,
}) => {
  const [trendWindow, setTrendWindow] = useState<TrendWindow>(7);
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('payout');
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  const todayAD = useMemo(() => getLocalDateKey(new Date()), []);
  const todayBS = useMemo(() => getCurrentDateBS(), []);

  // Compute Today's KPIs + All-time totals
  const summary = useMemo(() => {
    let todayGoldGrams = 0;
    let todaySilverGrams = 0;
    let todayPayout = 0;
    let todayCount = 0;
    let todayGoldValue = 0;
    let todaySilverValue = 0;

    let allGoldGrams = 0;
    let allSilverGrams = 0;
    let allPayout = 0;
    let compliantCount = 0;

    const paymentTotals: Record<'bank' | 'cheque' | 'digital' | 'cash', { count: number; amount: number }> = {
      bank: { count: 0, amount: 0 },
      cheque: { count: 0, amount: 0 },
      digital: { count: 0, amount: 0 },
      cash: { count: 0, amount: 0 },
    };

    const purityTotals: Record<string, { label: string; grams: number; value: number; metal: 'gold' | 'silver' }> = {};

    for (const tx of transactions) {
      const txKey = normalizeTxDateKey(tx);
      const isToday = txKey === todayAD || tx.dateBS === todayBS;
      const txAmount = Number(tx.grandTotalAmount) || 0;

      allPayout += txAmount;
      if (isToday) {
        todayCount += 1;
        todayPayout += txAmount;
      }

      const isCompliant = Boolean(
        tx.seller?.idNumber &&
          (tx.seller?.signatureUrl || tx.seller?.leftThumbprintUrl) &&
          tx.declaration?.isAbsoluteOwner
      );
      if (isCompliant) compliantCount += 1;

      const method = tx.payment?.method;
      if (method === 'bank_transfer') {
        paymentTotals.bank.count += 1;
        paymentTotals.bank.amount += txAmount;
      } else if (method === 'account_cheque') {
        paymentTotals.cheque.count += 1;
        paymentTotals.cheque.amount += txAmount;
      } else if (method === 'fonepay_ips') {
        paymentTotals.digital.count += 1;
        paymentTotals.digital.amount += txAmount;
      } else {
        paymentTotals.cash.count += 1;
        paymentTotals.cash.amount += txAmount;
      }

      for (const item of tx.items || []) {
        const netG = Number(item.netWeightGrams) || 0;
        const val = Number(item.totalItemValue) || 0;
        if (item.metalType === 'gold') {
          allGoldGrams += netG;
          if (isToday) {
            todayGoldGrams += netG;
            todayGoldValue += val;
          }
        } else {
          allSilverGrams += netG;
          if (isToday) {
            todaySilverGrams += netG;
            todaySilverValue += val;
          }
        }

        const pKey = `${item.metalType}:${item.purityLabel || item.purity}`;
        if (!purityTotals[pKey]) {
          purityTotals[pKey] = {
            label: item.purityLabel || (item.metalType === 'gold' ? 'Gold' : 'Silver'),
            grams: 0,
            value: 0,
            metal: item.metalType,
          };
        }
        purityTotals[pKey].grams += netG;
        purityTotals[pKey].value += val;
      }
    }

    const purityList = Object.values(purityTotals)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      todayGoldGrams,
      todaySilverGrams,
      todayPayout,
      todayCount,
      todayGoldValue,
      todaySilverValue,
      allGoldGrams,
      allSilverGrams,
      allPayout,
      totalCount: transactions.length,
      compliantCount,
      compliancePct:
        transactions.length > 0
          ? Math.round((compliantCount / transactions.length) * 100)
          : 100,
      paymentTotals,
      purityList,
    };
  }, [transactions, todayAD, todayBS]);

  // Build daily activity trend buckets for 7 / 14 / 30 days
  const trendBuckets: DailyBucket[] = useMemo(() => {
    const map = new Map<string, DailyBucket>();
    const now = new Date();

    for (let i = trendWindow - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = getLocalDateKey(d);
      const label = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      map.set(key, {
        dateKey: key,
        label,
        dateBS: key === todayAD ? todayBS : '',
        goldGrams: 0,
        silverGrams: 0,
        payout: 0,
        count: 0,
      });
    }

    for (const tx of transactions) {
      const key = normalizeTxDateKey(tx);
      const bucket = map.get(key);
      if (!bucket) continue;
      bucket.count += 1;
      bucket.payout += Number(tx.grandTotalAmount) || 0;
      if (!bucket.dateBS && tx.dateBS) {
        bucket.dateBS = tx.dateBS;
      }
      for (const item of tx.items || []) {
        const netG = Number(item.netWeightGrams) || 0;
        if (item.metalType === 'gold') {
          bucket.goldGrams += netG;
        } else {
          bucket.silverGrams += netG;
        }
      }
    }

    return Array.from(map.values());
  }, [transactions, trendWindow, todayAD, todayBS]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => (b.serialNo || 0) - (a.serialNo || 0))
      .slice(0, 6);
  }, [transactions]);

  // SVG chart dimensions & scale math
  const chartWidth = 680;
  const chartHeight = 220;
  const padLeft = 52;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 30;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const maxMetricValue = useMemo(() => {
    if (trendMetric === 'payout') {
      const max = Math.max(...trendBuckets.map((b) => b.payout), 0);
      return max > 0 ? max * 1.15 : 100000;
    }
    const max = Math.max(
      ...trendBuckets.map((b) => Math.max(b.goldGrams, b.silverGrams, b.goldGrams + b.silverGrams)),
      0
    );
    return max > 0 ? max * 1.15 : 50;
  }, [trendBuckets, trendMetric]);

  const goldTolaSummary = gramsToTolaLal(summary.todayGoldGrams);
  const silverTolaSummary = gramsToTolaLal(summary.todaySilverGrams);

  const totalMetalValueForDonut = summary.allGoldGrams * (rates.chhapawalGoldPerTola / 11.6638) +
    summary.allSilverGrams * (rates.fineSilverPerTola / 11.6638);
  const goldPctOfAllWeight =
    summary.allGoldGrams + summary.allSilverGrams > 0
      ? Math.round((summary.allGoldGrams / (summary.allGoldGrams + summary.allSilverGrams)) * 100)
      : 0;
  const silverPctOfAllWeight =
    summary.allGoldGrams + summary.allSilverGrams > 0 ? 100 - goldPctOfAllWeight : 0;

  const activeHover =
    hoveredDayIndex !== null && trendBuckets[hoveredDayIndex]
      ? trendBuckets[hoveredDayIndex]
      : null;

  const paymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank / RTGS';
      case 'account_cheque':
        return 'A/C Cheque';
      case 'fonepay_ips':
        return 'Fonepay / IPS';
      default:
        return 'Cash';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Strip & Live Rates Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900 font-serif tracking-tight">
            दैनिक खरिद ड्यासबोर्ड (Daily Bullion Dashboard)
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-1">
            <span>{shop.nameNepali || 'पसल विवरण सेटअप'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">आज: {todayBS} ({todayAD})</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              छापावाल: {formatNPR(rates.chhapawalGoldPerTola)}/Tola
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onViewRegister}
            className="px-3.5 py-2 text-xs font-medium bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-600" />
            <span>View All Entries ({summary.totalCount})</span>
          </button>
          <button
            type="button"
            onClick={onNewTransaction}
            className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ New Purchase</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Strip (Today's Totals) */}
      <section aria-label="Today Summary Metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Today's Gold Purchased */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">
              आजको सुन खरिद (Today&apos;s Gold)
            </span>
            <Scale className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums tracking-tight">
              {summary.todayGoldGrams.toFixed(2)} g
            </div>
            <div className="text-xs text-neutral-500 mt-1 font-mono tabular-nums">
              {goldTolaSummary.tola} Tola {goldTolaSummary.lal.toFixed(1)} Lal
              <span aria-hidden="true" className="mx-1.5">·</span>
              All-time: {summary.allGoldGrams.toFixed(2)} g
            </div>
          </div>
        </div>

        {/* KPI 2: Today's Silver Purchased */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">
              आजको चाँदी खरिद (Today&apos;s Silver)
            </span>
            <Coins className="w-4 h-4 text-slate-600 shrink-0" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums tracking-tight">
              {summary.todaySilverGrams.toFixed(2)} g
            </div>
            <div className="text-xs text-neutral-500 mt-1 font-mono tabular-nums">
              {silverTolaSummary.tola} Tola {silverTolaSummary.lal.toFixed(1)} Lal
              <span aria-hidden="true" className="mx-1.5">·</span>
              All-time: {summary.allSilverGrams.toFixed(2)} g
            </div>
          </div>
        </div>

        {/* KPI 3: Today's Total Payout */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">
              आजको कुल भुक्तानी (Today&apos;s Payout)
            </span>
            <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums tracking-tight">
              {formatNPR(summary.todayPayout)}
            </div>
            <div className="text-xs text-neutral-500 mt-1 font-mono tabular-nums">
              All-time: {formatNPR(summary.allPayout)}
            </div>
          </div>
        </div>

        {/* KPI 4: Today's Deeds & KYC Compliance */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">
              आजका भरपाई र अनुपालन (Today&apos;s Deeds)
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums tracking-tight">
              {summary.todayCount}{' '}
              <span className="text-sm font-sans font-normal text-neutral-500">
                entries today
              </span>
            </div>
            <div className="text-xs text-neutral-500 mt-1 font-mono tabular-nums">
              Total deeds: {summary.totalCount}
              <span aria-hidden="true" className="mx-1.5">·</span>
              KYC verified: {summary.compliancePct}%
            </div>
          </div>
        </div>
      </section>

      {/* Main Analytics Grid: Trend Chart + Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Recent Activity Trend Chart */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>खरिद तथा भुक्तानी प्रवृत्ति (Recent Activity Trends)</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Daily {trendMetric === 'payout' ? 'total NPR payout' : 'net gold & silver weight (g)'} over the last {trendWindow} days
              </p>
            </div>

            {/* Interactive Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTrendMetric('payout')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    trendMetric === 'payout'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Payout (NPR)
                </button>
                <button
                  type="button"
                  onClick={() => setTrendMetric('weight')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    trendMetric === 'weight'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Weight (g)
                </button>
              </div>

              <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
                {([7, 14, 30] as TrendWindow[]).map((win) => (
                  <button
                    key={win}
                    type="button"
                    onClick={() => setTrendWindow(win)}
                    className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      trendWindow === win
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {win}D
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Canvas */}
          {transactions.length === 0 ? (
            <div className="h-[240px] border border-dashed border-neutral-200 rounded-lg bg-neutral-50/70 flex flex-col items-center justify-center p-6 text-center">
              <BarChart3 className="w-8 h-8 text-neutral-400 mb-2" />
              <p className="text-sm font-semibold text-neutral-800">
                हालसम्म कुनै खरिद रेकर्ड प्रविष्ट गरिएको छैन (No purchase activity yet)
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-md">
                नयाँ सुनचाँदी खरिद फाराम भरेर सेभ गरेपछि यहाँ दैनिक सुन/चाँदी तौल र भुक्तानीको ग्राफ स्वतः देखिनेछ।
              </p>
              <button
                type="button"
                onClick={onNewTransaction}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Log First Purchase
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Hover Telemetry Strip (Fixed height to prevent layout shift) */}
              <div className="min-h-[28px] flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600 px-1">
                {activeHover ? (
                  <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
                    <span className="font-semibold text-neutral-900">{activeHover.label}</span>
                    {activeHover.dateBS && (
                      <span className="text-neutral-500">({activeHover.dateBS})</span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{activeHover.count} deeds</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-700">Gold: {activeHover.goldGrams.toFixed(2)}g</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-600">Silver: {activeHover.silverGrams.toFixed(2)}g</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-neutral-900">{formatNPR(activeHover.payout)}</span>
                  </div>
                ) : (
                  <span className="text-neutral-400">
                    Hover any bar below to inspect daily gold, silver, and payout totals.
                  </span>
                )}

                <div className="flex items-center gap-4 text-[11px] text-neutral-600">
                  {trendMetric === 'payout' ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-amber-600 inline-block" />
                      Payout (NPR)
                    </span>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                        Gold (g)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-slate-500 inline-block" />
                        Silver (g)
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="w-full overflow-hidden">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-auto select-none"
                  role="img"
                  aria-label="Daily Bullion Purchase Activity Chart"
                >
                  {/* Y-axis horizontal gridlines & labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((step) => {
                    const y = padTop + plotH * (1 - step);
                    const val = maxMetricValue * step;
                    return (
                      <g key={step}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={chartWidth - padRight}
                          y2={y}
                          stroke="#e5e5e5"
                          strokeDasharray={step === 0 ? undefined : '3 3'}
                          strokeWidth={1}
                        />
                        <text
                          x={padLeft - 8}
                          y={y + 3}
                          textAnchor="end"
                          className="fill-neutral-400 text-[10px] font-mono"
                        >
                          {trendMetric === 'payout'
                            ? formatShortCurrency(val)
                            : `${val.toFixed(0)}g`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars */}
                  {trendBuckets.map((bucket, idx) => {
                    const slotW = plotW / trendBuckets.length;
                    const barGroupW = Math.max(8, Math.min(28, slotW * 0.62));
                    const xCenter = padLeft + slotW * idx + slotW / 2;
                    const xStart = xCenter - barGroupW / 2;
                    const isHovered = hoveredDayIndex === idx;

                    const showLabel =
                      trendWindow === 7 ||
                      (trendWindow === 14 && idx % 2 === 0) ||
                      (trendWindow === 30 && (idx % 5 === 0 || idx === trendBuckets.length - 1));

                    if (trendMetric === 'payout') {
                      const barH = Math.max(
                        bucket.payout > 0 ? 3 : 0,
                        (bucket.payout / maxMetricValue) * plotH
                      );
                      const y = padTop + plotH - barH;
                      return (
                        <g
                          key={bucket.dateKey}
                          onMouseEnter={() => setHoveredDayIndex(idx)}
                          onMouseLeave={() => setHoveredDayIndex(null)}
                          className="cursor-pointer"
                        >
                          <rect
                            x={padLeft + slotW * idx}
                            y={padTop}
                            width={slotW}
                            height={plotH}
                            fill={isHovered ? 'rgba(217, 119, 6, 0.06)' : 'transparent'}
                          />
                          <rect
                            x={xStart}
                            y={y}
                            width={barGroupW}
                            height={barH}
                            rx={3}
                            fill={isHovered ? '#b45309' : '#d97706'}
                          />
                          {showLabel && (
                            <text
                              x={xCenter}
                              y={chartHeight - 8}
                              textAnchor="middle"
                              className="fill-neutral-500 text-[10px] font-mono"
                            >
                              {bucket.label}
                            </text>
                          )}
                        </g>
                      );
                    }

                    // Stacked or dual bar for Gold & Silver weight
                    const goldH = Math.max(
                      bucket.goldGrams > 0 ? 3 : 0,
                      (bucket.goldGrams / maxMetricValue) * plotH
                    );
                    const silverH = Math.max(
                      bucket.silverGrams > 0 ? 3 : 0,
                      (bucket.silverGrams / maxMetricValue) * plotH
                    );
                    const halfW = Math.max(4, barGroupW / 2 - 1);

                    return (
                      <g
                        key={bucket.dateKey}
                        onMouseEnter={() => setHoveredDayIndex(idx)}
                        onMouseLeave={() => setHoveredDayIndex(null)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={padLeft + slotW * idx}
                          y={padTop}
                          width={slotW}
                          height={plotH}
                          fill={isHovered ? 'rgba(15, 23, 42, 0.04)' : 'transparent'}
                        />
                        <rect
                          x={xCenter - halfW - 1}
                          y={padTop + plotH - goldH}
                          width={halfW}
                          height={goldH}
                          rx={2}
                          fill={isHovered ? '#b45309' : '#f59e0b'}
                        />
                        <rect
                          x={xCenter + 1}
                          y={padTop + plotH - silverH}
                          width={halfW}
                          height={silverH}
                          rx={2}
                          fill={isHovered ? '#334155' : '#64748b'}
                        />
                        {showLabel && (
                          <text
                            x={xCenter}
                            y={chartHeight - 8}
                            textAnchor="middle"
                            className="fill-neutral-500 text-[10px] font-mono"
                          >
                            {bucket.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Metal Mix & Payment Breakdown */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              धातु र भुक्तानी अनुपात (Portfolio &amp; Payout Mix)
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Distribution across all {summary.totalCount} recorded entries
            </p>
          </div>

          {/* Gold vs Silver Donut + Ratio */}
          <div className="flex items-center gap-4 pb-4 border-b border-neutral-100">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="14"
                />
                {summary.allGoldGrams + summary.allSilverGrams > 0 && (
                  <>
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="14"
                      strokeDasharray={`${2 * Math.PI * 38}`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="14"
                      strokeDasharray={`${(goldPctOfAllWeight / 100) * (2 * Math.PI * 38)} ${2 * Math.PI * 38}`}
                      strokeDashoffset="0"
                    />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold font-mono tabular-nums text-neutral-900">
                  {goldPctOfAllWeight}%
                </span>
                <span className="text-[9px] text-neutral-500">Gold wt</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-neutral-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-600 inline-block" />
                  सुन (Gold)
                </span>
                <span className="font-mono tabular-nums text-neutral-900 font-semibold">
                  {summary.allGoldGrams.toFixed(2)} g ({goldPctOfAllWeight}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-neutral-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-500 inline-block" />
                  चाँदी (Silver)
                </span>
                <span className="font-mono tabular-nums text-neutral-900 font-semibold">
                  {summary.allSilverGrams.toFixed(2)} g ({silverPctOfAllWeight}%)
                </span>
              </div>
              <div className="pt-1 text-[11px] text-neutral-500 font-mono tabular-nums">
                Est. spot value: {formatNPR(totalMetalValueForDonut)}
              </div>
            </div>
          </div>

          {/* Payment Method Distribution Bars */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-neutral-800">
              भुक्तानी माध्यम विवरण (Payment Channels)
            </div>
            {[
              {
                key: 'bank',
                label: 'Bank Transfer / RTGS',
                color: 'bg-emerald-600',
                data: summary.paymentTotals.bank,
              },
              {
                key: 'digital',
                label: 'Fonepay / ConnectIPS',
                color: 'bg-blue-600',
                data: summary.paymentTotals.digital,
              },
              {
                key: 'cheque',
                label: 'Account Payee Cheque',
                color: 'bg-indigo-600',
                data: summary.paymentTotals.cheque,
              },
              {
                key: 'cash',
                label: 'Cash (नगद)',
                color: 'bg-amber-600',
                data: summary.paymentTotals.cash,
              },
            ].map((row) => {
              const pct =
                summary.allPayout > 0
                  ? Math.round((row.data.amount / summary.allPayout) * 100)
                  : 0;
              return (
                <div key={row.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-700">{row.label}</span>
                    <span className="font-mono tabular-nums text-neutral-900">
                      {formatNPR(row.data.amount)}{' '}
                      <span className="text-neutral-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${row.color} transition-all duration-200`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top Purity Breakdown (quiet list) */}
          {summary.purityList.length > 0 && (
            <div className="pt-3 border-t border-neutral-100 space-y-2">
              <div className="text-xs font-semibold text-neutral-800">
                प्रमुख शुद्धता वर्ग (By Purity)
              </div>
              <div className="space-y-1.5">
                {summary.purityList.map((p) => (
                  <div
                    key={p.label}
                    className="flex items-center justify-between text-xs text-neutral-600"
                  >
                    <span className="truncate pr-2">{p.label}</span>
                    <span className="font-mono tabular-nums text-neutral-900 shrink-0">
                      {p.grams.toFixed(2)} g
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recent Purchase Activity Table */}
      <section className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              हालका खरिद प्रविष्टिहरू (Recent Purchase Activity)
            </h3>
            <p className="text-xs text-neutral-500">
              Latest entries recorded in your shop register
            </p>
          </div>
          {transactions.length > 0 && (
            <button
              type="button"
              onClick={onViewRegister}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Open Full Audit Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            अहिलेसम्म कुनै पनि खरिद प्रविष्टि छैन। नयाँ खरिद प्रविष्टि गर्न <button type="button" onClick={onNewTransaction} className="text-amber-700 font-semibold hover:underline cursor-pointer">Buy Form</button> मा जानुहोस्।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                  <th className="py-2.5 px-4 whitespace-nowrap">Serial / Voucher</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Date</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Seller</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Items</th>
                  <th className="py-2.5 px-4 whitespace-nowrap text-right">Net Weight</th>
                  <th className="py-2.5 px-4 whitespace-nowrap text-right">Payout</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Payment</th>
                  <th className="py-2.5 px-4 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-neutral-50/80 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono tabular-nums whitespace-nowrap">
                      <div className="font-semibold text-neutral-900">
                        {tx.contractSerialNumber || `#${tx.serialNo}`}
                      </div>
                      <div className="text-[11px] text-neutral-500">{tx.voucherNumber}</div>
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums whitespace-nowrap text-neutral-700">
                      <div>{tx.dateBS}</div>
                      <div className="text-[11px] text-neutral-400">{tx.dateAD}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-neutral-900 truncate max-w-[180px]">
                        {tx.seller.fullNameNepali || tx.seller.fullNameEnglish || '—'}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
                        {tx.seller.mobileNumber || tx.seller.idNumber}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="text-neutral-800 truncate max-w-[200px]">
                        {tx.items.map((i) => i.itemName).filter(Boolean).join(', ') || 'Bullion'}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {tx.items.some((i) => i.metalType === 'gold') && 'Gold'}
                        {tx.items.some((i) => i.metalType === 'gold') &&
                          tx.items.some((i) => i.metalType === 'silver') &&
                          ' + '}
                        {tx.items.some((i) => i.metalType === 'silver') && 'Silver'}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums whitespace-nowrap text-neutral-900">
                      {(Number(tx.totalNetGrams) || 0).toFixed(2)} g
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums whitespace-nowrap font-semibold text-neutral-900">
                      {formatNPR(Number(tx.grandTotalAmount) || 0)}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap text-neutral-700">
                      {paymentMethodLabel(tx.payment.method)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewDeed(tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-amber-700 hover:bg-amber-50 border border-neutral-200 rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Deed</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
