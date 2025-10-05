
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Employee, PieceRate, DailyGroupLog, Payslip, PayslipLogEntry, DailyTask } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { PayslipPreview } from './components/PayslipPreview';
import { UserPlusIcon, TrashIcon, SaveIcon, UsersIcon, DocumentTextIcon, ArchiveBoxIcon, TagIcon, UserCircleIcon, CogIcon, UploadIcon, DownloadIcon, EyeIcon, XMarkIcon, GoogleIcon, InformationCircleIcon, LogoutIcon, LoginIcon, BugAntIcon, SparklesIcon, ShieldCheckIcon, MenuIcon } from './components/icons';
import { useI18n } from './i18n';

type ActiveTab = 'dailyLog' | 'generator' | 'employees' | 'rates' | 'history' | 'settings';

// --- Google Drive Sync & Auth Config ---
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
const BACKUP_FILE_NAME = 'crewledger-backup.json';
const SUPPORT_EMAIL = 'your-support-email@example.com'; // Placeholder email

// --- OWNER/DEVELOPER ACCESS ---
// IMPORTANT: Change this code to your own secret. This code provides access to the developer panel.
const OWNER_ACCESS_CODE = 'CREWLEDGER_DEV_2024';

// --- Type Definitions ---
interface UserProfile {
    name: string;
    email: string;
    picture: string;
}

const GUEST_USER_PROFILE: UserProfile = {
    name: 'Guest User',
    email: 'crewledger_guest_user',
    picture: '' // Will use a default icon
};


// --- Global Declarations ---
declare global {
    interface Window {
        appConfig?: {
            ads: {
                showAds: boolean;
            }
        };
        Android?: {
            showBannerAd: () => void;
        };
        gapi: any;
        google: any;
        tokenClient: any;
    }
}

// =================================================================
// SUB-COMPONENTS (Moved from original App for clarity)
// =================================================================

const PolicyModal: React.FC<{ onAgree: () => void }> = ({ onAgree }) => {
    const { t } = useI18n();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full flex flex-col max-h-[90vh]">
                <h2 className="text-xl font-bold text-slate-800 p-6 border-b">{t('policyTitle')}</h2>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <p className="text-sm text-slate-600">{t('policyWelcome')}</p>
                    <h3 className="font-semibold text-slate-700">{t('policyStorageTitle')}</h3>
                    <p className="text-sm text-slate-600">{t('policyStorageText')}</p>
                    <h3 className="font-semibold text-slate-700">{t('policyGoogleTitle')}</h3>
                    <p className="text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: t('policyGoogleText').replace('`crewledger-backup.json`', `<code class="text-xs bg-slate-100 p-1 rounded">${BACKUP_FILE_NAME}</code>`) }}></p>
                    <h3 className="font-semibold text-slate-700">{t('policyResponsibilityTitle')}</h3>
                    <p className="text-sm text-slate-600">{t('policyResponsibilityText')}</p>
                    <h3 className="font-semibold text-slate-700">{t('policyWarrantyTitle')}</h3>
                    <p className="text-sm text-slate-600">{t('policyWarrantyText')}</p>
                    <h3 className="font-semibold text-slate-700">{t('policyOfficialTitle')}</h3>
                    <p className="text-sm text-slate-600">{t('policyOfficialText')}</p>
                </div>
                <div className="p-4 bg-slate-50 border-t rounded-b-lg">
                    <button onClick={onAgree} className="w-full px-4 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {t('policyAgree')}
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

const ProblemReportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useI18n();
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        const body = `
            ${description}
            
            ---
            Debug Info:
            User Agent: ${navigator.userAgent}
            App Version: 1.0.0
            Timestamp: ${new Date().toISOString()}
        `;
        const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                 <div className="p-5 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">{t('reportModalTitle')}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><XMarkIcon /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-600">{t('reportIntro')}</p>
                    <div>
                        <label htmlFor="report-subject" className="block text-sm font-medium text-slate-700">{t('reportSubject')}</label>
                        <input
                            type="text"
                            id="report-subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder={t('reportSubjectPlaceholder')}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="report-description" className="block text-sm font-medium text-slate-700">{t('reportDescription')}</label>
                        <textarea
                            id="report-description"
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('reportDescriptionPlaceholder')}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        {t('cancel')}
                    </button>
                    <button onClick={handleSubmit} disabled={!subject || !description} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-400">
                        {t('sendReport')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const OwnerLoginModal: React.FC<{ onClose: () => void; onLoginSuccess: () => void }> = ({ onClose, onLoginSuccess }) => {
    const { t } = useI18n();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleLogin = () => {
        if (code === OWNER_ACCESS_CODE) {
            onLoginSuccess();
        } else {
            setError(t('invalidCode'));
            setCode('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
                <div className="p-5 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">{t('ownerAccessLogin')}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><XMarkIcon /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-600">{t('enterAccessCode')}</p>
                    <div>
                        <label htmlFor="owner-code" className="block text-sm font-medium text-slate-700">{t('accessCode')}</label>
                        <input
                            type="password"
                            id="owner-code"
                            ref={inputRef}
                            value={code}
                            onChange={(e) => { setCode(e.target.value); setError(''); }}
                            onKeyDown={handleKeyDown}
                            className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${error ? 'border-red-500' : 'border-slate-300'}`}
                        />
                         {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        {t('cancel')}
                    </button>
                    <button onClick={handleLogin} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {t('enter')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const OwnerPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { t } = useI18n();
    const [ownerAdId, setOwnerAdId] = useLocalStorage('crewledger_owner_ad_id', '', null);
    const [ownerShowAds, setOwnerShowAds] = useLocalStorage('crewledger_owner_show_ads', false, null);
    
    const handleSaveAdSettings = () => {
        // The useLocalStorage hook saves automatically, but we can provide feedback.
        alert(t('adSettingsSaved'));
    };

    const handleClearAllData = () => {
        if (window.confirm(t('clearAllDataConfirm'))) {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('crewledger_')) {
                    localStorage.removeItem(key);
                }
            });
            alert(t('dataCleared'));
            window.location.reload();
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm border-2 border-amber-400 space-y-6">
            <div className="flex items-center">
                <ShieldCheckIcon />
                <h3 className="text-lg font-bold text-slate-800">{t('ownerPanel')}</h3>
            </div>
            <p className="text-sm text-slate-600 -mt-4">{t('ownerPanelDesc')}</p>

            {/* Ad Settings */}
            <div className="border-t pt-4 space-y-4">
                <h4 className="font-semibold text-slate-700">{t('adSettings')}</h4>
                <div>
                    <label htmlFor="ad-id" className="block text-sm font-medium text-slate-700">{t('admobBannerId')}</label>
                    <input
                        type="text"
                        id="ad-id"
                        value={ownerAdId}
                        onChange={(e) => setOwnerAdId(e.target.value)}
                        placeholder={t('admobBannerIdPlaceholder')}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Note: This only affects the web version. The Android App ID is set in the native code.</p>
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="show-ads"
                        checked={ownerShowAds}
                        onChange={(e) => setOwnerShowAds(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="show-ads" className="ml-2 block text-sm text-slate-900">{t('showAds')}</label>
                </div>
                <button onClick={handleSaveAdSettings} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700">
                    {t('saveAdSettings')}
                </button>
            </div>
            
             {/* Danger Zone */}
            <div className="border-t border-red-300 pt-4 space-y-4 bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800">{t('dangerZone')}</h4>
                <p className="text-sm text-red-700">{t('dangerZoneDesc')}</p>
                <button onClick={handleClearAllData} className="w-full flex justify-center items-center bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700">
                    <TrashIcon /> <span className="ml-2">{t('clearAllData')}</span>
                </button>
            </div>

            <button onClick={onLogout} className="w-full text-sm text-slate-600 hover:text-indigo-600 hover:underline">
                {t('logoutOwnerMode')}
            </button>
        </div>
    );
};


const AboutApp: React.FC<{ onShowPolicy: () => void; onDeveloperLoginClick: () => void; }> = ({ onShowPolicy, onDeveloperLoginClick }) => {
    const { t } = useI18n();
    return (
        <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">{t('aboutThisApp')}</h3>
            <p className="text-sm text-slate-600">
                {t('aboutText')}
            </p>
            <div className="text-sm text-slate-600 space-y-1">
                <p><strong>{t('acknowledgements')}:</strong></p>
                <ul className="list-disc list-inside">
                    <li>{t('ackGod')}</li>
                    <li>{t('ackContributors')}</li>
                </ul>
            </div>
             <div className="text-sm text-slate-600 space-y-2 pt-2 border-t">
                <p><strong>{t('builtWith')}:</strong></p>
                 <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                    <GoogleIcon /> Google AI Studio
                </a>
            </div>
            <button 
                onClick={onShowPolicy}
                className="w-full flex justify-center items-center text-sm bg-slate-100 text-slate-700 font-medium py-2 px-4 rounded-md hover:bg-slate-200 transition-colors"
            >
                <InformationCircleIcon /> {t('viewRules')}
            </button>
            <div className="text-center pt-4 border-t border-slate-100">
                <button 
                    onClick={onDeveloperLoginClick} 
                    className="text-xs text-slate-400 hover:text-indigo-600 hover:underline"
                >
                    {t('ownerAccess')}
                </button>
            </div>
        </div>
    );
};

const GoogleDriveSyncManager: React.FC<{ gapiReady: boolean; userEmail: string; isGuest: boolean }> = ({ gapiReady, userEmail, isGuest }) => {
    const { t } = useI18n();
    const [statusMessage, setStatusMessage] = useState('');
    const [isBusy, setIsBusy] = useState(false);

    if (isGuest) {
        return (
             <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">{t('googleDriveSync')}</h3>
                <div className="p-4 border-l-4 border-blue-400 bg-blue-50 text-blue-800 text-sm text-center">
                    <p className="font-semibold">{t('signInToEnable')}</p>
                    <p>{t('signInToEnableDesc')}</p>
                </div>
            </div>
        )
    }

    const findBackupFile = async () => {
        try {
            const response = await window.gapi.client.drive.files.list({
                q: `name='${BACKUP_FILE_NAME}'`,
                spaces: 'drive',
                fields: 'files(id, name)',
            });
            return response.result.files.length > 0 ? response.result.files[0].id : null;
        } catch (e) {
            console.error(e);
            setStatusMessage('Error: Failed to find backup file.');
            return null;
        }
    };

    const handleBackup = async () => {
        setIsBusy(true);
        setStatusMessage('Backing up data...');
        if (!userEmail) {
            setStatusMessage('Error: User not identified.');
            setIsBusy(false);
            return;
        }

        try {
            const keys = ['crewledger_employees', 'crewledger_pieceRates', 'crewledger_dailyLogs', 'crewledger_payslipHistory'];
            const dataToExport: { [key: string]: any } = {};
            keys.forEach(key => { 
                const userKey = `${key}_${userEmail}`;
                dataToExport[userKey] = JSON.parse(localStorage.getItem(userKey) || '[]'); 
            });
            const fileContent = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([fileContent], { type: 'application/json' });

            const fileId = await findBackupFile();
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify({ name: BACKUP_FILE_NAME, mimeType: 'application/json' })], { type: 'application/json' }));
            form.append('file', blob);

            const method = fileId ? 'PATCH' : 'POST';
            const path = `/upload/drive/v3/files${fileId ? `/${fileId}` : ''}?uploadType=multipart`;

            await window.gapi.client.request({ path, method, body: form });
            setStatusMessage(`Data successfully backed up at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            console.error('Backup failed:', error);
            setStatusMessage('Error: Failed to back up data.');
        } finally {
            setIsBusy(false);
        }
    };
    
    const handleRestore = async () => {
        if (!window.confirm(t('confirmRestore'))) return;
        
        setIsBusy(true);
        setStatusMessage('Restoring data...');
        if (!userEmail) {
            setStatusMessage('Error: User not identified.');
            setIsBusy(false);
            return;
        }
        
        try {
            const fileId = await findBackupFile();
            if (!fileId) {
                setStatusMessage('Backup file not found in Google Drive.');
                setIsBusy(false);
                return;
            }

            const response = await window.gapi.client.drive.files.get({ fileId, alt: 'media' });
            const data = JSON.parse(response.body);
            
            const requiredKeys = ['crewledger_employees', 'crewledger_pieceRates', 'crewledger_dailyLogs', 'crewledger_payslipHistory'];
            const userKeys = requiredKeys.map(key => `${key}_${userEmail}`);

            if (!userKeys.every(key => key in data)) throw new Error('Invalid backup file or data for this user not found.');

            userKeys.forEach(key => localStorage.setItem(key, JSON.stringify(data[key])));
            alert(t('dataRestoredSuccess'));
            window.location.reload();
        } catch (error) {
            console.error('Restore failed:', error);
            setStatusMessage('Error: Failed to restore data.');
        } finally {
            setIsBusy(false);
        }
    };

    if (GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY_HERE' || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
        return (
            <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">{t('cloudSyncComingSoon')}</h3>
                <div className="p-4 border-l-4 border-blue-400 bg-blue-50 text-blue-800 text-sm">
                    <p>{t('cloudSyncDesc')}</p>
                    <p className="mt-2" dangerouslySetInnerHTML={{ __html: t('cloudSyncBackupHint').replace('"Local Backup"', `<strong>"${t('localBackup')}"</strong>`) }}></p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">{t('googleDriveSync')}</h3>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={handleBackup} disabled={isBusy || !gapiReady} className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-slate-400">
                    {t('backup')}
                </button>
                <button onClick={handleRestore} disabled={isBusy || !gapiReady} className="w-full flex justify-center items-center bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-slate-400">
                    {t('restore')}
                </button>
            </div>
            {statusMessage && <p className="text-sm text-slate-600 text-center">{statusMessage}</p>}
        </div>
    );
};

const BulkGenerateModal: React.FC<{
    onClose: () => void;
    onGenerate: (period: string) => void;
    isGenerating: boolean;
}> = ({ onClose, onGenerate, isGenerating }) => {
    const { t } = useI18n();
    const [period, setPeriod] = useState(new Date().toISOString().substring(0, 7));

    const handleGenerateClick = () => {
        onGenerate(period); // Pass "YYYY-MM" string
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                 <div className="p-5 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">{t('bulkGeneratePayslips')}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800" disabled={isGenerating}><XMarkIcon /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-600">{t('bulkGenerateDescription')}</p>
                    <div>
                        <label htmlFor="bulk-gen-period" className="block text-sm font-medium text-slate-700">{t('periodMonth')}</label>
                        <input
                            type="month"
                            id="bulk-gen-period"
                            value={period}
                            onChange={e => setPeriod(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} disabled={isGenerating} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 transition-colors disabled:opacity-50">
                        {t('cancel')}
                    </button>
                    <button onClick={handleGenerateClick} disabled={isGenerating} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-400 flex items-center justify-center min-w-[140px]">
                        {isGenerating && (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isGenerating ? t('generating') : t('generateAndSave')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// =================================================================
// MAIN APPLICATION (Post-Login)
// =================================================================

const MainApp: React.FC<{ user: UserProfile; onLogout: () => void; onSignIn: () => void; gapiReady: boolean; }> = ({ user, onLogout, onSignIn, gapiReady }) => {
    // --- STATE MANAGEMENT ---
    const { t, language, setLanguage, formatCurrency } = useI18n();
    const [activeTab, setActiveTab] = useState<ActiveTab>('dailyLog');
    
    // Check if the user is a guest
    const isGuest = user.email === GUEST_USER_PROFILE.email;
    
    // User-namespaced data
    const [employees, setEmployees] = useLocalStorage<Employee[]>('crewledger_employees', [], user.email);
    const [pieceRates, setPieceRates] = useLocalStorage<PieceRate[]>('crewledger_pieceRates', [], user.email);
    const [dailyLogs, setDailyLogs] = useLocalStorage<DailyGroupLog[]>('crewledger_dailyLogs', [], user.email);
    const [payslipHistory, setPayslipHistory] = useLocalStorage<Payslip[]>('crewledger_payslipHistory', [], user.email);
    const [hasAgreedToPolicy, setHasAgreedToPolicy] = useLocalStorage<boolean>('crewledger_policy_agreed', false, user.email);
    
    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage('crewledger_sidebar_open', true, null);
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [showPolicyModal, setShowPolicyModal] = useState<boolean>(!hasAgreedToPolicy);
    const [showReportModal, setShowReportModal] = useState<boolean>(false);
    const [showBulkGenerateModal, setShowBulkGenerateModal] = useState<boolean>(false);
    const [isBulkGenerating, setIsBulkGenerating] = useState<boolean>(false);
    
    // Owner Mode State
    const [isOwnerMode, setIsOwnerMode] = useState(false);
    const [showOwnerLogin, setShowOwnerLogin] = useState(false);

    // Input refs and state for forms
    const employeeNameRef = useRef<HTMLInputElement>(null);
    const employeePositionRef = useRef<HTMLInputElement>(null);
    const employeeStatusRef = useRef<HTMLSelectElement>(null);
    const [employeeProfilePic, setEmployeeProfilePic] = useState<string | undefined>(undefined);
    
    const rateTaskNameRef = useRef<HTMLInputElement>(null);
    const rateValueRef = useRef<HTMLInputElement>(null);
    
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [presentEmployeeIds, setPresentEmployeeIds] = useState<string[]>([]);
    const [currentTasks, setCurrentTasks] = useState<DailyTask[]>([]);
    const taskSelectRef = useRef<HTMLSelectElement>(null);
    const quantityInputRef = useRef<HTMLInputElement>(null);

    const [generatorEmployeeId, setGeneratorEmployeeId] = useState('');
    const [generatorPeriod, setGeneratorPeriod] = useState(new Date().toISOString().substring(0, 7));
    const [generatorAllowance, setGeneratorAllowance] = useState(0);
    const [generatorDeduction, setGeneratorDeduction] = useState(0);

    // --- SIDE EFFECTS ---
    useEffect(() => {
        // Show banner ad if enabled in config and on Android
        if (window.appConfig?.ads.showAds && window.Android) {
            window.Android.showBannerAd();
        }
        // Check for owner mode on app load
        if (sessionStorage.getItem('crewledger_owner_mode') === 'true') {
            setIsOwnerMode(true);
        }
    }, []);

    // --- DERIVED STATE & MEMOS ---
    const activeEmployees = useMemo(() => employees.filter(e => e.status === 'Active'), [employees]);

    const dailyLogForSelectedDate = useMemo(() => {
        return dailyLogs.find(log => log.date === logDate);
    }, [dailyLogs, logDate]);

    // --- EVENT HANDLERS & LOGIC ---

    const handleAgreeToPolicy = () => {
        setHasAgreedToPolicy(true);
        setShowPolicyModal(false);
    };

    // Owner Mode Handlers
    const handleOwnerLoginSuccess = () => {
        sessionStorage.setItem('crewledger_owner_mode', 'true');
        setIsOwnerMode(true);
        setShowOwnerLogin(false);
    };
    const handleOwnerLogout = () => {
        sessionStorage.removeItem('crewledger_owner_mode');
        setIsOwnerMode(false);
    };
    
    // Employee Handlers
    const handleAddEmployee = () => {
        const name = employeeNameRef.current?.value;
        const position = employeePositionRef.current?.value || '';
        const status = employeeStatusRef.current?.value as 'Active' | 'Inactive' || 'Active';

        if (name) {
            const newEmployee: Employee = { id: Date.now().toString(), name, position, status, profilePicture: employeeProfilePic };
            setEmployees(prev => [...prev, newEmployee]);
            if (employeeNameRef.current) employeeNameRef.current.value = '';
            if (employeePositionRef.current) employeePositionRef.current.value = '';
            setEmployeeProfilePic(undefined);
            const input = document.getElementById('employee-pic-input') as HTMLInputElement | null;
            if (input) input.value = '';
        }
    };
    const handleDeleteEmployee = (id: string) => {
        if (window.confirm(t('confirmDeletionMessage'))) {
            setEmployees(prev => prev.filter(e => e.id !== id));
        }
    };
    const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setEmployeeProfilePic(event.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // Rate Handlers
    const handleAddRate = () => {
        const taskName = rateTaskNameRef.current?.value;
        const rate = parseFloat(rateValueRef.current?.value || '0');

        if (taskName && rate > 0) {
            const newRate: PieceRate = { id: Date.now().toString(), taskName, rate };
            setPieceRates(prev => [...prev, newRate]);
            if (rateTaskNameRef.current) rateTaskNameRef.current.value = '';
            if (rateValueRef.current) rateValueRef.current.value = '';
        }
    };
    const handleDeleteRate = (id: string) => {
        if (window.confirm(t('confirmDeletionMessage'))) {
            setPieceRates(prev => prev.filter(r => r.id !== id));
        }
    };

    // Daily Log Handlers
    const handleToggleEmployeePresence = (employeeId: string) => {
        setPresentEmployeeIds(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const handleAddTaskToLog = () => {
        const pieceRateId = taskSelectRef.current?.value;
        const quantity = parseFloat(quantityInputRef.current?.value || '0');
        const selectedRate = pieceRates.find(r => r.id === pieceRateId);

        if (selectedRate && quantity > 0) {
            const subTotal = selectedRate.rate * quantity;
            const newTask: DailyTask = { pieceRateId, taskName: selectedRate.taskName, rate: selectedRate.rate, quantity, subTotal };
            setCurrentTasks(prev => [...prev, newTask]);
            if (quantityInputRef.current) quantityInputRef.current.value = '';
        } else {
            alert(t('alertSelectTaskAndQuantity'));
        }
    };

    const handleSaveDailyLog = () => {
        if (logDate && presentEmployeeIds.length > 0 && currentTasks.length > 0) {
            const totalGrossEarnings = currentTasks.reduce((acc, task) => acc + task.subTotal, 0);
            const individualEarnings = totalGrossEarnings / presentEmployeeIds.length;
            const newLog: DailyGroupLog = {
                id: Date.now().toString(),
                date: logDate,
                tasks: currentTasks,
                presentEmployeeIds,
                totalGrossEarnings,
                individualEarnings,
            };

            setDailyLogs(prev => {
                const existingLogIndex = prev.findIndex(log => log.date === logDate);
                if (existingLogIndex > -1) {
                    const updatedLogs = [...prev];
                    updatedLogs[existingLogIndex] = newLog;
                    return updatedLogs;
                }
                return [...prev, newLog];
            });
            // Don't reset state here, so user can see what they just saved.
        } else {
            alert(t('alertFillAllFields'));
        }
    };

    const handleDeleteDailyLog = () => {
        if (window.confirm(t('confirmDeletionMessage'))) {
            setDailyLogs(prev => prev.filter(log => log.date !== logDate));
        }
    };

    useEffect(() => {
        if (dailyLogForSelectedDate) {
            setPresentEmployeeIds(dailyLogForSelectedDate.presentEmployeeIds);
            setCurrentTasks(dailyLogForSelectedDate.tasks);
        } else {
            setPresentEmployeeIds([]);
            setCurrentTasks([]);
        }
    }, [logDate, dailyLogForSelectedDate]);


    // Payslip Generator Handlers
    const generateAndPreviewPayslip = useCallback(() => {
        const employee = employees.find(e => e.id === generatorEmployeeId);
        if (!employee) return;

        const [year, month] = generatorPeriod.split('-').map(Number);
        const periodMonth = month - 1;
        const periodYear = year;
        const displayPeriod = new Date(generatorPeriod + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });

        const relevantLogs = dailyLogs.filter(log => {
            const logDate = new Date(log.date);
            return log.presentEmployeeIds.includes(employee.id) && logDate.getUTCMonth() === periodMonth && logDate.getUTCFullYear() === periodYear;
        });

        const payslipLogs: PayslipLogEntry[] = relevantLogs.flatMap(dayLog => {
            return dayLog.tasks.map(task => ({
                date: dayLog.date,
                taskName: task.taskName,
                totalDailyGross: task.subTotal,
                workersPresent: dayLog.presentEmployeeIds.length,
                yourEarning: dayLog.individualEarnings
            }));
        });
        
        // Let's refine the earnings calculation. An employee gets a share for each day they are present.
        const grossSalary = relevantLogs.reduce((total, log) => total + log.individualEarnings, 0);
        const netSalary = grossSalary + generatorAllowance - generatorDeduction;

        const payslip: Payslip = {
            id: Date.now().toString(),
            employeeId: employee.id,
            employeeName: employee.name,
            employeePosition: employee.position,
            employeeProfilePicture: employee.profilePicture,
            period: displayPeriod,
            logs: payslipLogs,
            grossSalary,
            allowance: generatorAllowance,
            deduction: generatorDeduction,
            netSalary,
            createdAt: new Date().toISOString(),
        };

        setSelectedPayslip(payslip);
    }, [generatorEmployeeId, generatorPeriod, generatorAllowance, generatorDeduction, employees, dailyLogs]);

    useEffect(() => {
        if (generatorEmployeeId && generatorPeriod) {
            generateAndPreviewPayslip();
        } else {
            setSelectedPayslip(null);
        }
    }, [generatorEmployeeId, generatorPeriod, generatorAllowance, generatorDeduction, generateAndPreviewPayslip]);

    const handleSavePayslip = () => {
        if (selectedPayslip) {
            setPayslipHistory(prev => [selectedPayslip, ...prev]);
            alert(t('payslipSavedSuccess', { employeeName: selectedPayslip.employeeName, period: selectedPayslip.period }));
        }
    };
    
    const handleBulkGenerate = (periodYYYYMM: string) => {
        setIsBulkGenerating(true);
    
        let successCount = 0;
        const newPayslips: Payslip[] = [];
        // Safari can be tricky with "YYYY-MM" dates, adding a day is safer.
        const displayPeriod = new Date(periodYYYYMM + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });
        const periodMonth = new Date(periodYYYYMM + '-02').getUTCMonth();
        const periodYear = new Date(periodYYYYMM + '-02').getUTCFullYear();
    
        activeEmployees.forEach(employee => {
            const relevantLogs = dailyLogs.filter(log => {
                const logDate = new Date(log.date);
                return log.presentEmployeeIds.includes(employee.id) && logDate.getUTCMonth() === periodMonth && logDate.getUTCFullYear() === periodYear;
            });
    
            const grossSalary = relevantLogs.reduce((total, log) => total + log.individualEarnings, 0);
    
            if (grossSalary > 0) {
                 const payslipLogs: PayslipLogEntry[] = relevantLogs.flatMap(dayLog => {
                    return dayLog.tasks.map(task => ({
                        date: dayLog.date,
                        taskName: task.taskName,
                        totalDailyGross: task.subTotal,
                        workersPresent: dayLog.presentEmployeeIds.length,
                        yourEarning: dayLog.individualEarnings
                    }));
                });

                const payslip: Payslip = {
                    id: `${Date.now().toString()}-${employee.id}`,
                    employeeId: employee.id,
                    employeeName: employee.name,
                    employeePosition: employee.position,
                    employeeProfilePicture: employee.profilePicture,
                    period: displayPeriod,
                    logs: payslipLogs,
                    grossSalary,
                    allowance: 0, // Default allowance/deduction to 0 for bulk generation
                    deduction: 0,
                    netSalary: grossSalary,
                    createdAt: new Date().toISOString(),
                };
                newPayslips.push(payslip);
                successCount++;
            }
        });
    
        // Add new payslips to the top of the history, preserving their generated order.
        setPayslipHistory(prev => [...newPayslips.reverse(), ...prev]);
        
        // Use a timeout to provide better UX, allowing the UI to update before the alert.
        setTimeout(() => {
            setIsBulkGenerating(false);
            setShowBulkGenerateModal(false);
            alert(t('generationSummary', { successCount: successCount, failCount: activeEmployees.length - successCount }));
            setActiveTab('history'); // Navigate to history to see results
        }, 500);
    };


    // Settings Handlers (Local Backup)
    const handleExportData = () => {
        try {
            const keys = ['crewledger_employees', 'crewledger_pieceRates', 'crewledger_dailyLogs', 'crewledger_payslipHistory'];
            const dataToExport: { [key: string]: any } = {};
            keys.forEach(key => { 
                const userKey = `${key}_${user.email}`;
                dataToExport[userKey] = JSON.parse(localStorage.getItem(userKey) || '[]'); 
            });
            
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `crewledger-backup-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert(t('dataExportedSuccess'));
        } catch (error) {
            console.error('Export failed:', error);
            alert(t('dataExportedError'));
        }
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm(t('confirmRestore'))) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('File content is not readable text.');
                
                const data = JSON.parse(text);
                const requiredKeys = ['crewledger_employees', 'crewledger_pieceRates', 'crewledger_dailyLogs', 'crewledger_payslipHistory'].map(k => `${k}_${user.email}`);
                
                if (!requiredKeys.every(key => key in data)) {
                    throw new Error('Invalid backup file or data for this user not found.');
                }

                requiredKeys.forEach(key => {
                    localStorage.setItem(key, JSON.stringify(data[key]));
                });
                
                alert(t('dataRestoredSuccess'));
                window.location.reload();
            } catch (error) {
                console.error(error);
                alert(t('dataRestoredError', { error: (error as Error).message }));
            }
        };
        reader.onerror = () => {
            alert(t('readFileError'));
        };
        reader.readAsText(file);
    };

    const NavLink: React.FC<{ tabName: ActiveTab; icon: React.ReactNode; label: string; isSidebarOpen: boolean; }> = ({ tabName, icon, label, isSidebarOpen }) => (
         <li title={!isSidebarOpen ? label : ''}>
            <a
                href="#"
                onClick={(e) => { 
                    e.preventDefault(); 
                    setActiveTab(tabName);
                }}
                className={`flex items-center p-3 my-1 rounded-lg transition-colors ${activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-indigo-500 hover:text-white'} ${!isSidebarOpen && 'justify-center'}`}
            >
                {icon}
                <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
            </a>
        </li>
    );
    
    const pageTitles: Record<ActiveTab, string> = {
        dailyLog: t('dailyLog'),
        generator: t('payslipGenerator'),
        history: t('history'),
        employees: t('employees'),
        rates: t('rates'),
        settings: t('settings'),
    };

    // --- RENDER ---
    return (
        <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
             {showPolicyModal && <PolicyModal onAgree={handleAgreeToPolicy} />}
             {showReportModal && <ProblemReportModal onClose={() => setShowReportModal(false)} />}
             {showBulkGenerateModal && <BulkGenerateModal onClose={() => setShowBulkGenerateModal(false)} onGenerate={handleBulkGenerate} isGenerating={isBulkGenerating} />}
             {showOwnerLogin && <OwnerLoginModal onClose={() => setShowOwnerLogin(false)} onLoginSuccess={handleOwnerLoginSuccess} />}
            
            {/* Mobile overlay, appears when menu is open */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
            
            {/* Sidebar */}
            <aside className={`absolute lg:relative z-40 flex-shrink-0 bg-slate-800 text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out h-full overflow-x-hidden ${isSidebarOpen ? 'w-64' : 'w-0 lg:w-20'}`}>
                <div className={`flex items-center justify-between p-4 border-b border-slate-700 transition-all duration-300 ${isSidebarOpen ? 'pl-6' : 'px-0 justify-center'}`}>
                    <div className="cursor-pointer whitespace-nowrap">
                        <h1 className={`text-2xl font-bold transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>{t('appName')}</h1>
                        <p className={`text-sm text-slate-400 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>{t('appDescription')}</p>
                    </div>
                </div>

                <nav className="flex-grow p-2">
                    <ul className="space-y-1">
                        <NavLink tabName="dailyLog" icon={<DocumentTextIcon />} label={t('dailyLog')} isSidebarOpen={isSidebarOpen} />
                        <NavLink tabName="generator" icon={<ArchiveBoxIcon />} label={t('payslipGenerator')} isSidebarOpen={isSidebarOpen} />
                        <NavLink tabName="history" icon={<UsersIcon />} label={t('history')} isSidebarOpen={isSidebarOpen} />
                        <NavLink tabName="employees" icon={<UsersIcon />} label={t('employees')} isSidebarOpen={isSidebarOpen} />
                        <NavLink tabName="rates" icon={<TagIcon />} label={t('rates')} isSidebarOpen={isSidebarOpen} />
                        <NavLink tabName="settings" icon={<CogIcon />} label={t('settings')} isSidebarOpen={isSidebarOpen} />
                    </ul>
                </nav>
                 {/* User Profile Section */}
                <div className="mt-auto p-4 border-t border-slate-700">
                    <div className={`flex items-center ${!isSidebarOpen && 'justify-center'}`}>
                        {isGuest ? <UserCircleIcon className="w-10 h-10 text-slate-400 flex-shrink-0" /> : <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />}
                        <div className={`ml-3 flex-grow min-w-0 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                            <p className="font-semibold text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                         {isGuest ? (
                            <button onClick={onSignIn} title={t('signIn')} className={`ml-2 p-1 rounded-full text-slate-400 hover:bg-slate-600 hover:text-white transition-opacity duration-200 flex-shrink-0 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                                <LoginIcon />
                            </button>
                        ) : (
                            <button onClick={onLogout} title={t('logout')} className={`ml-2 p-1 rounded-full text-slate-400 hover:bg-slate-600 hover:text-white transition-opacity duration-200 flex-shrink-0 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                                <LogoutIcon />
                            </button>
                        )}
                    </div>
                </div>
            </aside>
            <main className="flex-1 w-full flex flex-col h-screen overflow-y-auto">
                {/* Main Content Header */}
                <header className="bg-white text-slate-800 flex items-center p-4 sticky top-0 z-10 shadow-sm border-b">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100" aria-label="Toggle menu">
                        <MenuIcon />
                    </button>
                    <h2 className="text-xl font-bold ml-4">{pageTitles[activeTab]}</h2>
                </header>

                <div className="p-4 md:p-6 lg:p-8 flex-grow">
                    <div className="max-w-7xl mx-auto w-full">
                    {activeTab === 'dailyLog' && (
                        /* Daily Log Content */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           {/* Left Column: Form */}
                            <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                                <h2 className="text-xl font-bold text-slate-800">{t('dailyGroupEntry')}</h2>
                                {/* Date Picker */}
                                <div>
                                    <label htmlFor="log-date" className="block text-sm font-medium text-slate-700">{t('date')}</label>
                                    <input type="date" id="log-date" value={logDate} onChange={e => setLogDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>

                                {/* Employee Selector */}
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-700">{t('selectPresentEmployees')} ({presentEmployeeIds.length} {t('employeesSelected')})</h3>
                                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-2 border rounded-md">
                                        {activeEmployees.map(employee => (
                                            <button key={employee.id} onClick={() => handleToggleEmployeePresence(employee.id)} className={`p-2 rounded-md text-sm text-left transition-colors ${presentEmployeeIds.includes(employee.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                                                {employee.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Task Adder */}
                                <div className="border-t pt-4">
                                     <h3 className="text-lg font-semibold text-slate-700">{t('addTask')}</h3>
                                     <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                        <div className="sm:col-span-2">
                                            <label htmlFor="task-select" className="block text-sm font-medium text-slate-700">{t('task')}</label>
                                            <select id="task-select" ref={taskSelectRef} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                                <option value="">{t('selectTask')}</option>
                                                {pieceRates.map(rate => <option key={rate.id} value={rate.id}>{rate.taskName}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="quantity-input" className="block text-sm font-medium text-slate-700">{t('totalQuantity')}</label>
                                            <input type="number" id="quantity-input" ref={quantityInputRef} placeholder={t('quantityPlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                        </div>
                                    </div>
                                    <button onClick={handleAddTaskToLog} className="mt-3 w-full bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700">{t('addTaskToList')}</button>
                                </div>

                                {/* Today's Task List */}
                                <div className="border-t pt-4">
                                    <h3 className="text-lg font-semibold text-slate-700">{t('todaysTaskList')}</h3>
                                    <ul className="mt-2 space-y-2">
                                        {currentTasks.map((task, index) => (
                                            <li key={index} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                                <span>{task.taskName} ({task.quantity} @ {formatCurrency(task.rate)})</span>
                                                <button onClick={() => setCurrentTasks(prev => prev.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700 text-xs font-semibold">{t('remove')}</button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button onClick={handleSaveDailyLog} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center">
                                    <SaveIcon /> {t('saveDailyLog')}
                                </button>
                            </div>
                            
                            {/* Right Column: Summary */}
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-xl font-bold text-slate-800">{t('logForDate')} {logDate}</h2>
                                {dailyLogForSelectedDate ? (
                                    <div className="mt-4 space-y-4">
                                        <div className="bg-indigo-50 p-4 rounded-lg text-center">
                                            <p className="text-sm text-indigo-700 font-semibold">{t('todaysTotal')}</p>
                                            <p className="text-3xl font-bold text-indigo-900">{formatCurrency(dailyLogForSelectedDate.totalGrossEarnings)}</p>
                                            <p className="text-sm text-slate-500 mt-1">({dailyLogForSelectedDate.presentEmployeeIds.length} {t('workersPresent')} &bull; {formatCurrency(dailyLogForSelectedDate.individualEarnings)} {t('perPerson')})</p>
                                        </div>
                                        <div>
                                             <h3 className="font-semibold text-slate-700 mb-2">{t('todaysTaskList')}</h3>
                                             <ul className="space-y-1 text-sm">
                                                {dailyLogForSelectedDate.tasks.map(task => (
                                                    <li key={task.pieceRateId} className="flex justify-between p-2 bg-slate-50 rounded">
                                                        <span>{task.taskName} x {task.quantity}</span>
                                                        <span className="font-mono">{formatCurrency(task.subTotal)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                         <div>
                                            <h3 className="font-semibold text-slate-700 mb-2">{t('presentCrew')}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {employees.filter(e => dailyLogForSelectedDate.presentEmployeeIds.includes(e.id)).map(e => (
                                                    <span key={e.id} className="text-sm bg-slate-200 text-slate-800 px-2 py-1 rounded-full">{e.name}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={handleDeleteDailyLog} className="w-full text-red-600 font-semibold py-2 px-4 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center mt-4">
                                            <TrashIcon /> {t('deleteLogEntry')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-4 text-center text-slate-500 py-10 border-2 border-dashed rounded-lg">
                                        <p>{t('noLogEntries')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'generator' && (
                        /* Generator Content */
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm space-y-4 h-fit">
                                <h2 className="text-xl font-bold text-slate-800">{t('generatePayslip')}</h2>
                                <div>
                                    <label htmlFor="gen-employee" className="block text-sm font-medium text-slate-700">{t('selectEmployee')}</label>
                                    <select id="gen-employee" value={generatorEmployeeId} onChange={e => setGeneratorEmployeeId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="">{t('selectEmployeeOption')}</option>
                                        {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="gen-period" className="block text-sm font-medium text-slate-700">{t('periodMonth')}</label>
                                    <input type="month" id="gen-period" value={generatorPeriod} onChange={e => setGeneratorPeriod(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="gen-allowance" className="block text-sm font-medium text-slate-700">{t('allowanceBonus')}</label>
                                    <input type="number" id="gen-allowance" value={generatorAllowance} onChange={e => setGeneratorAllowance(parseFloat(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="gen-deduction" className="block text-sm font-medium text-slate-700">{t('deductions')}</label>
                                    <input type="number" id="gen-deduction" value={generatorDeduction} onChange={e => setGeneratorDeduction(parseFloat(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <button onClick={handleSavePayslip} disabled={!selectedPayslip} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:bg-slate-400">
                                    <SaveIcon /> {t('savePayslipToHistory')}
                                </button>
                            </div>
                            <div className="lg:col-span-2">
                                <PayslipPreview payslip={selectedPayslip} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'employees' && (
                        /* Employees Content */
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm space-y-4 h-fit">
                                <h2 className="text-xl font-bold text-slate-800">{t('addNewEmployee')}</h2>
                                <div>
                                    <label htmlFor="employee-name" className="block text-sm font-medium text-slate-700">{t('fullName')}</label>
                                    <input type="text" id="employee-name" ref={employeeNameRef} placeholder={t('fullNamePlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="employee-position" className="block text-sm font-medium text-slate-700">{t('positionOptional')}</label>
                                    <input type="text" id="employee-position" ref={employeePositionRef} placeholder={t('positionPlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="employee-status" className="block text-sm font-medium text-slate-700">{t('status')}</label>
                                    <select id="employee-status" ref={employeeStatusRef} defaultValue="Active" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                        <option>{t('active')}</option>
                                        <option>{t('inactive')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="employee-pic-input" className="block text-sm font-medium text-slate-700">{t('profilePictureOptional')}</label>
                                    <input type="file" id="employee-pic-input" accept="image/*" onChange={handleProfilePicUpload} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                </div>
                                <button onClick={handleAddEmployee} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 flex items-center justify-center">
                                    <UserPlusIcon /> {t('addEmployee')}
                                </button>
                            </div>
                            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">{t('employeeList')}</h2>
                                <div className="space-y-3">
                                    {employees.length > 0 ? employees.map(e => (
                                        <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center">
                                                {e.profilePicture ? <img src={e.profilePicture} alt={e.name} className="w-12 h-12 rounded-full object-cover mr-4"/> : <UserCircleIcon className="w-12 h-12 text-slate-300 mr-4"/>}
                                                <div>
                                                    <p className="font-semibold text-slate-800">{e.name}</p>
                                                    <p className="text-sm text-slate-500">{e.position || t('noPosition')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${e.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>{e.status}</span>
                                                <button onClick={() => handleDeleteEmployee(e.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full">
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </div>
                                    )) : <p className="text-slate-500 text-center py-8">{t('noEmployeeData')}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rates' && (
                        /* Rates Content */
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm space-y-4 h-fit">
                                <h2 className="text-xl font-bold text-slate-800">{t('addRate')}</h2>
                                <div>
                                    <label htmlFor="rate-task-name" className="block text-sm font-medium text-slate-700">{t('taskJobName')}</label>
                                    <input type="text" id="rate-task-name" ref={rateTaskNameRef} placeholder={t('taskPlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="rate-value" className="block text-sm font-medium text-slate-700">{t('ratePerUnit')}</label>
                                    <input type="number" id="rate-value" ref={rateValueRef} placeholder={t('ratePlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <button onClick={handleAddRate} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 flex items-center justify-center">
                                    <TagIcon /> {t('addRate')}
                                </button>
                            </div>
                            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">{t('rateList')}</h2>
                                <div className="space-y-3">
                                    {pieceRates.length > 0 ? pieceRates.map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div>
                                                <p className="font-semibold text-slate-800">{r.taskName}</p>
                                                <p className="text-sm text-slate-500">{formatCurrency(r.rate)} {t('perUnit')}</p>
                                            </div>
                                            <button onClick={() => handleDeleteRate(r.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    )) : <p className="text-slate-500 text-center py-8">{t('noRateData')}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        /* History Content */
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-slate-800">{t('payslipHistory')}</h2>
                                <button onClick={() => setShowBulkGenerateModal(true)} className="flex items-center bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">
                                    <SparklesIcon className="h-5 w-5 mr-2"/>
                                    {t('bulkGenerate')}
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-slate-500">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">{t('employeeName')}</th>
                                            <th scope="col" className="px-6 py-3">{t('period')}</th>
                                            <th scope="col" className="px-6 py-3 text-right">{t('netSalary')}</th>
                                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payslipHistory.length > 0 ? payslipHistory.map(p => (
                                            <tr key={p.id} className="bg-white border-b hover:bg-slate-50">
                                                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{p.employeeName}</td>
                                                <td className="px-6 py-4">{p.period}</td>
                                                <td className="px-6 py-4 text-right font-mono">{formatCurrency(p.netSalary)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => { setSelectedPayslip(p); setActiveTab('generator'); }} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full" title="View Payslip">
                                                            <EyeIcon />
                                                        </button>
                                                        <button onClick={() => { if(window.confirm(t('confirmDeletionMessage'))) setPayslipHistory(prev => prev.filter(item => item.id !== p.id)) }} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full" title="Delete Payslip">
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="text-center py-10 text-slate-500">{t('noPayslipHistory')}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        /* Settings Content */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-800">{t('languageAndCurrency')}</h3>
                                    <p className="text-sm text-slate-600">{t('languageAndCurrencyDesc')}</p>
                                    <div>
                                        <label htmlFor="language-select" className="block text-sm font-medium text-slate-700">{t('language')}</label>
                                        <select id="language-select" value={language} onChange={e => setLanguage(e.target.value as 'en' | 'id')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                            <option value="en">{t('english')}</option>
                                            <option value="id">{t('indonesian')}</option>
                                        </select>
                                    </div>
                                </div>
                                <GoogleDriveSyncManager gapiReady={gapiReady} userEmail={user.email} isGuest={isGuest} />
                                <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-800">{t('localBackup')}</h3>
                                    <p className="text-sm text-slate-600">{t('localBackupDesc')}</p>
                                    <button onClick={handleExportData} className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700">
                                        <DownloadIcon /> {t('backupToFile')}
                                    </button>
                                </div>
                                <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-800">{t('localRestore')}</h3>
                                    <p className="text-sm text-slate-600">{t('localRestoreDesc')}</p>
                                    <div className="p-2 border-l-4 border-amber-400 bg-amber-50 text-amber-800 text-xs">
                                        <p><strong>{t('warning')}:</strong> {t('warningRestore')}</p>
                                    </div>
                                    <input type="file" id="import-file" accept=".json" onChange={handleImportData} className="hidden" />
                                    <label htmlFor="import-file" className="w-full flex justify-center items-center bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 cursor-pointer">
                                        <UploadIcon /> {t('restoreFromFile')}
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-6">
                                {isOwnerMode ? <OwnerPanel onLogout={handleOwnerLogout} /> : <AboutApp onShowPolicy={() => setShowPolicyModal(true)} onDeveloperLoginClick={() => setShowOwnerLogin(true)} />}
                                <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-800">{t('reportProblem')}</h3>
                                    <p className="text-sm text-slate-600">{t('reportProblemDesc')}</p>
                                    <button onClick={() => setShowReportModal(true)} className="w-full flex justify-center items-center text-sm bg-slate-100 text-slate-700 font-medium py-2 px-4 rounded-md hover:bg-slate-200 transition-colors">
                                        <BugAntIcon /> {t('openReportForm')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </main>
        </div>
    );
};

// =================================================================
// TOP-LEVEL APPLICATION COMPONENT (Handles Auth)
// =================================================================
const App: React.FC = () => {
    const { t } = useI18n();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [gapiReady, setGapiReady] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);
    
    const isDevelopment = GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY_HERE' || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE';

    const handleAuthClick = useCallback(() => {
        if (tokenClient) {
            tokenClient.callback = async (resp: any) => {
                if (resp.error !== undefined) {
                    throw (resp);
                }
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${window.gapi.client.getToken().access_token}` }
                });
                const userInfo = await userInfoResponse.json();
                setUserProfile({
                    name: userInfo.name,
                    email: userInfo.email,
                    picture: userInfo.picture,
                });
            };
            tokenClient.requestAccessToken({ prompt: 'consent' });
        }
    }, [tokenClient]);

    const handleSignOutClick = useCallback(() => {
        const token = window.gapi.client.getToken();
        if (token !== null) {
            window.google.accounts.oauth2.revoke(token.access_token, () => {
                window.gapi.client.setToken(null);
                setUserProfile(null);
            });
        }
    }, []);
    
    const handleContinueAsGuest = () => {
        setUserProfile(GUEST_USER_PROFILE);
    };

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.gapi.load('client', async () => {
                if (isDevelopment) {
                    setGapiReady(true);
                    return;
                }
                await window.gapi.client.init({
                    apiKey: GOOGLE_API_KEY,
                    discoveryDocs: [DISCOVERY_DOC],
                });
                setGapiReady(true);
            });
        };
        document.body.appendChild(script);

        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.async = true;
        gisScript.defer = true;
        gisScript.onload = () => {
             if (isDevelopment) return;
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: SCOPES,
                callback: '', 
            });
            setTokenClient(client);
        };
        document.body.appendChild(gisScript);
    }, [isDevelopment]);

    useEffect(() => {
        if (isDevelopment && !userProfile) {
            setUserProfile(GUEST_USER_PROFILE);
        }
    }, [isDevelopment, userProfile]);
    
    if (!userProfile) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-100">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">{t('appName')}</h1>
                        <p className="text-slate-500 mt-1">{t('appDescription')}</p>
                    </div>
                    <p className="text-slate-600">
                       {t('signInToEnableDesc')}
                    </p>
                    <div className="space-y-3">
                        <button 
                            onClick={handleAuthClick}
                            disabled={!gapiReady || !tokenClient || isDevelopment}
                            className="w-full flex items-center justify-center bg-white border border-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            <GoogleIcon />
                            {t('signIn')}
                        </button>
                        <button 
                            onClick={handleContinueAsGuest}
                            className="w-full flex items-center justify-center bg-slate-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            <UserCircleIcon className="w-5 h-5 mr-2" />
                           {t('continueAsGuest')}
                        </button>
                    </div>
                     {isDevelopment && <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">Note: Google Sign-In is disabled because API keys are not configured. Running in guest mode.</p>}
                </div>
            </div>
        );
    }

    return (
        <MainApp 
            user={userProfile} 
            onLogout={handleSignOutClick} 
            onSignIn={handleAuthClick} 
            gapiReady={gapiReady} 
        />
    );
};

export default App;
