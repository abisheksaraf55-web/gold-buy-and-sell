import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { ShopDetails } from '../types/bullion';
import { DEFAULT_SHOP_DETAILS } from '../utils/storage';
import { Building2, CheckCircle2, LogOut, Upload, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import sealBadge from '../assets/images/nepal_bullion_seal_1790317148844.jpg';

interface ShopSetupPageProps {
  shop: ShopDetails;
  user: User;
  onCompleteSetup: (updatedShop: ShopDetails) => Promise<void> | void;
  onSignOut: () => void;
}

export const ShopSetupPage: React.FC<ShopSetupPageProps> = ({
  shop,
  user,
  onCompleteSetup,
  onSignOut,
}) => {
  const [formData, setFormData] = useState<ShopDetails>(() => ({
    ...shop,
    email:
      !shop.email || shop.email === DEFAULT_SHOP_DETAILS.email
        ? user.email || shop.email
        : shop.email,
  }));
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onCompleteSetup({
        ...formData,
        isSetupCompleted: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    setIsSaving(true);
    try {
      await onCompleteSetup({
        ...formData,
        isSetupCompleted: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col">
      {/* Top Bar */}
      <header className="bg-neutral-900 text-white border-b border-neutral-800 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={sealBadge}
              alt="Nepal Bullion Legal Seal"
              className="w-8 h-8 object-contain rounded-full border border-amber-500/50 bg-neutral-800 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <span className="text-sm font-bold tracking-tight text-white block truncate font-serif">
                नेपाल सुनचाँदी कानुनी खरिद प्रणाली
              </span>
              <span className="text-[11px] text-amber-400 block truncate">
                प्रारम्भिक पसल सेटअप (One-Time Shop Setup)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-300">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full object-cover border border-neutral-700"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <span className="max-w-[180px] truncate">{user.email}</span>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-300" />
              <span>लगआउट</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Context & Guidance Column */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                <Building2 className="w-4 h-4 text-amber-700" />
                <span>पहिलो लगइन सेटअप (Step 1 of 1)</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-serif text-balance">
                तपाईंको सुनचाँदी पसलको आधिकारिक विवरण राख्नुहोस्
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                यो एकपटक मात्र भरिने सेटअप हो। यहाँ राखिएका पसलको नाम, प्यान नं., ठेगाना र रबर छाप प्रिन्ट हुने सबै कानुनी भरपाई तथा PDF कागजातको शीर्षमा स्वतः देखापर्नेछ।
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-200 space-y-3 text-xs text-neutral-700">
              <div className="flex items-start gap-2.5">
                <span className="font-mono font-semibold text-amber-700 tabular-nums">01.</span>
                <p className="leading-relaxed">
                  पसलको नेपाली तथा अंग्रेजी नाम र स्थायी लेखा नम्बर (PAN/VAT) प्रविष्ट गर्नुहोस्।
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-mono font-semibold text-amber-700 tabular-nums">02.</span>
                <p className="leading-relaxed">
                  सञ्चालकको नाम, सम्पर्क नम्बर र ठेगाना अद्यावधिक गर्नुहोस्।
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-mono font-semibold text-amber-700 tabular-nums">03.</span>
                <p className="leading-relaxed">
                  पसलको रबर छाप र लोगो अपलोड गरी प्रणालीमा प्रवेश गर्नुहोस् (पछि मेनुबाट पनि सम्पादन गर्न सकिन्छ)।
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex items-center gap-2 text-xs text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cloud Firestore र लोकल स्टोरेजमा सुरक्षित रूपमा सेभ हुन्छ</span>
            </div>
          </aside>

          {/* Right Setup Form Card */}
          <section className="lg:col-span-8 bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    पसलको नाम (नेपालीमा) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameNepali}
                    onChange={(e) => setFormData({ ...formData, nameNepali: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                    placeholder="श्री अन्नपूर्ण सुनचाँदी गहना मन्दिर प्रा.लि."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Shop Name (In English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameEnglish}
                    onChange={(e) => setFormData({ ...formData, nameEnglish: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                    placeholder="Shree Annapurna Gold & Silver Jewellers"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    प्रोपाइटर / सञ्चालकको नाम *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.proprietorName}
                    onChange={(e) => setFormData({ ...formData, proprietorName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                    placeholder="रमेश कुमार शाक्य"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    प्यान / भ्याट नं. (PAN / VAT No.) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.panVatNumber}
                    onChange={(e) => setFormData({ ...formData, panVatNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600 tabular-nums"
                    placeholder="601284912"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    व्यवसाय दर्ता नं. (Business Reg. No.)
                  </label>
                  <input
                    type="text"
                    value={formData.businessRegNumber}
                    onChange={(e) => setFormData({ ...formData, businessRegNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    महासंघ सदस्यता नं. (FENEGOSIDA No.)
                  </label>
                  <input
                    type="text"
                    value={formData.fenegosidaMembershipNo}
                    onChange={(e) =>
                      setFormData({ ...formData, fenegosidaMembershipNo: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  पसलको पूरा ठेगाना (Address) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                  placeholder="न्यूरोड, वडा नं. २२, काठमाडौं, नेपाल"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    सम्पर्क फोन / मोवाइल *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    इमेल ठेगाना (Email)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>

              {/* Official Stamp & Logo Upload */}
              <div className="pt-4 border-t border-neutral-200 space-y-3">
                <div>
                  <h2 className="text-xs font-bold text-neutral-900">
                    पसलको आधिकारिक छाप तथा लोगो (Official Stamp &amp; Logo - Optional)
                  </h2>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    प्रिन्ट र PDF भरपाईको मुहर स्थानमा पसलको रबर छाप स्वतः राखिन्छ।
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stamp Upload */}
                  <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-xl bg-neutral-50/70">
                    <div className="w-16 h-16 border border-neutral-300 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {formData.stampSealUrl ? (
                        <img
                          src={formData.stampSealUrl}
                          alt="Shop Stamp"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-[10px] text-neutral-400 text-center px-1">
                          छाप छैन
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <span className="block text-[11px] font-semibold text-neutral-800">
                        पसलको रबर छाप (Stamp)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        id="setup-stamp-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setFormData((prev) => ({
                                ...prev,
                                stampSealUrl: ev.target?.result as string,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="setup-stamp-upload"
                        className="px-2.5 py-1 text-[11px] font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-md cursor-pointer inline-flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>छाप छान्नुहोस्</span>
                      </label>
                      {formData.stampSealUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, stampSealUrl: '' }))}
                          className="block text-[11px] text-red-600 hover:underline cursor-pointer"
                        >
                          हटाउनुहोस्
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-xl bg-neutral-50/70">
                    <div className="w-16 h-16 border border-neutral-300 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Shop Logo"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-[10px] text-neutral-400 text-center px-1">
                          लोगो छैन
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <span className="block text-[11px] font-semibold text-neutral-800">
                        पसलको लोगो (Logo)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        id="setup-logo-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setFormData((prev) => ({
                                ...prev,
                                logoUrl: ev.target?.result as string,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="setup-logo-upload"
                        className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-md cursor-pointer inline-flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>लोगो छान्नुहोस्</span>
                      </label>
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                          className="block text-[11px] text-red-600 hover:underline cursor-pointer"
                        >
                          हटाउनुहोस्
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSkip}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                >
                  अहिले स्किप गर्नुहोस् (Skip Setup)
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>सुरक्षित हुँदैछ...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>सेटअप पूरा गरी प्रणाली सुरु गर्नुहोस् (Save &amp; Continue)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};
