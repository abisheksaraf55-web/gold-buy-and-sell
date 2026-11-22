import React, { useState } from 'react';
import { PurchaseTransaction } from '../types/bullion';
import { formatNPR, toNepaliDigits } from '../utils/nepalBullionCalculations';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  ShieldCheck, 
  AlertCircle,
  Calendar,
  Scale,
  CreditCard,
  User,
  Phone,
  FileCheck2,
  Trash2,
  X,
  FileText,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { removeTransaction } from '../services/dataStorageService';

interface PoliceAuditRegisterProps {
  transactions: PurchaseTransaction[];
  onViewDeed: (tx: PurchaseTransaction) => void;
  onNewTransaction: () => void;
  onRefreshData?: () => void;
}

export const PoliceAuditRegister: React.FC<PoliceAuditRegisterProps> = ({
  transactions,
  onViewDeed,
  onNewTransaction,
  onRefreshData,
}) => {
  // Search and Advanced Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [metalFilter, setMetalFilter] = useState<'all' | 'gold' | 'silver'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'bank' | 'cash'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'verified' | 'partial'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Quick View Modal
  const [quickViewTx, setQuickViewTx] = useState<PurchaseTransaction | null>(null);

  // Extract unique districts from transactions
  const uniqueDistricts = Array.from(
    new Set(
      transactions
        .map((t) => t.seller.issuedDistrict || t.seller.district)
        .filter(Boolean)
    )
  );

  // Normalize Nepali Devanagari numerals (०-९) -> ASCII (0-9) so search matches both scripts
  const normalizeDigits = (value: string): string => {
    const nepaliDigits = '०१२३४५६७८९';
    return value.replace(/[०-९]/g, (ch) => String(nepaliDigits.indexOf(ch)));
  };

  // Extract YYYY-MM-DD AD date from a transaction (with createdAt fallback)
  const getTransactionDateAD = (tx: PurchaseTransaction): string => {
    const raw = (tx.dateAD || '').trim().replace(/\//g, '-');
    const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    if (tx.createdAt) {
      const createdMatch = tx.createdAt.trim().match(/^(\d{4}-\d{2}-\d{2})/);
      if (createdMatch) return createdMatch[1];
    }
    return '';
  };

  // Filtered transactions with comprehensive multi-attribute search & date range filter
  const filtered = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase().trim();
    const qNormalized = normalizeDigits(q);
    const qPhoneDigits = qNormalized.replace(/[\s\-+()]/g, '');
    const txPhoneNormalized = normalizeDigits(tx.seller.mobileNumber || '').replace(/[\s\-+()]/g, '');
    const txDateBSNormalized = normalizeDigits((tx.dateBS || '').toLowerCase());
    const txDateAD = getTransactionDateAD(tx);

    // Search across seller name (NP & EN), phone number, dates (BS & AD), serial, voucher, ID, items, address, hash
    const matchesSearch = !q || (
      (tx.contractSerialNumber && tx.contractSerialNumber.toLowerCase().includes(q)) ||
      (tx.voucherNumber && tx.voucherNumber.toLowerCase().includes(q)) ||
      (tx.seller.fullNameNepali && tx.seller.fullNameNepali.toLowerCase().includes(q)) ||
      (tx.seller.fullNameEnglish && tx.seller.fullNameEnglish.toLowerCase().includes(q)) ||
      (tx.seller.idNumber && normalizeDigits(tx.seller.idNumber.toLowerCase()).includes(qNormalized)) ||
      (tx.seller.mobileNumber && (
        tx.seller.mobileNumber.includes(q) ||
        (qPhoneDigits.length > 0 && txPhoneNormalized.includes(qPhoneDigits))
      )) ||
      (tx.seller.fatherName && tx.seller.fatherName.toLowerCase().includes(q)) ||
      (tx.seller.grandfatherName && tx.seller.grandfatherName.toLowerCase().includes(q)) ||
      (tx.seller.currentAddress && tx.seller.currentAddress.toLowerCase().includes(q)) ||
      (tx.seller.issuedDistrict && tx.seller.issuedDistrict.toLowerCase().includes(q)) ||
      (tx.dateBS && (tx.dateBS.toLowerCase().includes(q) || txDateBSNormalized.includes(qNormalized))) ||
      (tx.dateAD && tx.dateAD.toLowerCase().includes(q)) ||
      (txDateAD && txDateAD.includes(qNormalized)) ||
      (tx.tamperVerificationHash && tx.tamperVerificationHash.toLowerCase().includes(q)) ||
      tx.items.some((item) => item.itemName.toLowerCase().includes(q) || item.purityLabel.toLowerCase().includes(q))
    );

    const matchesMetal =
      metalFilter === 'all' ||
      tx.items.some((item) => item.metalType === metalFilter);

    const matchesPayment =
      paymentFilter === 'all' ||
      (paymentFilter === 'cash' ? tx.payment.method === 'cash' : tx.payment.method !== 'cash');

    const matchesDistrict =
      districtFilter === 'all' ||
      (tx.seller.issuedDistrict && tx.seller.issuedDistrict.includes(districtFilter)) ||
      (tx.seller.district && tx.seller.district.includes(districtFilter));

    const isFullyCompliant = Boolean(
      tx.seller.idNumber && 
      (tx.seller.signatureUrl || tx.seller.leftThumbprintUrl) &&
      tx.declaration.isAbsoluteOwner
    );

    const matchesCompliance =
      complianceFilter === 'all' ||
      (complianceFilter === 'verified' ? isFullyCompliant : !isFullyCompliant);

    // Date range filtering against normalized AD YYYY-MM-DD dates
    const matchesDate =
      (!startDate || (txDateAD !== '' && txDateAD >= startDate)) &&
      (!endDate || (txDateAD !== '' && txDateAD <= endDate));

    return matchesSearch && matchesMetal && matchesPayment && matchesDistrict && matchesCompliance && matchesDate;
  });

  // Totals of filtered dataset
  const totalGoldGrams = filtered.reduce((sum, tx) => {
    return (
      sum +
      tx.items
        .filter((i) => i.metalType === 'gold')
        .reduce((s, i) => s + (Number(i.netWeightGrams) || 0), 0)
    );
  }, 0);

  const totalSilverGrams = filtered.reduce((sum, tx) => {
    return (
      sum +
      tx.items
        .filter((i) => i.metalType === 'silver')
        .reduce((s, i) => s + (Number(i.netWeightGrams) || 0), 0)
    );
  }, 0);

  const grandTotalPayout = filtered.reduce(
    (sum, tx) => sum + (Number(tx.grandTotalAmount) || 0),
    0
  );

  const resetFilters = () => {
    setSearchQuery('');
    setMetalFilter('all');
    setPaymentFilter('all');
    setDistrictFilter('all');
    setComplianceFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const exportCSV = () => {
    const headers = [
      'सम्झौता सिरीयल नं.',
      'भौचर नं.',
      'मिति (वि.सं.)',
      'बिक्रेताको नाम (नेपाली)',
      'बिक्रेताको नाम (अंग्रेजी)',
      'बाजेको नाम',
      'बाबु/पतिको नाम',
      'नागरिकता/परिचयपत्र नं.',
      'जारी जिल्ला',
      'स्थायी ठेगाना',
      'मोवाइल नं.',
      'गहना वस्तु विवरण',
      'धातुको किसिम',
      'शुद्धता',
      'कुल खुद तौल (ग्राम)',
      'तौल (तोला)',
      'भुक्तानी माध्यम',
      'कुल भुक्तानी रकम (रु.)',
      'सम्पत्ति स्रोत',
      'डिजिटल सुरक्षा कोड'
    ];

    const rows = filtered.map((tx) => [
      `"${tx.contractSerialNumber || `SN-${tx.voucherNumber}`}"`,
      `"${tx.voucherNumber}"`,
      `"${tx.dateBS}"`,
      `"${tx.seller.fullNameNepali}"`,
      `"${tx.seller.fullNameEnglish || ''}"`,
      `"${tx.seller.grandfatherName || ''}"`,
      `"${tx.seller.fatherName || tx.seller.fatherOrHusbandName || ''}"`,
      `"${tx.seller.idNumber}"`,
      `"${tx.seller.issuedDistrict}"`,
      `"${tx.seller.municipality || ''} वडा नं. ${tx.seller.wardNo || ''}, ${tx.seller.district || ''}"`,
      `"${tx.seller.mobileNumber}"`,
      `"${tx.items.map((i) => i.itemName).join('; ')}"`,
      `"${tx.items[0]?.metalType === 'gold' ? 'सुन (Gold)' : 'चाँदी (Silver)'}"`,
      `"${tx.items[0]?.purityLabel || ''}"`,
      tx.totalNetGrams.toFixed(2),
      tx.totalNetTola.toFixed(2),
      `"${tx.payment.method === 'cash' ? 'नगद' : 'बैंकिङ / डिजिटल'}"`,
      tx.grandTotalAmount,
      `"${tx.declaration.source || ''}"`,
      `"${tx.tamperVerificationHash || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nepal_bullion_register_full_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (txId: string, serial: string) => {
    if (window.confirm(`के तपाईं निश्चित हुनुहुन्छ? सिरीयल नं. ${serial} भएको सम्झौता हटाउन चाहनुहुन्छ?`)) {
      await removeTransaction(txId);
      if (onRefreshData) onRefreshData();
      if (quickViewTx?.id === txId) setQuickViewTx(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">
            खरिद सम्झौता संख्या (Records)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 tabular-nums">
              {filtered.length}
            </span>
            {filtered.length !== transactions.length && (
              <span className="text-xs text-neutral-400">
                (कुल {transactions.length} मध्ये)
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 flex items-center gap-1">
            <span>युनिक सिरीयल नम्बर सहित सुरक्षित</span>
          </div>
        </div>

        {/* Metric 2: Total Gold */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider block">
            जम्मा खरिद सुन (Total Gold)
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-amber-900 tabular-nums">
              {totalGoldGrams.toFixed(2)} g
            </span>
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            तोलामा: {(totalGoldGrams / 11.6638).toFixed(2)} तोला
          </div>
        </div>

        {/* Metric 3: Total Silver */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block">
            जम्मा खरिद चाँदी (Total Silver)
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {totalSilverGrams.toFixed(2)} g
            </span>
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            तोलामा: {(totalSilverGrams / 11.6638).toFixed(2)} तोला
          </div>
        </div>

        {/* Metric 4: Total Payout */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">
            कुल भुक्तानी रकम (Total Payout)
          </span>
          <div className="mt-1">
            <span className="text-xl font-bold text-neutral-900 tabular-nums">
              {formatNPR(grandTotalPayout, true)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>कर तथा AML अडिट अनुकूल</span>
          </div>
        </div>
      </div>

      {/* Register Table Container */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Filter & Action Bar */}
        <div className="p-4 border-b border-neutral-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 border border-neutral-200">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <span>दैनिक सुनचाँदी खरिद दर्ता तथा खोज प्रणाली (All Bullion Records)</span>
                  <span className="text-[11px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-mono font-medium">
                    {filtered.length} रेकर्डहरू
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-500">
                  नेपाल प्रहरी, राजस्व अनुसन्धान तथा सम्पत्ति शुद्धीकरण (AML) कानुनी मापदण्ड अनुसार
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Advanced Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showAdvancedFilters || metalFilter !== 'all' || paymentFilter !== 'all' || districtFilter !== 'all' || complianceFilter !== 'all' || Boolean(startDate || endDate)
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>फिल्टर (Filters)</span>
              </button>

              {/* Export CSV */}
              <button
                type="button"
                onClick={exportCSV}
                className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="प्रहरी वा अडिट प्रयोजनका लागि एक्सेल/CSV फाइल डाउनलोड गर्नुहोस्"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              {/* New Button */}
              <button
                type="button"
                onClick={onNewTransaction}
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                + नयाँ खरिद फाराम
              </button>
            </div>
          </div>

          {/* Primary Search & Date Range Filter Bar (Always Visible) */}
          <div className="pt-3 border-t border-neutral-100 flex flex-col lg:flex-row lg:items-end gap-3">
            {/* Search by Seller Name, Phone, Date, Serial, ID */}
            <div className="flex-1 min-w-0">
              <label
                htmlFor="audit-register-search"
                className="block text-[11px] font-medium text-neutral-600 mb-1"
              >
                खोजी (Search by Seller Name, Phone Number, Date, Serial or ID)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="audit-register-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="बिक्रेताको नाम, फोन नं., मिति (२०८३/... वा 2026-...), सिरीयल वा नागरिकता नं. खोज्नुहोस्..."
                  className="w-full pl-9 pr-8 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-neutral-50 focus:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search query"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Date Range Filter (From - To) */}
            <div className="flex flex-wrap sm:flex-nowrap items-end gap-2 shrink-0">
              <div>
                <label
                  htmlFor="audit-date-from"
                  className="block text-[11px] font-medium text-neutral-600 mb-1"
                >
                  देखि मिति (From Date)
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="audit-date-from"
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-8 pr-2.5 py-2 text-xs font-mono tabular-nums border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="audit-date-to"
                  className="block text-[11px] font-medium text-neutral-600 mb-1"
                >
                  सम्म मिति (To Date)
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="audit-date-to"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-8 pr-2.5 py-2 text-xs font-mono tabular-nums border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  />
                </div>
              </div>

              {(startDate || endDate || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-2.5 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="खोज र मिति फिल्टर हटाउनुहोस् (Clear search & dates)"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filter Row (Collapsible) */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-neutral-200 grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-neutral-50/70 p-3 rounded-lg text-xs">
              {/* Metal Filter */}
              <div>
                <label className="text-[10px] font-medium text-neutral-500 uppercase block mb-1">
                  धातुको प्रकार (Metal)
                </label>
                <select
                  value={metalFilter}
                  onChange={(e) => setMetalFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                >
                  <option value="all">सबै धातु (All Metals)</option>
                  <option value="gold">सुन मात्र (Gold)</option>
                  <option value="silver">चाँदी मात्र (Silver)</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div>
                <label className="text-[10px] font-medium text-neutral-500 uppercase block mb-1">
                  भुक्तानी माध्यम (Payment)
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                >
                  <option value="all">सबै भुक्तानी (All Modes)</option>
                  <option value="bank">बैंकिङ / डिजिटल (Bank/Cheque)</option>
                  <option value="cash">नगद (Cash)</option>
                </select>
              </div>

              {/* District Filter */}
              <div>
                <label className="text-[10px] font-medium text-neutral-500 uppercase block mb-1">
                  जिल्ला (District)
                </label>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                >
                  <option value="all">सबै जिल्ला (All Districts)</option>
                  {uniqueDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Compliance Status */}
              <div>
                <label className="text-[10px] font-medium text-neutral-500 uppercase block mb-1">
                  कानुनी प्रमाणीकरण (KYC Status)
                </label>
                <select
                  value={complianceFilter}
                  onChange={(e) => setComplianceFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                >
                  <option value="all">सबै स्थिति (All Status)</option>
                  <option value="verified">सुरक्षित प्रमाणित (Full KYC)</option>
                  <option value="partial">आंशिक विवरण (Partial)</option>
                </select>
              </div>

              {/* Reset Filters */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-neutral-600 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>फिल्टर रिसेट (Clear)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-neutral-400">
              <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm font-semibold text-neutral-700">कुनै खरिद विवरण भेटिएन (No Records Found)</p>
              <p className="text-xs text-neutral-400 mt-1">
                खोज शब्द परिवर्तन गर्नुहोस् वा नयाँ खरिद दर्ता गर्न "+ नयाँ खरिद फाराम" थिच्नुहोस्।
              </p>
              {(searchQuery || startDate || endDate || metalFilter !== 'all' || paymentFilter !== 'all' || districtFilter !== 'all' || complianceFilter !== 'all') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer"
                >
                  सबै खोज फिल्टर हटाउनुहोस् (Reset Filters)
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50/90 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3.5 align-middle">सिरीयल नं. / भौचर</th>
                  <th className="py-3 px-3.5 align-middle">मिति & समय</th>
                  <th className="py-3 px-3.5 align-middle">बिक्रेताको विवरण (Seller KYC)</th>
                  <th className="py-3 px-3.5 align-middle">नागरिकता / परिचयपत्र</th>
                  <th className="py-3 px-3.5 align-middle">सम्पर्क / ठेगाना</th>
                  <th className="py-3 px-3.5 align-middle">गहना & धातु विवरण</th>
                  <th className="py-3 px-3.5 align-middle text-right">खुद तौल</th>
                  <th className="py-3 px-3.5 align-middle text-right">कुल भुक्तानी</th>
                  <th className="py-3 px-3.5 align-middle text-center">प्रमाणीकरण</th>
                  <th className="py-3 px-3.5 align-middle text-right">कार्य (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((tx) => {
                  const hasId = Boolean(tx.seller.idNumber);
                  const hasBiometrics = Boolean(tx.seller.signatureUrl || tx.seller.leftThumbprintUrl);
                  const isGold = tx.items.some((i) => i.metalType === 'gold');

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-amber-50/40 transition-colors group"
                    >
                      {/* Serial / Voucher */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="font-mono font-bold text-neutral-900 flex items-center gap-1.5">
                          <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-amber-200">
                            {tx.contractSerialNumber || `SN-${tx.voucherNumber}`}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-neutral-400 mt-0.5">
                          {tx.voucherNumber}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="font-medium text-neutral-900">{tx.dateBS}</div>
                        <div className="text-[10px] text-neutral-400">
                          {tx.dateAD} {tx.time && `• ${tx.time}`}
                        </div>
                      </td>

                      {/* Seller */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="font-bold text-neutral-900">
                          {tx.seller.fullNameNepali}
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate max-w-[180px]">
                          {tx.seller.fullNameEnglish || ''}
                        </div>
                        {(tx.seller.fatherName || tx.seller.grandfatherName) && (
                          <div className="text-[10px] text-neutral-400">
                            बाबु: {tx.seller.fatherName || '-'}
                          </div>
                        )}
                      </td>

                      {/* Citizenship */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="font-mono text-neutral-900 font-medium">
                          {tx.seller.idNumber || 'अनुपलब्ध'}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {tx.seller.issuedDistrict || 'जारी जिल्ला खुलाइएको छैन'}
                        </div>
                      </td>

                      {/* Contact / Address */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="font-mono text-neutral-800 text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <span>{tx.seller.mobileNumber || '-'}</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 truncate max-w-[160px]">
                          {tx.seller.district || tx.seller.currentAddress || '-'}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="font-medium text-neutral-800 flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isGold ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                          />
                          <span className="truncate max-w-[160px]">
                            {tx.items.map((i) => i.itemName).join(', ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {tx.items[0]?.purityLabel} • {tx.items.length} वस्तु
                        </div>
                      </td>

                      {/* Weight */}
                      <td className="py-3 px-3.5 align-middle text-right tabular-nums">
                        <div className="font-bold text-neutral-900">
                          {tx.totalNetGrams.toFixed(2)} g
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          ({tx.totalNetTola.toFixed(2)} तोला)
                        </div>
                      </td>

                      {/* Payout */}
                      <td className="py-3 px-3.5 align-middle text-right tabular-nums">
                        <div className="font-bold text-neutral-900">
                          {formatNPR(tx.grandTotalAmount, true)}
                        </div>
                        <div className="text-[10px] uppercase font-semibold text-neutral-500">
                          {tx.payment.method === 'cash' ? 'नगद' : 'बैंकिङ'}
                        </div>
                      </td>

                      {/* Compliance Status */}
                      <td className="py-3 px-3.5 align-middle text-center">
                        {hasId && hasBiometrics ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            सुरक्षित
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            आंशिक
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 align-middle text-right space-x-1 whitespace-nowrap">
                        {/* Quick View */}
                        <button
                          type="button"
                          onClick={() => setQuickViewTx(tx)}
                          className="px-2 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="त्वरित विवरण हेर्नुहोस् (Quick View)"
                        >
                          <FileText className="w-3.5 h-3.5 text-neutral-600" />
                          <span className="hidden lg:inline">विवरण</span>
                        </button>

                        {/* View Full Legal Deed */}
                        <button
                          type="button"
                          onClick={() => onViewDeed(tx)}
                          className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded transition-colors inline-flex items-center gap-1 cursor-pointer border border-amber-200"
                          title="सक्कल कानुनी भरपाई हेर्नुहोस् तथा प्रिन्ट गर्नुहोस्"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-800" />
                          <span>भरपाई</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Record Inspection Modal */}
      {quickViewTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200">
            {/* Modal Header */}
            <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    खरिद सम्झौता विवरण: {quickViewTx.contractSerialNumber || quickViewTx.voucherNumber}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    दर्ता मिति: {quickViewTx.dateBS} ({quickViewTx.dateAD}) • भौचर: {quickViewTx.voucherNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickViewTx(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Seller Information */}
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                <h4 className="font-bold text-neutral-900 mb-2 flex items-center gap-1.5 text-xs">
                  <User className="w-4 h-4 text-amber-600" />
                  <span>बिक्रेताको व्यक्तिगत तथा पहिचान विवरण (KYC Details)</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-neutral-700">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">पूरा नाम:</span>
                    <strong className="text-neutral-900">{quickViewTx.seller.fullNameNepali}</strong> ({quickViewTx.seller.fullNameEnglish || '-'})
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">नागरिकता / परिचय नं.:</span>
                    <strong className="font-mono text-neutral-900">{quickViewTx.seller.idNumber}</strong> (जारी जिल्ला: {quickViewTx.seller.issuedDistrict})
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">बाबु / बाजेको नाम:</span>
                    <span>बाबु: {quickViewTx.seller.fatherName || '-'} • बाजे: {quickViewTx.seller.grandfatherName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">सम्पर्क मोवाइल नं.:</span>
                    <span className="font-mono">{quickViewTx.seller.mobileNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-neutral-500 block text-[10px]">ठेगाना:</span>
                    <span>{quickViewTx.seller.municipality || ''} वडा नं. {quickViewTx.seller.wardNo || ''}, {quickViewTx.seller.district || ''} ({quickViewTx.seller.province || ''})</span>
                  </div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="bg-neutral-100 px-4 py-2 font-bold text-neutral-800 text-[11px] flex justify-between">
                  <span>गहना तथा धातु विवरण</span>
                  <span>{quickViewTx.items.length} वटा वस्तु</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-[10px] text-neutral-500 border-b border-neutral-200">
                    <tr>
                      <th className="p-2">क्र.सं.</th>
                      <th className="p-2">सामानको नाम</th>
                      <th className="p-2">धातु & शुद्धता</th>
                      <th className="p-2 text-right">सकल तौल (g)</th>
                      <th className="p-2 text-right">जर्ती/टाँचा (g)</th>
                      <th className="p-2 text-right">खुद तौल (g)</th>
                      <th className="p-2 text-right">रकम (रु.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {quickViewTx.items.map((item, idx) => {
                      const totalDeductions = item.deductionMode === 'direct_grams' && item.manualDeductionGrams !== undefined
                        ? item.manualDeductionGrams
                        : (item.stoneWeightGrams || 0) + (item.waxDirtWeightGrams || 0) + (item.jartiWeightGrams || 0);
                      return (
                        <tr key={item.id}>
                          <td className="p-2">{idx + 1}</td>
                          <td className="p-2 font-medium">{item.itemName}</td>
                          <td className="p-2">{item.metalType === 'gold' ? 'सुन' : 'चाँदी'} • {item.purityLabel}</td>
                          <td className="p-2 text-right tabular-nums">{item.grossWeightGrams}</td>
                          <td className="p-2 text-right tabular-nums text-red-600">-{totalDeductions.toFixed(2)}</td>
                          <td className="p-2 text-right tabular-nums font-bold">{item.netWeightGrams}</td>
                          <td className="p-2 text-right tabular-nums font-bold">{formatNPR(item.totalItemValue)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-neutral-50 font-bold border-t border-neutral-200">
                    <tr>
                      <td colSpan={5} className="p-2 text-right">जम्मा खुद तौल & कुल भुक्तानी:</td>
                      <td className="p-2 text-right tabular-nums text-neutral-900">{quickViewTx.totalNetGrams.toFixed(2)} g</td>
                      <td className="p-2 text-right tabular-nums text-emerald-800">{formatNPR(quickViewTx.grandTotalAmount, true)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment and Legal Declaration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-neutral-500 block text-[10px]">भुक्तानी माध्यम:</span>
                  <span className="font-bold text-neutral-900 capitalize">
                    {quickViewTx.payment.method === 'cash' ? 'नगद भुक्तानी' : `बैंकिङ (${quickViewTx.payment.bankName || 'बैंक'})`}
                  </span>
                  {quickViewTx.payment.transactionReference && (
                    <div className="font-mono text-[10px] text-neutral-600 mt-1">
                      रेफरेन्स नं.: {quickViewTx.payment.transactionReference}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-neutral-500 block text-[10px]">सम्पत्ति आर्जन स्रोत:</span>
                  <span className="font-bold text-neutral-900">
                    {quickViewTx.declaration.source || 'व्यक्तिगत पैतृक / खरिद'}
                  </span>
                  <div className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>दफा २४४ कानुनी उद्घोष प्रमाणित</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDelete(quickViewTx.id, quickViewTx.contractSerialNumber || quickViewTx.voucherNumber)}
                className="px-3 py-1.5 text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>सम्झौता खारेज (Delete)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickViewTx(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-300 rounded-lg cursor-pointer"
                >
                  बन्द गर्नुहोस्
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onViewDeed(quickViewTx);
                    setQuickViewTx(null);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>सक्कल भरपाई हेर्नुहोस् & प्रिन्ट गर्नुहोस्</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
