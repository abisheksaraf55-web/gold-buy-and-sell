import React, { useState } from 'react';
import { ShopDetails } from '../types/bullion';
import { Building2, X, Check, Save } from 'lucide-react';

interface ShopSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: ShopDetails;
  onSave: (updated: ShopDetails) => void;
}

export const ShopSettingsModal: React.FC<ShopSettingsModalProps> = ({
  isOpen,
  onClose,
  shop,
  onSave,
}) => {
  const [formData, setFormData] = useState<ShopDetails>(shop);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, isSetupCompleted: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-neutral-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-neutral-900">
              पसल तथा व्यवसायी विवरण (Jeweler Shop Profile)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              पसलको नाम (नेपालीमा) *
            </label>
            <input
              type="text"
              required
              value={formData.nameNepali}
              onChange={(e) => setFormData({ ...formData, nameNepali: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500"
              placeholder="श्री अन्नपूर्ण सुनचाँदी गहना मन्दिर"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Shop Name (In English) *
            </label>
            <input
              type="text"
              required
              value={formData.nameEnglish}
              onChange={(e) => setFormData({ ...formData, nameEnglish: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500"
              placeholder="Shree Annapurna Gold & Silver Jewellers"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                प्रोपाइटर / सञ्चालकको नाम *
              </label>
              <input
                type="text"
                required
                value={formData.proprietorName}
                onChange={(e) => setFormData({ ...formData, proprietorName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                placeholder="राज कुमार सराफ"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                प्यान / भ्याट नं. (PAN / VAT No.) *
              </label>
              <input
                type="text"
                required
                value={formData.panVatNumber}
                onChange={(e) => setFormData({ ...formData, panVatNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500 tabular-nums"
                placeholder="601284912"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                व्यवसाय दर्ता नं. (Reg. No.)
              </label>
              <input
                type="text"
                value={formData.businessRegNumber}
                onChange={(e) => setFormData({ ...formData, businessRegNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                महासंघ सदस्यता नं. (FENEGOSIDA No.)
              </label>
              <input
                type="text"
                value={formData.fenegosidaMembershipNo}
                onChange={(e) => setFormData({ ...formData, fenegosidaMembershipNo: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              ठेगाना (Address) *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500"
              placeholder="न्यूरोड, काठमाडौं, नेपाल"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                सम्पर्क फोन / मोवाइल *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                इमेल ठेगाना (Email)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Shop Branding: Logo & Official Rubber Stamp */}
          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <span>पसलको छाप तथा लोगो (Official Shop Stamp & Logo)</span>
            </h4>
            <p className="text-[11px] text-amber-800">
              तपाईंको पसलको आधिकारिक रबर छाप (Official Stamp) यहाँ अपलोड गर्नुहोस्। यो प्रिन्ट हुने सबै कानुनी भरपाई र भौचरमा आधिकारिक रूपमा देखापर्नेछ।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Stamp Upload */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  पसलको छाप (Rubber Stamp / Seal Image)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 border border-neutral-300 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {formData.stampSealUrl ? (
                      <img src={formData.stampSealUrl} alt="Shop Stamp" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-[10px] text-neutral-400 text-center px-1">छाप छैन</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="shop-stamp-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setFormData((prev) => ({ ...prev, stampSealUrl: ev.target?.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="shop-stamp-upload"
                      className="px-3 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-md cursor-pointer inline-block"
                    >
                      छाप फोटो छान्नुहोस्
                    </label>
                    {formData.stampSealUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, stampSealUrl: '' }))}
                        className="block text-[11px] text-red-600 hover:underline"
                      >
                        हटाउनुहोस्
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  पसलको लोगो (Shop Logo - Optional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 border border-neutral-300 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Shop Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-[10px] text-neutral-400 text-center px-1">लोगो छैन</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="shop-logo-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setFormData((prev) => ({ ...prev, logoUrl: ev.target?.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="shop-logo-upload"
                      className="px-3 py-1.5 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 rounded-md cursor-pointer inline-block"
                    >
                      लोगो छान्नुहोस्
                    </label>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                        className="block text-[11px] text-red-600 hover:underline"
                      >
                        हटाउनुहोस्
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              रद्द गर्नुहोस्
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              विवरण सुरक्षित गर्नुहोस्
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
