/**
 * Nepal Bullion Legal Purchase & KYC System
 * Fully compliant with Nepal Muluki Criminal Code 2074 (Section 244),
 * Asset (Money) Laundering Prevention Act 2064, and FENEGOSIDA standards.
 */

import React, { useState, useEffect } from 'react';
import { 
  PurchaseTransaction, 
  ShopDetails, 
  BullionMarketRates 
} from './types/bullion';
import { 
  getStoredTransactions, 
  saveTransaction, 
  getShopDetails, 
  saveShopDetails, 
  getMarketRates, 
  saveMarketRates,
  DEFAULT_SHOP_DETAILS,
  DEFAULT_RATES
} from './utils/storage';
import { RateBoard } from './components/RateBoard';
import { BuyingForm } from './components/BuyingForm/BuyingForm';
import { LegalDeedPrint } from './components/LegalDeedPrint';
import { PoliceAuditRegister } from './components/PoliceAuditRegister';
import { LegalSafetyGuideModal } from './components/LegalSafetyGuideModal';
import { ShopSettingsModal } from './components/ShopSettingsModal';
import { DataStorageModal } from './components/DataStorageModal';
import { 
  Database,
  Cloud,
  ShieldAlert, 
  FileText, 
  BookOpen, 
  Building2, 
  PlusCircle, 
  Scale, 
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  Settings,
  ChevronRight,
  HardDrive,
  LogOut,
  Loader2
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, signOutGoogle } from './firebase';
import { LoginPage } from './components/LoginPage';
import { ShopSetupPage } from './components/ShopSetupPage';
import sealBadge from './assets/images/nepal_bullion_seal_1790317148844.jpg';
import { 
  persistTransaction, 
  fetchTransactions, 
  fetchShopDetails,
  persistShopDetails,
  fetchMarketRates,
  persistMarketRates,
  subscribeToTransactions
} from './services/dataStorageService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [view, setView] = useState<'form' | 'register' | 'deed_view'>('deed_view');
  const [transactions, setTransactions] = useState<PurchaseTransaction[]>(() => getStoredTransactions());
  const [selectedTx, setSelectedTx] = useState<PurchaseTransaction | null>(() => {
    const initial = getStoredTransactions();
    return initial.length > 0 ? initial[0] : null;
  });
  const [shop, setShop] = useState<ShopDetails>(() => getShopDetails());
  const [isCheckingShopSetup, setIsCheckingShopSetup] = useState<boolean>(true);
  const [rates, setRates] = useState<BullionMarketRates>(DEFAULT_RATES);

  // Modals & Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isShopSettingsOpen, setIsShopSettingsOpen] = useState(false);
  const [isDataStorageOpen, setIsDataStorageOpen] = useState(false);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        setIsCheckingShopSetup(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Google लगइन पपअप बन्द गरियो। कृपया पुनः प्रयास गर्नुहोस्।');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('ब्राउजरले पपअप रोक्यो (Popup Blocked)। कृपया यस साइटको लागि पपअप अनुमति दिनुहोस्।');
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError('यो डोमेन Firebase Console मा अधिकृत गरिएको छैन (Unauthorized domain)।');
      } else {
        setAuthError(err?.message || 'Google बाट लगइन गर्न सकिएन। कृपया पुनः प्रयास गर्नुहोस्।');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setIsSidebarOpen(false);
    try {
      await signOutGoogle();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  // Load from local storage and sync with Firestore only once user is authenticated
  useEffect(() => {
    if (authLoading || !user) return;

    let isCancelled = false;
    setIsCheckingShopSetup(true);

    const loadedTx = getStoredTransactions();
    setTransactions(loadedTx);
    if (loadedTx.length > 0) {
      setSelectedTx((prev) => prev || loadedTx[0]);
    }
    setShop(getShopDetails());
    setRates(getMarketRates());

    // Fetch latest from Cloud Firestore
    fetchTransactions().then((cloudTx) => {
      if (isCancelled) return;
      if (cloudTx && cloudTx.length > 0) {
        setTransactions(cloudTx);
        setSelectedTx((prev) => {
          if (!prev) return cloudTx[0];
          const updatedMatch = cloudTx.find((t) => t.id === prev.id);
          return updatedMatch || prev;
        });
      }
    });

    fetchShopDetails()
      .then((cloudShop) => {
        if (isCancelled) return;
        if (cloudShop && cloudShop.nameNepali) {
          setShop(cloudShop);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsCheckingShopSetup(false);
        }
      });

    fetchMarketRates().then((cloudRates) => {
      if (isCancelled) return;
      if (cloudRates && cloudRates.chhapawalGoldPerTola) {
        setRates(cloudRates);
      }
    });

    // Realtime listener
    const unsubscribe = subscribeToTransactions((updatedList) => {
      setTransactions(updatedList);
      if (updatedList.length > 0) {
        setSelectedTx((prev) => prev || updatedList[0]);
      }
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [authLoading, user]);

  const refreshAllData = async () => {
    const freshTx = await fetchTransactions();
    setTransactions(freshTx);
    const freshShop = await fetchShopDetails();
    setShop(freshShop);
    const freshRates = await fetchMarketRates();
    setRates(freshRates);
  };

  const handleTransactionComplete = (newTx: PurchaseTransaction) => {
    persistTransaction(newTx);
    setTransactions((prev) => [newTx, ...prev.filter((t) => t.id !== newTx.id)]);
    setSelectedTx(newTx);
    setView('deed_view');
  };

  const handleUpdateRates = (newRates: BullionMarketRates) => {
    setRates(newRates);
    persistMarketRates(newRates);
  };

  const handleSaveShopDetails = async (newShop: ShopDetails) => {
    setShop(newShop);
    await persistShopDetails(newShop);
  };

  const handleCompleteOneTimeSetup = async (updatedShop: ShopDetails) => {
    const completedShop: ShopDetails = { ...updatedShop, isSetupCompleted: true };
    setShop(completedShop);
    await persistShopDetails(completedShop);
  };

  const handleViewDeed = (tx: PurchaseTransaction) => {
    setSelectedTx(tx);
    setView('deed_view');
  };

  if (authLoading || (user && isCheckingShopSetup)) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-neutral-700">
          <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
          <p className="text-xs font-semibold tracking-wide">
            {authLoading
              ? 'प्रणाली सत्र जाँच हुँदैछ (Verifying session)...'
              : 'पसल विवरण लोड हुँदैछ (Loading shop profile)...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onSignIn={handleGoogleSignIn}
        isSigningIn={isSigningIn}
        authError={authError}
        onDismissError={() => setAuthError(null)}
      />
    );
  }

  if (!shop.isSetupCompleted) {
    return (
      <ShopSetupPage
        shop={shop}
        user={user}
        onCompleteSetup={handleCompleteOneTimeSetup}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans text-neutral-900 overflow-x-hidden">
      {/* Top Bar Contract (Print hidden) */}
      <header className="print:hidden bg-neutral-900 text-white border-b border-neutral-800 sticky top-0 z-30 w-full">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-2 sm:gap-3">
          {/* Zone 1: Wordmark / Brand with Menu Trigger */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 lg:flex-initial">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="shrink-0 p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
              title="मेनु खोल्नुहोस् (Open Side Menu)"
            >
              <Menu className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-semibold hidden xl:inline text-neutral-200">मेनु</span>
            </button>

            <img 
              src={sealBadge} 
              alt="Nepal Bullion Guild Seal" 
              className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-full border border-amber-500/50 bg-neutral-800"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white block truncate font-serif">
                नेपाल सुनचाँदी कानुनी खरिद प्रणाली
              </span>
              <span className="text-[10px] text-neutral-400 block truncate">
                {shop.nameNepali}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            <button
              onClick={() => setView('form')}
              className={`px-2.5 xl:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                view === 'form'
                  ? 'bg-amber-600 text-white'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              + नयाँ खरिद<span className="hidden xl:inline"> फाराम (Buy Form)</span>
            </button>
            <button
              onClick={() => setView('register')}
              className={`px-2.5 xl:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                view === 'register'
                  ? 'bg-amber-600 text-white'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              दैनिक दर्ता<span className="hidden xl:inline"> (Audit Register)</span>
            </button>
            {selectedTx && (
              <button
                onClick={() => setView('deed_view')}
                className={`px-2.5 xl:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  view === 'deed_view'
                    ? 'bg-amber-600 text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                हालको भरपाई<span className="hidden xl:inline"> (Current Deed)</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-700/60 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="मुलुकी अपराध संहिता दफा २४४ र मनि लाउन्डरिङ सुरक्षा नियम"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden md:inline">कानुनी सुरक्षा निर्देशिका</span>
              <span className="md:hidden">निर्देशिका</span>
            </button>

            {/* Side Menu quick button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
              title="पसल प्रोफाइल तथा डेटा भण्डारण"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">सेटिङ & डेटा</span>
            </button>

            {/* Signed-in Google account Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title={`लगआउट (${user.email || user.displayName || 'Google Account'})`}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <LogOut className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
              <span className="hidden xl:inline">लगआउट</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Side Menu Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] bg-neutral-900 text-white h-full shadow-2xl flex flex-col z-10 border-r border-neutral-800 animate-in slide-in-from-left duration-200">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img 
                  src={sealBadge} 
                  alt="Seal" 
                  className="w-8 h-8 rounded-full border border-amber-500/50 object-contain bg-neutral-800"
                />
                <div>
                  <h2 className="text-xs font-bold font-serif text-white tracking-wide">
                    मुख्य मेनु (Main Menu)
                  </h2>
                  <p className="text-[10px] text-amber-400 truncate max-w-[170px]">
                    {shop.nameNepali}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Navigation & Action Links */}
            <div className="p-4 flex-1 overflow-y-auto space-y-6 text-xs">
              {/* Primary Modules */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
                  मुख्य कार्यहरू (Modules)
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setView('form');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    view === 'form' 
                      ? 'bg-amber-600 text-white font-semibold' 
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-amber-400" />
                    <span>+ नयाँ खरिद फाराम (Buy Form)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView('register');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    view === 'register' 
                      ? 'bg-amber-600 text-white font-semibold' 
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>दैनिक खरिद दर्ता (Audit Register)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                {selectedTx && (
                  <button
                    type="button"
                    onClick={() => {
                      setView('deed_view');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                      view === 'deed_view' 
                        ? 'bg-amber-600 text-white font-semibold' 
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>हालको भरपाई (Current Deed)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                )}
              </div>

              {/* Management & Configuration (Relocated Here) */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-800">
                <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
                  पसल तथा डेटा व्यवस्थापन
                </div>

                {/* Relocated: पसल प्रोफाइल (Setup Shop) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsShopSettingsOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-neutral-800/80 hover:bg-amber-600 text-white border border-neutral-700/80 hover:border-amber-500 transition-all cursor-pointer font-medium"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <div className="text-left">
                      <span className="block font-semibold">पसल प्रोफाइल (Setup Shop)</span>
                      <span className="block text-[10px] text-neutral-400 hover:text-amber-100">
                        पसलको नाम, प्यान, छाप र हस्ताक्षर
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                {/* Relocated: डेटा भण्डारण (Data Storage) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsDataStorageOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-neutral-800/80 hover:bg-blue-600 text-white border border-neutral-700/80 hover:border-blue-500 transition-all cursor-pointer font-medium"
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-blue-400" />
                    <div className="text-left">
                      <span className="block font-semibold">डेटा भण्डारण (Data Storage)</span>
                      <span className="block text-[10px] text-neutral-400 hover:text-blue-100">
                        क्लाउड सिन्क तथा अफलाइन ब्याकअप
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                {/* कानुनी सुरक्षा निर्देशिका */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsGuideOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>कानुनी सुरक्षा निर्देशिका (Legal Guide)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>
            </div>

            {/* Sidebar Footer with Signed-in User & Sign Out */}
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

              <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-800/80">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Firestore सक्रिय</span>
                </div>
                <span className="tabular-nums">{transactions.length} सम्झौता</span>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-red-950/70 hover:text-red-200 border border-neutral-700 hover:border-red-800/70 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>लगआउट गर्नुहोस् (Sign Out)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First-time Shop Setup Encouragement Banner if not customized yet */}
      {!shop.isSetupCompleted && (
        <div className="print:hidden bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-amber-100 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 border-b border-amber-700/60 shadow-inner">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong>तपाईंको पसलको विवरण सेट गर्नुहोस्:</strong> हाल नमुना पसलको नाम छ। आफ्नै पसलको नाम, प्यान/भ्याट नं., ठेगाना र आधिकारिक छाप राख्न यहाँ थिच्नुहोस्।
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsShopSettingsOpen(true)}
            className="px-3 py-1 bg-white text-neutral-900 font-bold rounded hover:bg-amber-100 transition-colors shadow-xs text-[11px] cursor-pointer"
          >
            अहिले सेटअप गर्नुहोस् (Setup Now)
          </button>
        </div>
      )}

      {/* Mobile & Tablet Tab Bar */}
      <div className="lg:hidden print:hidden bg-neutral-800 border-b border-neutral-700 px-3 py-2 flex items-center justify-around gap-2 text-xs">
        <button
          onClick={() => setView('form')}
          className={`px-3 py-1 rounded font-medium ${
            view === 'form' ? 'bg-amber-600 text-white' : 'text-neutral-300'
          }`}
        >
          खरिद फाराम
        </button>
        <button
          onClick={() => setView('register')}
          className={`px-3 py-1 rounded font-medium ${
            view === 'register' ? 'bg-amber-600 text-white' : 'text-neutral-300'
          }`}
        >
          दर्ता किताब
        </button>
        {selectedTx && (
          <button
            onClick={() => setView('deed_view')}
            className={`px-3 py-1 rounded font-medium ${
              view === 'deed_view' ? 'bg-amber-600 text-white' : 'text-neutral-300'
            }`}
          >
            भरपाई
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6">
        {/* View 1: Buying Form */}
        {view === 'form' && (
          <BuyingForm
            rates={rates}
            shop={shop}
            existingCount={transactions.length}
            onComplete={handleTransactionComplete}
            onCancel={() => setView('register')}
          />
        )}

        {/* View 2: Police Audit Register */}
        {view === 'register' && (
          <PoliceAuditRegister
            transactions={transactions}
            onViewDeed={handleViewDeed}
            onNewTransaction={() => setView('form')}
            onRefreshData={refreshAllData}
          />
        )}

        {/* View 3: Printable Deed */}
        {view === 'deed_view' && selectedTx && (
          <LegalDeedPrint
            transaction={selectedTx}
            onBack={() => setView('register')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="print:hidden border-t border-neutral-200 bg-white py-4 px-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>नेपाल मुलुकी अपराध संहिता २०७४ दफा २४४ र सम्पत्ति शुद्धीकरण ऐन २०६४ बमोजिम प्रमाणित</span>
          </div>
          <div>
            <span>{shop.nameNepali} • प्यान: {shop.panVatNumber}</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LegalSafetyGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <ShopSettingsModal
        isOpen={isShopSettingsOpen}
        onClose={() => setIsShopSettingsOpen(false)}
        shop={shop}
        onSave={handleSaveShopDetails}
      />

      <DataStorageModal
        isOpen={isDataStorageOpen}
        onClose={() => setIsDataStorageOpen(false)}
        transactions={transactions}
        onRefreshData={refreshAllData}
      />
    </div>
  );
}
