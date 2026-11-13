import React from 'react';
import { ShieldCheck, Loader2, AlertCircle, Lock } from 'lucide-react';
import sealBadge from '../assets/images/nepal_bullion_seal_1790317148844.jpg';

interface LoginPageProps {
  onSignIn: () => Promise<void>;
  isSigningIn: boolean;
  authError: string | null;
  onDismissError?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSignIn,
  isSigningIn,
  authError,
  onDismissError,
}) => {
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 grid grid-cols-1 lg:grid-cols-12">
      {/* Left Institutional Brand & Compliance Panel */}
      <section className="lg:col-span-6 bg-neutral-900 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3.5">
            <img
              src={sealBadge}
              alt="Nepal Bullion Legal System Seal"
              className="w-12 h-12 object-contain rounded-full border border-amber-500/50 bg-neutral-800 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold tracking-tight text-white font-serif truncate">
                नेपाल सुनचाँदी कानुनी खरिद प्रणाली
              </p>
              <p className="text-xs text-amber-400 font-medium truncate">
                Nepal Bullion Legal Purchase &amp; KYC System
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-neutral-800">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-snug text-balance font-serif">
              प्रमाणित खरिद भरपाई, नागरिकता अभिलेख र प्रहरी अडिट दर्ता
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed max-w-xl">
              सुनचाँदी व्यवसायीहरूका लागि मुलुकी अपराध संहिता २०७४ तथा सम्पत्ति शुद्धीकरण निवारण ऐन २०६४ बमोजिम सुरक्षित खरिद सम्झौता, डिजिटल औंठाछाप र क्लाउड अभिलेख व्यवस्थापन।
            </p>
          </div>

          <div className="space-y-4 pt-2 max-w-xl">
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono font-semibold text-amber-400 pt-0.5 tabular-nums">
                01.
              </span>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                नागरिकता, राष्ट्रिय परिचयपत्र र राहदानीको आयताकार क्रप तथा स्वचालित AI KYC पहिचान।
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono font-semibold text-amber-400 pt-0.5 tabular-nums">
                02.
              </span>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                तीन पुस्ते विवरण, तोला-आना-लाल शुद्ध तौल हिसाब र A4 कानुनी भरपाई PDF निर्यात।
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono font-semibold text-amber-400 pt-0.5 tabular-nums">
                03.
              </span>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Google खाताबाट प्रमाणित लगइनपछि मात्र कारोबार दर्ता पुस्तिका र पसल प्रोफाइलमा पहुँच।
              </p>
            </div>
          </div>
        </div>

        <div className="pt-10 mt-10 border-t border-neutral-800 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>मुलुकी अपराध संहिता २०७४ दफा २४४</span>
          <span aria-hidden="true">·</span>
          <span>सम्पत्ति शुद्धीकरण ऐन २०६४</span>
          <span aria-hidden="true">·</span>
          <span>A4 कानुनी अभिलेख</span>
        </div>
      </section>

      {/* Right Google Sign-In Panel */}
      <main className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-neutral-50">
        <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-8 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>अधिकृत पसल लगइन (Authorized Access)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-serif">
              Google खाताबाट लगइन गर्नुहोस्
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              तपाईंको पसलको खरिद भरपाई, ग्राहक KYC अभिलेख र क्लाउड डेटाबेस सुरक्षित रूपमा खोल्न Google मार्फत साइन इन गर्नुहोस्।
            </p>
          </div>

          {authError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold">लगइन असफल भयो (Sign-In Error)</p>
                <p className="text-red-800 leading-relaxed">{authError}</p>
              </div>
              {onDismissError && (
                <button
                  type="button"
                  onClick={onDismissError}
                  className="text-red-700 hover:text-red-950 font-semibold cursor-pointer px-1"
                  aria-label="त्रुटि हटाउनुहोस्"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <div className="space-y-4">
            <button
              type="button"
              onClick={onSignIn}
              disabled={isSigningIn}
              className="w-full min-h-[48px] px-5 py-3 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-3 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-amber-400 shrink-0" />
                  <span>Google बाट प्रमाणित हुँदैछ...</span>
                </>
              ) : (
                <>
                  <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      aria-hidden="true"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </span>
                  <span className="whitespace-nowrap">Continue with Google (Google लगइन)</span>
                </>
              )}
            </button>

            <div className="pt-4 border-t border-neutral-200 space-y-2 text-xs text-neutral-500">
              <div className="flex items-center gap-2 text-neutral-700 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>सुरक्षित Google OAuth प्रमाणीकरण</span>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-500">
                लगइन गरेपछि तपाईंको पसल प्रोफाइल, सुनचाँदी दर, र दैनिक खरिद अभिलेख Cloud Firestore मार्फत सुरक्षित रूपमा सिन्क हुन्छ।
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
