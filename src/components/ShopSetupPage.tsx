import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { ShopDetails } from '../types/bullion';
import {
  Building2,
  LogOut,
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  PlusCircle,
  FileText,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ShopSettingsModal } from './ShopSettingsModal';
import sealBadge from '../assets/images/nepal_bullion_seal_1790317148844.jpg';

interface ShopSetupPageProps {
  shop: ShopDetails;
  user: User;
  onCompleteSetup: (updatedShop: ShopDetails) => Promise<void> | void;
  onNavigate?: (targetView: 'dashboard' | 'form' | 'register', updatedShop: ShopDetails) => Promise<void> | void;
  onSignOut: () => void;
}

export const ShopSetupPage: React.FC<ShopSetupPageProps> = ({
  shop,
  user,
  onCompleteSetup,
  onNavigate,
  onSignOut,
}) => {
  const [formData, setFormData] = useState<ShopDetails>(() => ({
    ...shop,
    email: shop.email || user.email || '',
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);

  const handleNavigateFromMenu = async (targetView: 'dashboard' | 'form' | 'register') => {
    setIsMenuOpen(false);
    setIsSaving(true);
    try {
      const preparedShop: ShopDetails = {
        ...formData,
        nameNepali: formData.nameNepali || 'मेरो सुनचाँदी पसल',
        nameEnglish: formData.nameEnglish || 'My Gold & Silver Jewellers',
        proprietorName: formData.proprietorName || user.displayName || '',
        email: formData.email || user.email || '',
        isSetupCompleted: true,
      };
      if (onNavigate) {
        await onNavigate(targetView, preparedShop);
      } else {
        await onCompleteSetup(preparedShop);
      }
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
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              title="मेनु खोल्नुहोस् (Open Side Menu)"
              aria-label="Open Menu"
            >
              <Menu className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Menu</span>
            </button>

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
                {formData.nameNepali || 'गृह पृष्ठ (Home Landing)'}
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

      {/* Slide-out Side Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-neutral-900 text-white h-full shadow-2xl flex flex-col z-10 border-r border-neutral-800">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={sealBadge}
                  alt="Seal"
                  className="w-8 h-8 rounded-full border border-amber-500/50 object-contain bg-neutral-800 shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-xs font-bold font-serif text-white tracking-wide">
                    मुख्य मेनु (Side Menu)
                  </h2>
                  <p className="text-[10px] text-amber-400 truncate">
                    {formData.nameNepali || 'प्रारम्भिक सेटअप'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-6 text-xs">
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
                  कार्यक्षेत्र (Workspace)
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsShopModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>खाता / पसल सेटअप (Setup Shop)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateFromMenu('form')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-amber-400" />
                    <span>नयाँ खरिद फाराम (Buy Form)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateFromMenu('dashboard')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-amber-400" />
                    <span>दैनिक ड्यासबोर्ड (Dashboard)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateFromMenu('register')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>खरिद डेटा हेर्नुहोस् (View Entries)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-3">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Account'}
                    className="w-8 h-8 rounded-full border border-neutral-700 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {user.displayName || 'अधिकृत प्रयोगकर्ता'}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onSignOut();
                }}
                className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-red-950/70 hover:text-red-200 border border-neutral-700 hover:border-red-800/70 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>लगआउट गर्नुहोस् (Sign Out)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="space-y-6">
          <aside className="space-y-6 bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                <Building2 className="w-4 h-4 text-amber-700" />
                <span>नेपाल सुनचाँदी कानुनी खरिद प्रणाली (Home)</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-serif text-balance">
                {formData.nameNepali || 'तपाईंको सुनचाँदी कारोबार व्यवस्थापन'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                नयाँ सुनचाँदी खरिद फाराम प्रविष्ट गर्न वा आजको कुल सुन/चाँदी खरिद र प्रवृत्ति चार्ट सहितको ड्यासबोर्ड हेर्न तलको विकल्प छान्नुहोस्। पसल प्रोफाइल माथिको मेनु वा तलको सेटअप बटनबाट सम्पादन गर्न सकिन्छ।
              </p>
            </div>

            {/* Home Landing Quick Actions */}
            <div className="pt-4 border-t border-neutral-200 space-y-3">
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                मुख्य कार्यहरू (Home Landing Actions)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleNavigateFromMenu('form')}
                  className="w-full px-4 py-3.5 text-left bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-xl transition-colors flex items-center justify-between gap-3 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PlusCircle className="w-5 h-5 text-white shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-xs sm:text-sm font-bold truncate">
                        Create a New Buying Form
                      </span>
                      <span className="block text-[11px] text-amber-100 truncate">
                        नयाँ सुनचाँदी खरिद फाराम खोल्नुहोस्
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleNavigateFromMenu('dashboard')}
                  className="w-full px-4 py-3.5 text-left bg-neutral-900 hover:bg-neutral-800 disabled:opacity-60 text-white rounded-xl transition-colors flex items-center justify-between gap-3 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TrendingUp className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-xs sm:text-sm font-bold truncate">
                        View Dashboard with Activity Trends Chart
                      </span>
                      <span className="block text-[11px] text-neutral-300 truncate">
                        दैनिक खरिद सारांश र प्रवृत्ति चार्ट हेर्नुहोस्
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleNavigateFromMenu('register')}
                  className="px-3.5 py-2 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>View Saved Entries (खरिद डेटा)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsShopModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Setup Account / Shop Profile</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex items-center gap-2 text-xs text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cloud Firestore र लोकल स्टोरेजमा सुरक्षित रूपमा सेभ हुन्छ</span>
            </div>
          </aside>
        </div>
      </main>

      <ShopSettingsModal
        isOpen={isShopModalOpen}
        onClose={() => setIsShopModalOpen(false)}
        shop={formData}
        onSave={async (updated) => {
          setFormData(updated);
          await onCompleteSetup(updated);
        }}
      />
    </div>
  );
};
