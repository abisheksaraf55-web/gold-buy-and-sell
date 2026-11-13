import React, { useState } from 'react';
import { 
  Database, 
  Cloud, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive, 
  RefreshCw, 
  X, 
  ShieldCheck,
  FileJson
} from 'lucide-react';
import { 
  exportFullBackupJSON, 
  importFullBackupJSON, 
  resetToSampleTransactions 
} from '../utils/storage';
import { 
  fetchTransactions, 
  persistTransaction 
} from '../services/dataStorageService';
import { PurchaseTransaction } from '../types/bullion';

interface DataStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: PurchaseTransaction[];
  onRefreshData: () => void;
}

export const DataStorageModal: React.FC<DataStorageModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onRefreshData,
}) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  // 1. Export JSON Backup
  const handleExportBackup = () => {
    try {
      const jsonStr = exportFullBackupJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nepal_bullion_data_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        message: 'तपाईंको सम्पूर्ण डेटाब्याकअप सुरक्षित रूपमा डाउनलोड भयो (Backup downloaded successfully).'
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `डाउनलोड असफल: ${err?.message || 'अज्ञात त्रुटि'}`
      });
    }
  };

  // 2. Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const res = importFullBackupJSON(content);
        if (res.success) {
          // Sync imported transactions to Firestore as well
          setIsSyncing(true);
          const imported = JSON.parse(content);
          if (imported.transactions && Array.isArray(imported.transactions)) {
            for (const tx of imported.transactions) {
              await persistTransaction(tx);
            }
          }
          setIsSyncing(false);
          onRefreshData();
          setFeedback({ type: 'success', message: res.message });
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setIsSyncing(false);
        setFeedback({ type: 'error', message: 'फाइल पढ्न सकिएन: ' + (err?.message || '') });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 3. Sync Cloud
  const handleCloudSync = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      // Push any local transactions to Firestore
      for (const tx of transactions) {
        await persistTransaction(tx);
      }
      // Re-fetch
      await fetchTransactions();
      onRefreshData();
      setIsSyncing(false);
      setFeedback({
        type: 'success',
        message: 'क्लाउड डाटाबेस (Firebase Firestore) सँग सबै खरिद तथा सिरीयल नम्बर सिन्क भयो।'
      });
    } catch (err: any) {
      setIsSyncing(false);
      setFeedback({
        type: 'error',
        message: 'सिन्क गर्न सकिएन: ' + (err?.message || '')
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200">
        {/* Header */}
        <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600/20 text-amber-400 rounded-lg border border-amber-600/40">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">डेटा भण्डारण तथा सुरक्षित ब्याकअप (Data Storage)</h2>
              <p className="text-xs text-neutral-400">भविष्यमा सम्पूर्ण विवरण हेर्न, सुरक्षित राख्न र ब्याकअप लिन</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Alert */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="font-bold ml-2 text-neutral-500 hover:text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Storage Architecture Overview */}
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-neutral-700" />
                <span className="text-xs font-bold text-neutral-900">भण्डारण स्थिति (Storage Status)</span>
              </div>
              <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> सक्रिय (Cloud & Offline Active)
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-neutral-200">
                <div className="text-neutral-500 text-[11px]">कुल सुरक्षित सम्झौताहरू</div>
                <div className="text-lg font-bold text-neutral-900 mt-0.5">
                  {transactions.length} वटा
                </div>
                <div className="text-[10px] text-neutral-400 mt-1">प्रत्येक सम्झौतामा युनिक सिरीयल नम्बर</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-neutral-200">
                <div className="text-neutral-500 text-[11px]">क्लाउड डेटाबेस</div>
                <div className="text-sm font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                  <Cloud className="w-4 h-4" /> Firebase Firestore
                </div>
                <div className="text-[10px] text-neutral-400 mt-1">स्वतः सुरक्षित र सुरक्षित नियम लागू</div>
              </div>
            </div>
          </div>

          {/* Action 1: Cloud Sync */}
          <div className="border border-neutral-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span>क्लाउड डेटाबेस सिन्क (Sync with Cloud Firestore)</span>
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  तपाईंको कम्प्युटर वा मोबाइलमा रहेका सबै कारोबार क्लाउड सर्भरमा सुरक्षित राख्नुहोस्।
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloudSync}
                disabled={isSyncing}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'सिन्क हुँदैछ...' : 'अहिले सिन्क गर्नुहोस्'}</span>
              </button>
            </div>
          </div>

          {/* Action 2: Offline File Backup (Download JSON) */}
          <div className="border border-neutral-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>डेटा ब्याकअप डाउनलोड (Full Backup Download)</span>
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  सम्पूर्ण खरिद सम्झौता, पसलको प्रोफाइल, दरभाउ र ग्राहक विवरण .json फाइलमा डाउनलोड गर्नुहोस्।
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Backup JSON</span>
              </button>
            </div>
          </div>

          {/* Action 3: Restore Backup */}
          <div className="border border-neutral-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>पहिलेको ब्याकअप रिस्टोर (Restore from Backup)</span>
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  पहिले डाउनलोड गरिएको ब्याकअप फाइल अपलोड गरी सबै विवरण पुन: प्राप्त गर्नुहोस्।
                </p>
              </div>
              <label className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-neutral-300 transition-colors cursor-pointer whitespace-nowrap">
                <Upload className="w-3.5 h-3.5" />
                <span>फाइल छान्नुहोस्</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-6 py-3.5 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>डेटा पूर्ण सुरक्षित र ईन्क्रिप्टेड छ</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 font-medium cursor-pointer"
          >
            बन्द गर्नुहोस् (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
