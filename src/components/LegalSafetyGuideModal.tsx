import React from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  X, 
  BookOpen, 
  FileText,
  BadgeAlert,
  Coins
} from 'lucide-react';

interface LegalSafetyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalSafetyGuideModal: React.FC<LegalSafetyGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs px-6 py-4 border-b border-neutral-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                नेपाल सुनचाँदी खरिद कानुनी सुरक्षा निर्देशिका
              </h2>
              <p className="text-xs text-neutral-500">
                मुलुकी अपराध संहिता, सम्पत्ति शुद्धीकरण ऐन र महासंघ निर्देशिकाबाट व्यवसायीको सुरक्षा
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-sm text-neutral-700">
          {/* Critical Law 1: Muluki Criminal Code Section 244 */}
          <div className="p-4 bg-red-50/60 border border-red-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-red-900 font-semibold">
              <Scale className="w-4 h-4 text-red-700" />
              <span>१. मुलुकी अपराध संहिता २०७४, दफा २४४ (चोरीको माल किन्ने कसूर)</span>
            </div>
            <p className="text-xs text-red-800 leading-relaxed">
              <strong>कानुनी जोखिम:</strong> यदि कसैले चोरी वा लुटपाट गरेको सुनचाँदी पसलमा बेच्यो र प्रहरीले अनुसन्धान गर्दा तपाईंले विना परिचयपत्र वा विना भरपाई खरिद गरेको भेटियो भने, दफा २४४ अनुसार ३ वर्षसम्म कैद वा ३० हजार रुपैयाँ जरिवाना वा दुवै सजाय हुन सक्छ।
            </p>
            <div className="text-xs text-neutral-800 bg-white p-3 rounded-lg border border-red-100 space-y-1">
              <span className="font-semibold text-emerald-800 block">यो फारामले कसरी सुरक्षा दिन्छ:</span>
              <ul className="list-disc list-inside space-y-1 text-neutral-600">
                <li>बिक्रेताको सक्कल नागरिकता वा राष्ट्रिय परिचयपत्रको नम्बर र जारी जिल्ला अनिवार्य प्रमाणीकरण गरिन्छ।</li>
                <li>बिक्रेताले कानुन बमोजिम स्वघोषणा (Affidavit of Title) मा सहिछाप र दुवै हातको बुढी औंठाछाप (ल्याप्चे) लगाउँछन्।</li>
                <li>तमसुकमा स्पष्ट लेखिएको हुन्छ कि यदि चोरीको प्रमाणित भएमा बिक्रेता स्वयं फौजदारी रूपमा जिम्मेवार हुनेछ।</li>
              </ul>
            </div>
          </div>

          {/* Critical Law 2: AML / CFT Act 2064 */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <Coins className="w-4 h-4 text-amber-700" />
              <span>२. सम्पत्ति शुद्धीकरण (मनि लाउन्डरिङ) निवारण ऐन, २०६४</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>नगद सिमा तथा सतर्कता:</strong> नेपाल राष्ट्र बैंकको निर्देशन अनुसार, ठूलो रकम (रु. ५०,००० भन्दा बढी) को कारोबारमा सम्भव भएसम्म बैंकिङ च्यानल (चेक, कनेक्ट आइपिएस, बैंक ट्रान्सफर) प्रयोग गर्नुपर्छ। अत्यधिक नगद लेनदेन गर्दा सम्पत्ति शुद्धीकरण अनुसन्धान विभाग (DMLI) को छानबिनमा पर्न सकिन्छ।
            </p>
            <div className="text-xs text-neutral-800 bg-white p-3 rounded-lg border border-amber-100 space-y-1">
              <span className="font-semibold text-emerald-800 block">प्रणालीमा राखिएका सुरक्षा व्यवस्थाहरू:</span>
              <ul className="list-disc list-inside space-y-1 text-neutral-600">
                <li>रु. ५०,००० भन्दा बढी नगद भुक्तानी चयन गर्दा प्रणालीले स्वचालित कानुनी चेतावनी र बिक्रेताको स्थायी लेखा नम्बर (PAN) माग्दछ।</li>
                <li>बैंक चेक वा ट्रान्सफरको Reference No. भरपाईमा अनिवार्य समावेश गरिन्छ, जसले भुक्तानीको पारदर्शी प्रमाण दिन्छ।</li>
              </ul>
            </div>
          </div>

          {/* FENEGOSIDA 5 Golden Rules */}
          <div>
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>नेपाल सुनचाँदी व्यवसायी महासंघका ५ आधारभूत सुरक्षा नियमहरू</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border border-neutral-200 rounded-lg flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900">१. ३ पुस्ते र परिचयपत्र विवरण अनिवार्य</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    नेपालको कानुनी तमसुक बमोजिम बाजे, बाबु र पतिको नाम (३ पुस्ते) स्पष्ट खुलाएर नागरिकताको प्रतिलिपि सहित मात्र खरिद गर्नुहोस्।
                  </p>
                </div>
              </div>

              <div className="p-3 border border-neutral-200 rounded-lg flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900">२. ल्याप्चे र हस्ताक्षर अनिवार्य</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    अदालतमा हस्ताक्षर मात्र भन्दा दायाँ-बायाँ दुवै औंठाछाप (ल्याप्चे) भएको भरपाई अकाट्य प्रमाण मानिन्छ।
                  </p>
                </div>
              </div>

              <div className="p-3 border border-neutral-200 rounded-lg flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900">३. गालेको काँचो ढिक्का खरिदमा कडाई</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    अपरिचित व्यक्तिले ल्याएको गालेको काँचो ढिक्का (Melted Bar) खरिद नगर्नुहोस् जबसम्म आधिकारिक भन्सार वा खरिद बिल हुँदैन।
                  </p>
                </div>
              </div>

              <div className="p-3 border border-neutral-200 rounded-lg flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900">४. दैनिक दर्ता किताब सुरक्षित राख्नुहोस्</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    प्रहरीले अनुसन्धान गर्दा खरिद दर्ता पुस्तिका (Purchase Register) देखाउन सक्नुपर्छ। यो प्रणालीले डिजिटल दर्ता सुरक्षित राख्छ।
                  </p>
                </div>
              </div>

              <div className="p-3 border border-neutral-200 rounded-lg flex items-start gap-2.5 md:col-span-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900">५. रोहवर साक्षीको सहिछाप</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    ठूलो परिमाणको सुनचाँदी खरिद गर्दा बिक्रेतासँग आएको एकाघरको नातेदार वा साक्षीको विवरण र हस्ताक्षर लिँदा कानुनी सुरक्षा दोब्बर हुन्छ।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-neutral-50 px-6 py-3.5 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors"
          >
            मैले बुझें, बन्द गर्नुहोस्
          </button>
        </div>
      </div>
    </div>
  );
};
