import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { User, Employee, PieceRate, DailyGroupLog, Payslip, DailyTask, PayslipLogEntry, DevSettings } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { PayslipPreview } from './components/PayslipPreview';
import { UserPlusIcon, TrashIcon, SaveIcon, UsersIcon, DocumentTextIcon, ArchiveBoxIcon, TagIcon, UserCircleIcon, CogIcon, UploadIcon, DownloadIcon, EyeIcon, XMarkIcon, SparklesIcon, MenuIcon, LogoutIcon, AtSymbolIcon, LockClosedIcon, IdentificationIcon, PhoneIcon, InformationCircleIcon } from './components/icons';
import { useI18n } from './i18n';
import { remoteConfigService } from './services/remoteConfig';
import { payslipService } from './services/payslipService';

type ActiveTab = 'dailyLog' | 'generator' | 'employees' | 'rates' | 'history' | 'settings';
type ModalType = null | 'addEmployee' | 'editEmployee' | 'addRate' | 'editRate' | 'deleteConfirm' | 'bulkGenerate' | 'viewPayslip' | 'policy' | 'devAccess';


// =================================================================
// MAIN APP COMPONENT (The original App.tsx content, now for authenticated users)
// =================================================================
const MainApp: React.FC<{ currentUser: User; onLogout: () => void; isGuest: boolean; }> = ({ currentUser, onLogout, isGuest }) => {
    const { t, language, setLanguage, formatDate, formatCurrency } = useI18n();

    // --- STATE MANAGEMENT (Scoped to current user) ---
    const [employees, setEmployees] = useLocalStorage<Employee[]>(`employees_${currentUser.id}`, []);
    const [pieceRates, setPieceRates] = useLocalStorage<PieceRate[]>(`pieceRates_${currentUser.id}`, []);
    const [dailyLogs, setDailyLogs] = useLocalStorage<DailyGroupLog[]>(`dailyLogs_${currentUser.id}`, []);
    const [payslips, setPayslips] = useLocalStorage<Payslip[]>(`payslips_${currentUser.id}`, []);
    const [isPolicyAgreed, setIsPolicyAgreed] = useLocalStorage<boolean>('policyAgreed', false);

    const [activeTab, setActiveTab] = useState<ActiveTab>('dailyLog');
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [modal, setModal] = useState<{ type: ModalType; data?: any }>({ type: null });
    const [configLoaded, setConfigLoaded] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
    const [showGuestBanner, setShowGuestBanner] = useState(() => {
        // Use sessionStorage to only show the banner once per session
        return isGuest && !sessionStorage.getItem('guestBannerDismissed');
    });

    // --- DERIVED STATE ---
    const activeEmployees = useMemo(() => employees.filter(e => e.status === 'Active'), [employees]);

    // --- EFFECTS ---
     useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Show policy modal if not agreed
        if (!isPolicyAgreed) {
            openModal('policy');
        }
    }, [isPolicyAgreed]);

    // Fetch remote config on app start to demonstrate OTA system
    useEffect(() => {
        remoteConfigService.fetchRemoteConfig().then(() => {
            setConfigLoaded(true);
        });
    }, []);

    const handleDismissGuestBanner = () => {
        sessionStorage.setItem('guestBannerDismissed', 'true');
        setShowGuestBanner(false);
    };

    const handleGeneratePayslip = useCallback((employeeId: string, period: string, allowance: number, deduction: number) => {
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) return null;

        const newPayslip = payslipService.generatePayslip(employee, period, dailyLogs, allowance, deduction);
        
        if (isMobileView) {
            openModal('viewPayslip', newPayslip);
        } else {
            setSelectedPayslip(newPayslip);
        }

        return newPayslip;
    }, [employees, dailyLogs, isMobileView]);

    const handleSavePayslip = useCallback((payslip: Payslip) => {
        setPayslips(prev => {
            const existingIndex = prev.findIndex(p => p.id === payslip.id);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = payslip;
                return updated;
            }
            return [...prev, payslip];
        });
        alert(t('payslipSavedSuccess', { employeeName: payslip.employeeName, period: payslip.period }));
    }, [setPayslips, t]);


    // --- MODAL & DELETE LOGIC ---
    const openModal = (type: ModalType, data?: any) => setModal({ type, data });
    const closeModal = () => setModal({ type: null });
    
    const handleDelete = () => {
        if (modal.type !== 'deleteConfirm' || !modal.data) return;
        const { itemType, id } = modal.data;
        
        switch (itemType) {
            case 'employee':
                setEmployees(prev => prev.filter(e => e.id !== id));
                break;
            case 'rate':
                setPieceRates(prev => prev.filter(r => r.id !== id));
                break;
            case 'log':
                 setDailyLogs(prev => prev.filter(l => l.id !== id));
                 break;
            case 'payslip':
                setPayslips(prev => prev.filter(p => p.id === id));
                if (selectedPayslip?.id === id) setSelectedPayslip(null);
                break;
        }
        closeModal();
    };

    // --- UI RENDERING ---

    const PolicyModal: React.FC = () => (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative animate-fade-in-up">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('policyTitle')}</h2>
                <div className="space-y-4 text-slate-600 max-h-[60vh] overflow-y-auto pr-2">
                    <p>{t('policyWelcome')}</p>
                    {[
                        { title: t('policyStorageTitle'), text: t('policyStorageText') },
                        { title: t('policyResponsibilityTitle'), text: t('policyResponsibilityText') },
                        { title: t('policyWarrantyTitle'), text: t('policyWarrantyText') },
                        { title: t('policyOfficialTitle'), text: t('policyOfficialText') }
                    ].map(item => (
                        <div key={item.title}>
                            <h3 className="font-semibold text-slate-700">{item.title}</h3>
                            <p>{item.text}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => { setIsPolicyAgreed(true); closeModal(); }} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                        {t('policyAgree')}
                    </button>
                </div>
            </div>
        </div>
    );

    const Modal: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-40 animate-fade-in" onClick={closeModal}>
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3">
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                       <XMarkIcon />
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );

     const DeleteConfirmationModal: React.FC = () => (
        <Modal title={t('confirmDeletionTitle')}>
            <p className="text-slate-600 mb-4">{t('confirmDeletionMessage')}</p>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">{t('cancel')}</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">{t('delete')}</button>
            </div>
        </Modal>
    );
    
    const DevAccessModalContent: React.FC = () => {
        const [devSettings, setDevSettings] = useLocalStorage<DevSettings>('dev_settings', { admobBannerId: '', adsenseClientId: '' });
        const [oneTimeCode, setOneTimeCode] = useState('');
        const [isCodeVerified, setIsCodeVerified] = useState(false);
        const [verificationMessage, setVerificationMessage] = useState('');
        const [formData, setFormData] = useState(devSettings);

        useEffect(() => {
            setFormData(devSettings);
        }, [devSettings]);

        const handleVerifyCode = () => {
            const validCodes = remoteConfigService.getTuningValue('admin_access_codes');
            if (validCodes.includes(oneTimeCode)) {
                setIsCodeVerified(true);
                setVerificationMessage(t('codeVerified'));
            } else {
                setIsCodeVerified(false);
                setVerificationMessage(t('invalidCode'));
            }
        };

        const handleSave = () => {
            setDevSettings(formData);
            alert(t('devSettingsSaved'));
            closeModal();
        };

        return (
            <div className="space-y-4">
                {!isCodeVerified ? (
                    <div className="space-y-2">
                         <label htmlFor="oneTimeCode" className="block text-sm font-medium text-slate-700">{t('oneTimeCode')}</label>
                        <div className="flex space-x-2">
                             <input type="text" id="oneTimeCode" value={oneTimeCode} onChange={e => setOneTimeCode(e.target.value)} placeholder={t('enterCode')} className="flex-grow mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900" />
                            <button onClick={handleVerifyCode} className="px-4 py-3 mt-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{t('verify')}</button>
                        </div>
                        {verificationMessage && <p className={`text-sm ${isCodeVerified ? 'text-green-600' : 'text-red-600'}`}>{verificationMessage}</p>}
                    </div>
                ) : (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded-md">
                        <p className="font-bold">{t('codeVerified')}</p>
                    </div>
                )}

                {isCodeVerified && (
                     <div className="space-y-4 border-t pt-4">
                        <h4 className="text-lg font-semibold text-slate-800">{t('devSettings')}</h4>
                         <p className="text-sm text-slate-500">{t('devSettingsInfo')}</p>
                        <div>
                             <label htmlFor="admobBannerId" className="block text-sm font-medium text-slate-700">{t('admobBannerId')}</label>
                             <input type="text" id="admobBannerId" value={formData.admobBannerId} onChange={e => setFormData({...formData, admobBannerId: e.target.value})} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900" />
                        </div>
                        <div>
                             <label htmlFor="adsenseClientId" className="block text-sm font-medium text-slate-700">{t('adsenseClientId')}</label>
                             <input type="text" id="adsenseClientId" value={formData.adsenseClientId} onChange={e => setFormData({...formData, adsenseClientId: e.target.value})} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900" />
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                            <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">{t('cancel')}</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"><SaveIcon /> {t('saveDevSettings')}</button>
                        </div>
                    </div>
                )}
            </div>
        );
    };


    // --- SUB-COMPONENTS FOR TABS ---
    const EmployeeManager = () => {
         const [formData, setFormData] = useState({ id: '', name: '', position: '', status: 'Active' as 'Active' | 'Inactive', profilePicture: '' });
         const fileInputRef = useRef<HTMLInputElement>(null);

         useEffect(() => {
            if (modal.type === 'editEmployee' && modal.data) {
                setFormData(modal.data);
            } else {
                setFormData({ id: '', name: '', position: '', status: 'Active', profilePicture: '' });
            }
         }, [modal]);

         const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({...prev, profilePicture: reader.result as string}));
                };
                reader.readAsDataURL(file);
            }
         };

         const handleSubmit = (e: React.FormEvent) => {
             e.preventDefault();
             if (!formData.name) return;
             if (modal.type === 'editEmployee') {
                 setEmployees(prev => prev.map(emp => emp.id === formData.id ? { ...emp, ...formData } : emp));
             } else {
                 setEmployees(prev => [...prev, { ...formData, id: Date.now().toString() }]);
             }
             closeModal();
         };
        
        const FormContent = (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">{t('fullName')}</label>
                    <input type="text" id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900" required />
                </div>
                <div>
                    <label htmlFor="position" className="block text-sm font-medium text-slate-700">{t('positionOptional')}</label>
                    <input type="text" id="position" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900" />
                </div>
                <div>
                     <label className="block text-sm font-medium text-slate-700">{t('profilePictureOptional')}</label>
                     <div className="mt-1 flex items-center space-x-4">
                         {formData.profilePicture ? <img src={formData.profilePicture} alt="preview" className="h-16 w-16 rounded-full object-cover" /> : <UserCircleIcon className="h-16 w-16 text-slate-300"/> }
                         <input type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" ref={fileInputRef}/>
                         <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm leading-4 font-medium text-slate-700 hover:bg-slate-50">{t('upload')}</button>
                     </div>
                </div>
                 <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t('status')}</label>
                    <select id="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})} className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-slate-900">
                        <option value="Active">{t('active')}</option>
                        <option value="Inactive">{t('inactive')}</option>
                    </select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"><SaveIcon /> {modal.type === 'editEmployee' ? t('saveChanges') : t('addEmployee')}</button>
                </div>
            </form>
        );

        return (
            <div>
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">{t('employees')}</h2>
                    <button onClick={() => openModal('addEmployee')} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105"><UserPlusIcon />{t('addEmployee')}</button>
                </div>
                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200 transition-shadow hover:shadow-xl">
                    <ul className="divide-y divide-slate-200">
                        {employees.length > 0 ? employees.map(emp => (
                            <li key={emp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center">
                                    {emp.profilePicture ? <img src={emp.profilePicture} alt={emp.name} className="h-12 w-12 rounded-full object-cover"/> : <UserCircleIcon className="h-12 w-12 text-slate-300"/>}
                                    <div className="ml-4">
                                        <p className="text-lg font-medium text-slate-900">{emp.name}</p>
                                        <p className="text-sm text-slate-500">{emp.position || t('noPosition')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{t(emp.status.toLowerCase() as any)}</span>
                                    <button onClick={() => openModal('editEmployee', emp)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-md transition-colors">{t('edit')}</button>
                                    <button onClick={() => openModal('deleteConfirm', { itemType: 'employee', id: emp.id })} className="p-2 text-slate-500 hover:text-red-600 rounded-md transition-colors"><TrashIcon /></button>
                                </div>
                            </li>
                        )) : <p className="p-6 text-center text-slate-500">{t('noEmployeeData')}</p>}
                    </ul>
                </div>
                { (modal.type === 'addEmployee' || modal.type === 'editEmployee') && 
                    <Modal title={modal.type === 'editEmployee' ? t('editEmployee') : t('addNewEmployee')}>
                        {FormContent}
                    </Modal>
                }
            </div>
        );
    };

    const RateManager = () => {
         const [formData, setFormData] = useState({ id: '', taskName: '', rate: '' });
         useEffect(() => {
            if (modal.type === 'editRate' && modal.data) {
                setFormData({ ...modal.data, rate: modal.data.rate.toString() });
            } else {
                setFormData({ id: '', taskName: '', rate: '' });
            }
         }, [modal]);

         const handleSubmit = (e: React.FormEvent) => {
             e.preventDefault();
             const rateValue = parseFloat(formData.rate);
             if (!formData.taskName || isNaN(rateValue) || rateValue <= 0) return;
             
             const rateData = { id: formData.id || Date.now().toString(), taskName: formData.taskName, rate: rateValue };

             if (modal.type === 'editRate') {
                 setPieceRates(prev => prev.map(r => r.id === rateData.id ? rateData : r));
             } else {
                 setPieceRates(prev => [...prev, rateData]);
             }
             closeModal();
         };

        const FormContent = (
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="taskName" className="block text-sm font-medium text-slate-700">{t('taskJobName')}</label>
                    <input type="text" id="taskName" value={formData.taskName} onChange={e => setFormData({...formData, taskName: e.target.value})} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900" required />
                </div>
                <div>
                    <label htmlFor="rate" className="block text-sm font-medium text-slate-700">{t('ratePerUnit')}</label>
                    <input type="number" id="rate" step="any" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900" required />
                </div>
                 <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"><SaveIcon /> {modal.type === 'editRate' ? t('saveChanges') : t('addRate')}</button>
                </div>
             </form>
        );
        
        return (
            <div>
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">{t('rates')}</h2>
                    <button onClick={() => openModal('addRate')} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105"><TagIcon /> {t('addRate')}</button>
                </div>
                 <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200 transition-shadow hover:shadow-xl">
                    <ul className="divide-y divide-slate-200">
                        {pieceRates.length > 0 ? pieceRates.map(rate => (
                            <li key={rate.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div>
                                    <p className="text-lg font-medium text-slate-900">{rate.taskName}</p>
                                    <p className="text-sm text-slate-500">{formatCurrency(rate.rate)} {t('perUnit')}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => openModal('editRate', rate)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-md transition-colors">{t('edit')}</button>
                                    <button onClick={() => openModal('deleteConfirm', { itemType: 'rate', id: rate.id })} className="p-2 text-slate-500 hover:text-red-600 rounded-md transition-colors"><TrashIcon /></button>
                                </div>
                            </li>
                        )) : <p className="p-6 text-center text-slate-500">{t('noRateData')}</p>}
                    </ul>
                </div>
                { (modal.type === 'addRate' || modal.type === 'editRate') && 
                    <Modal title={modal.type === 'editRate' ? t('editRate') : t('addRate')}>
                        {FormContent}
                    </Modal>
                }
            </div>
        )
    };
    
    const DailyLog = () => {
        const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
        const [presentEmployeeIds, setPresentEmployeeIds] = useState<string[]>([]);
        const [currentTasks, setCurrentTasks] = useState<DailyTask[]>([]);
        const [newTask, setNewTask] = useState<{pieceRateId: string, quantity: string}>({ pieceRateId: '', quantity: '' });

        const todaysLogs = useMemo(() => dailyLogs.filter(log => log.date === logDate).sort((a, b) => parseInt(b.id) - parseInt(a.id)), [dailyLogs, logDate]);
        const totalGross = useMemo(() => currentTasks.reduce((sum, task) => sum + task.subTotal, 0), [currentTasks]);
        const individualEarnings = useMemo(() => presentEmployeeIds.length > 0 ? totalGross / presentEmployeeIds.length : 0, [totalGross, presentEmployeeIds]);

        const handleEmployeeToggle = (id: string) => {
            setPresentEmployeeIds(prev => prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]);
        };

        const handleAddTask = () => {
            const rate = pieceRates.find(r => r.id === newTask.pieceRateId);
            const quantity = parseFloat(newTask.quantity);
            if (!rate || isNaN(quantity) || quantity <= 0) {
                 alert(t('alertSelectTaskAndQuantity'));
                 return;
            }
            setCurrentTasks(prev => [...prev, {
                pieceRateId: rate.id,
                taskName: rate.taskName,
                rate: rate.rate,
                quantity: quantity,
                subTotal: rate.rate * quantity
            }]);
            setNewTask({ pieceRateId: '', quantity: '' });
        };

        const handleSaveLog = () => {
            if (!logDate || presentEmployeeIds.length === 0 || currentTasks.length === 0) {
                alert(t('alertFillAllFields'));
                return;
            }
            const newLog: DailyGroupLog = {
                id: Date.now().toString(),
                date: logDate,
                tasks: currentTasks,
                presentEmployeeIds,
                totalGrossEarnings: totalGross,
                individualEarnings
            };
            setDailyLogs(prev => [...prev, newLog]);
            // Reset form
            setPresentEmployeeIds([]);
            setCurrentTasks([]);
        };

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Entry Form */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 space-y-4 transition-shadow hover:shadow-xl">
                         <h2 className="text-xl font-bold text-slate-800">{t('dailyGroupEntry')}</h2>
                         <div>
                            <label htmlFor="logDate" className="block text-sm font-medium text-slate-700 mb-1">{t('date')}</label>
                            <input type="date" id="logDate" value={logDate} onChange={e => setLogDate(e.target.value)} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">{t('selectPresentEmployees')}</label>
                            <div className="mt-2 border border-slate-300 rounded-md max-h-48 overflow-y-auto">
                                {activeEmployees.map(emp => (
                                    <div key={emp.id} className="flex items-center p-2 border-b last:border-0 hover:bg-slate-50">
                                        <input id={`emp-${emp.id}`} type="checkbox" checked={presentEmployeeIds.includes(emp.id)} onChange={() => handleEmployeeToggle(emp.id)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                                        <label htmlFor={`emp-${emp.id}`} className="ml-3 text-sm text-slate-700 cursor-pointer flex-grow">{emp.name}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                         {/* Task Adder */}
                        <div className="border-t pt-4 space-y-2">
                             <h3 className="text-lg font-semibold text-slate-700">{t('addTask')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <select value={newTask.pieceRateId} onChange={e => setNewTask({...newTask, pieceRateId: e.target.value})} className="block w-full text-base border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">{t('selectTask')}</option>
                                    {pieceRates.map(r => <option key={r.id} value={r.id}>{r.taskName}</option>)}
                                </select>
                                <input type="number" value={newTask.quantity} onChange={e => setNewTask({...newTask, quantity: e.target.value})} placeholder={t('totalQuantity')} className="block w-full text-base border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <button onClick={handleAddTask} className="w-full bg-slate-200 text-slate-800 py-3 rounded-lg hover:bg-slate-300 font-semibold transition-colors">{t('addTaskToList')}</button>
                        </div>

                         {/* Current Task List */}
                        {currentTasks.length > 0 && (
                             <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold text-slate-700">{t('todaysTaskList')}</h3>
                                <ul className="divide-y divide-slate-200">
                                    {currentTasks.map((task, idx) => (
                                        <li key={idx} className="py-2 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-slate-800">{task.taskName}</p>
                                                <p className="text-sm text-slate-500">{task.quantity} x {formatCurrency(task.rate)} = {formatCurrency(task.subTotal)}</p>
                                            </div>
                                            <button onClick={() => setCurrentTasks(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 text-sm font-medium">{t('remove')}</button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 pt-4 border-t text-right">
                                     <p className="font-semibold text-slate-600">{t('todaysTotal')}: <span className="text-xl font-bold text-slate-800 font-mono">{formatCurrency(totalGross)}</span></p>
                                     <p className="text-slate-500">{t('perPerson')}: <span className="font-semibold font-mono">{formatCurrency(individualEarnings)}</span></p>
                                </div>
                            </div>
                        )}
                        <button onClick={handleSaveLog} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105"><SaveIcon/>{t('saveDailyLog')}</button>
                    </div>

                     {/* Todays Logs */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 transition-shadow hover:shadow-xl">
                        <h2 className="text-xl font-bold text-slate-800">{t('logForDate')} {formatDate(logDate)}</h2>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            {todaysLogs.length > 0 ? todaysLogs.map(log => (
                                <div key={log.id} className="border border-slate-200 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                         <div>
                                            <p className="font-bold text-slate-800 text-lg font-mono">{formatCurrency(log.totalGrossEarnings)}</p>
                                            <p className="text-sm text-slate-500">{log.presentEmployeeIds.length} {t('workersPresent')} ({formatCurrency(log.individualEarnings)} / {t('perPerson')})</p>
                                        </div>
                                        <div>
                                            <button onClick={() => openModal('deleteConfirm', { itemType: 'log', id: log.id })} className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button>
                                        </div>
                                    </div>
                                    <ul className="mt-2 text-sm text-slate-600 list-disc list-inside">
                                        {log.tasks.map((t, i) => <li key={i}>{t.taskName} ({t.quantity})</li>)}
                                    </ul>
                                </div>
                            )) : <p className="text-slate-500 text-center py-8">{t('noLogEntries')}</p>}
                        </div>
                    </div>
                </div>
            </div>
        )
    };
    
    const PayslipGenerator = () => {
        const [employeeId, setEmployeeId] = useState('');
        const [period, setPeriod] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
        const [allowance, setAllowance] = useState('0');
        const [deduction, setDeduction] = useState('0');
        const [periodLogs, setPeriodLogs] = useState<PayslipLogEntry[]>([]);

        useEffect(() => {
            if (employeeId && period) {
                const employee = employees.find(e => e.id === employeeId);
                if (!employee) return;
                
                const [year, month] = period.split('-').map(Number);
                const periodMonth = month - 1;
                const periodYear = year;

                const relevantLogs = dailyLogs.filter(log => {
                    const logDate = new Date(log.date);
                    return log.presentEmployeeIds.includes(employeeId) && logDate.getUTCMonth() === periodMonth && logDate.getUTCFullYear() === periodYear;
                });
                
                 const logs: PayslipLogEntry[] = relevantLogs.map(dayLog => ({
                    date: dayLog.date,
                    taskName: dayLog.tasks.map(t => t.taskName).join(', '),
                    totalDailyGross: dayLog.totalGrossEarnings,
                    workersPresent: dayLog.presentEmployeeIds.length,
                    yourEarning: dayLog.individualEarnings
                }));

                setPeriodLogs(logs);

            } else {
                setPeriodLogs([]);
            }
        }, [employeeId, period, dailyLogs, employees]);

        const handleSingleGenerate = () => {
            if (!employeeId || !period) {
                alert(t('selectEmployee'));
                return;
            }
            handleGeneratePayslip(employeeId, period, parseFloat(allowance) || 0, parseFloat(deduction) || 0);
        };

        const BulkGenerator = () => {
            const [bulkPeriod, setBulkPeriod] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
            const [isGenerating, setIsGenerating] = useState(false);

            const executeBulkGenerate = () => {
                setIsGenerating(true);
                const newPayslips = payslipService.bulkGeneratePayslips(bulkPeriod, activeEmployees, dailyLogs);

                if (newPayslips.length > 0) {
                     setPayslips(prev => {
                        const updatedPayslips = [...prev];
                        newPayslips.forEach(np => {
                            const existingIndex = updatedPayslips.findIndex(p => p.employeeId === np.employeeId && p.period === np.period);
                            if (existingIndex > -1) {
                                updatedPayslips[existingIndex] = np;
                            } else {
                                updatedPayslips.push(np);
                            }
                        });
                        return updatedPayslips;
                     });
                }
                
                setIsGenerating(false);
                closeModal();
                alert(t('generationSummary', { successCount: newPayslips.length, failCount: activeEmployees.length - newPayslips.length }));
            };

            return (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 border-t-4 border-indigo-500 transition-shadow hover:shadow-xl">
                    <h2 className="text-xl font-bold text-slate-800">{t('bulkGenerate')}</h2>
                    <p className="text-slate-600 mt-2">{t('bulkGenerateDescription')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                         <div>
                             <label htmlFor="bulk-period" className="block text-sm font-medium text-slate-700">{t('periodMonth')}</label>
                            <input type="month" id="bulk-period" value={bulkPeriod} onChange={e => setBulkPeriod(e.target.value)} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900"/>
                        </div>
                    </div>
                     <div className="mt-4">
                        <button onClick={() => openModal('bulkGenerate')} className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                            <UsersIcon />
                            <span className="ml-2">{t('bulkGeneratePayslips')}</span>
                        </button>
                    </div>

                    {modal.type === 'bulkGenerate' && (
                        <Modal title={t('bulkGeneratePayslips')}>
                            <p className="text-slate-600 mb-4">{t('bulkGenerateDescription')}</p>
                            <div className="flex justify-end space-x-2">
                                 <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">{t('cancel')}</button>
                                 <button onClick={executeBulkGenerate} disabled={isGenerating} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center disabled:bg-indigo-400">
                                    {isGenerating ? t('generating') : t('generateAndSave')}
                                 </button>
                            </div>
                        </Modal>
                    )}
                </div>
            );
        };

        return (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 transition-shadow hover:shadow-xl">
                    <h2 className="text-xl font-bold text-slate-800">{t('generatePayslip')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label htmlFor="employee" className="block text-sm font-medium text-slate-700">{t('selectEmployee')}</label>
                            <select id="employee" value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="mt-1 block w-full text-base p-3 border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-slate-900">
                                <option value="">{t('selectEmployeeOption')}</option>
                                {activeEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label htmlFor="period" className="block text-sm font-medium text-slate-700">{t('periodMonth')}</label>
                            <input type="month" id="period" value={period} onChange={e => setPeriod(e.target.value)} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900"/>
                        </div>
                        <div>
                             <label htmlFor="allowance" className="block text-sm font-medium text-slate-700">{t('allowanceBonus')}</label>
                            <input type="number" id="allowance" value={allowance} onChange={e => setAllowance(e.target.value)} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900"/>
                        </div>
                        <div>
                             <label htmlFor="deduction" className="block text-sm font-medium text-slate-700">{t('deductions')}</label>
                            <input type="number" id="deduction" value={deduction} onChange={e => setDeduction(e.target.value)} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900"/>
                        </div>
                    </div>
                    <div className="mt-4">
                        <button onClick={handleSingleGenerate} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                            <SparklesIcon className="h-5 w-5 mr-2" />
                            {t('generatePayslip')}
                        </button>
                    </div>
                </div>

                {remoteConfigService.isFeatureEnabled('enableBulkGenerate') && <BulkGenerator />}

                {periodLogs.length > 0 && (
                     <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mt-6">
                        <h3 className="text-lg font-semibold text-slate-700">{t('dailyPieceRateEarnings')}</h3>
                        <div className="overflow-x-auto border rounded-lg mt-2 max-h-60">
                             <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-2">{t('date')}</th>
                                    <th scope="col" className="px-4 py-2">{t('tasks')}</th>
                                    <th scope="col" className="px-4 py-2 text-right">{t('yourEarning')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {periodLogs.map((log, index) => (
                                    <tr key={index} className="bg-white border-b last:border-b-0">
                                        <td className="px-4 py-2">{formatDate(log.date)}</td>
                                        <td className="px-4 py-2 font-medium text-slate-800">{log.taskName}</td>
                                        <td className="px-4 py-2 text-right font-mono font-semibold text-slate-800">{formatCurrency(log.yourEarning)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const PayslipHistory = () => {
        const sortedPayslips = useMemo(() => {
            return [...payslips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }, [payslips]);

        const viewPayslip = (payslip: Payslip) => {
            if (isMobileView) {
                openModal('viewPayslip', payslip);
            } else {
                setSelectedPayslip(payslip);
            }
        };

        return (
             <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('payslipHistory')}</h2>
                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200 transition-shadow hover:shadow-xl">
                    <ul className="divide-y divide-slate-200">
                        {sortedPayslips.length > 0 ? sortedPayslips.map(p => (
                            <li key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center">
                                    {p.employeeProfilePicture ? <img src={p.employeeProfilePicture} alt={p.employeeName} className="h-12 w-12 rounded-full object-cover"/> : <UserCircleIcon className="h-12 w-12 text-slate-300"/>}
                                    <div className="ml-4">
                                        <p className="text-lg font-medium text-slate-900">{p.employeeName}</p>
                                        <p className="text-sm text-slate-500">{t('period')}: {p.period}</p>
                                        <p className="text-sm font-mono font-semibold text-slate-700">{formatCurrency(p.netSalary)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                     <button onClick={() => viewPayslip(p)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-md transition-colors"><EyeIcon /></button>
                                     <button onClick={() => openModal('deleteConfirm', { itemType: 'payslip', id: p.id })} className="p-2 text-slate-500 hover:text-red-600 rounded-md transition-colors"><TrashIcon /></button>
                                </div>
                            </li>
                        )) : <p className="p-6 text-center text-slate-500">{t('noPayslipHistory')}</p>}
                    </ul>
                </div>
            </div>
        );
    };

    const Settings = () => {
        const fileRestoreRef = useRef<HTMLInputElement>(null);
        const [secretInputVisible, setSecretInputVisible] = useState(false);
        const [secretCode, setSecretCode] = useState('');

        useEffect(() => {
            if (secretCode.toLowerCase() === 'sat18 official') {
                openModal('devAccess');
                setSecretCode('');
                setSecretInputVisible(false);
            }
        }, [secretCode]);


        const handleBackup = () => {
            try {
                const dataToBackup = {
                    employees,
                    pieceRates,
                    dailyLogs,
                    payslips,
                };
                const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToBackup, null, 2))}`;
                const link = document.createElement("a");
                link.href = jsonString;
                link.download = `crewledger_backup_${currentUser.username}_${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                 alert(t('dataExportedSuccess'));
            } catch (error) {
                 alert(t('dataExportedError'));
                 console.error(error);
            }
        };

        const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            if (!confirm(t('confirmRestore'))) {
                 if (fileRestoreRef.current) fileRestoreRef.current.value = '';
                 return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== 'string') throw new Error('Invalid file content');
                    const data = JSON.parse(text);
                    if (data.employees && data.pieceRates && data.dailyLogs && data.payslips) {
                        setEmployees(data.employees);
                        setPieceRates(data.pieceRates);
                        setDailyLogs(data.dailyLogs);
                        setPayslips(data.payslips);
                        alert(t('dataRestoredSuccess'));
                    } else {
                        throw new Error('Invalid backup file format');
                    }
                } catch (error) {
                    alert(t('dataRestoredError', { error: (error as Error).message }));
                } finally {
                     if (fileRestoreRef.current) fileRestoreRef.current.value = '';
                }
            };
             reader.onerror = () => {
                alert(t('readFileError'));
                if (fileRestoreRef.current) fileRestoreRef.current.value = '';
             }
            reader.readAsText(file);
        };
        
        const SettingsCard: React.FC<{title: string; description: string; children: React.ReactNode; className?: string}> = ({ title, description, children, className }) => (
            <div className={`bg-white p-6 rounded-xl shadow-lg border border-slate-200/80 transition-shadow duration-300 hover:shadow-xl ${className || ''}`}>
                <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
                <div className="mt-4">{children}</div>
            </div>
        );


        return (
            <div className="space-y-6">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('profileAndSettings')}</h2>
                </div>
                <SettingsCard title={t('profile')} description="">
                    <div className="mt-4 space-y-2 text-slate-600">
                        <div className="flex"><strong className="w-32 font-medium">{t('fullName')}:</strong> <span>{currentUser.fullName}</span></div>
                        <div className="flex"><strong className="w-32 font-medium">{t('username')}:</strong> <span>{currentUser.username}</span></div>
                        <div className="flex"><strong className="w-32 font-medium">{t('email')}:</strong> <span>{currentUser.email}</span></div>
                        <div className="flex"><strong className="w-32 font-medium">{t('contactNumber')}:</strong> <span>{currentUser.contactNumber || '-'}</span></div>
                    </div>
                </SettingsCard>

                <SettingsCard title={t('languageAndCurrency')} description={t('languageAndCurrencyDesc')}>
                     <select
                        id="language-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'en' | 'id')}
                        className="mt-1 block w-full md:w-1/2 pl-3 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-slate-900"
                    >
                        <option value="en">{t('english')}</option>
                        <option value="id">{t('indonesian')}</option>
                    </select>
                </SettingsCard>

                 <SettingsCard title={t('localBackup')} description={t('localBackupDesc')}>
                     <button onClick={handleBackup} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center shadow-md hover:shadow-lg transition-all transform hover:scale-105"><DownloadIcon />{t('backupToFile')}</button>
                </SettingsCard>
                
                 <SettingsCard title={t('localRestore')} description={t('localRestoreDesc')}>
                    <div className="mt-2 p-3 bg-amber-100 border-l-4 border-amber-500 text-amber-700 rounded-r-md">
                        <p className="font-bold">{t('warning')}</p>
                        <p>{t('warningRestore')}</p>
                    </div>
                    <div className="mt-4">
                        <input type="file" id="restoreFile" accept=".json" onChange={handleRestore} className="hidden" ref={fileRestoreRef} />
                        <label htmlFor="restoreFile" className="cursor-pointer bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center w-max shadow-md hover:shadow-lg transition-all transform hover:scale-105"><UploadIcon />{t('restoreFromFile')}</label>
                    </div>
                </SettingsCard>
                
                <SettingsCard title={t('aboutThisApp')} description={t('aboutIntro')} className="relative">
                    <div className="space-y-4 text-slate-600 text-sm border-t pt-4">
                        <p dangerouslySetInnerHTML={{ __html: t('aboutThanks') }} />
                        <div>
                            <p>{t('aboutBugReportPrompt')}</p>
                            <a href="mailto:sayyidagustian@gmail.com" className="text-sm text-indigo-600 hover:underline font-semibold">
                                sayyidagustian@gmail.com
                            </a>
                        </div>
                    </div>
                    <button onClick={() => openModal('policy')} className="mt-4 text-sm text-indigo-600 hover:underline font-semibold">{t('viewRules')}</button>
                
                    <div 
                        className="absolute bottom-2 right-2 text-slate-300 hover:text-indigo-500 cursor-pointer p-1"
                        onClick={() => setSecretInputVisible(!secretInputVisible)}
                        title="dev"
                    >
                       @
                    </div>
                    {secretInputVisible && (
                        <input 
                            type="text"
                            value={secretCode}
                            onChange={(e) => setSecretCode(e.target.value)}
                            className="absolute bottom-9 right-2 p-1 border border-slate-300 rounded-md shadow-sm w-48 text-sm"
                            placeholder=""
                            autoFocus
                            onBlur={() => setSecretInputVisible(false)}
                        />
                    )}
                </SettingsCard>
            </div>
        );
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dailyLog': return <DailyLog />;
            case 'generator': return <PayslipGenerator />;
            case 'employees': return <EmployeeManager />;
            case 'rates': return <RateManager />;
            case 'history': return <PayslipHistory />;
            case 'settings': return <Settings />;
            default: return <DailyLog />;
        }
    };
    
    const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
        { id: 'dailyLog', label: t('dailyLog'), icon: <DocumentTextIcon /> },
        { id: 'generator', label: t('payslipGenerator'), icon: <SparklesIcon className="w-5 h-5" /> },
        { id: 'history', label: t('history'), icon: <ArchiveBoxIcon /> },
        { id: 'employees', label: t('employees'), icon: <UsersIcon /> },
        { id: 'rates', label: t('rates'), icon: <TagIcon /> },
        { id: 'settings', label: t('settings'), icon: <CogIcon /> },
    ];
    
    const SidebarContent = () => {
        const AppIcon = () => (
             <div className="h-10 w-10 mr-3 rounded-lg bg-white p-1 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <rect width="100" height="100" rx="20" fill="#4f46e5"/>
                    <rect x="25" y="25" width="50" height="60" rx="5" fill="white"/>
                    <rect x="35" y="38" width="30" height="5" rx="2" fill="#a5b4fc"/>
                    <rect x="35" y="50" width="30" height="5" rx="2" fill="#c7d2fe"/>
                    <rect x="35" y="62" width="15" height="5" rx="2" fill="#a5b4fc"/>
                </svg>
            </div>
        );

        return (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-700 flex items-center">
                    <AppIcon />
                    <div className="overflow-hidden">
                        <h1 className="text-xl font-bold text-white truncate">{t('appName')}</h1>
                        <p className="text-sm text-slate-300 truncate">{isGuest ? t('guestMode') : currentUser.fullName}</p>
                    </div>
                </div>
                <nav className="flex-grow p-2 space-y-1">
                    <ul>
                        {navItems.map(item => (
                            <li key={item.id}>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setActiveTab(item.id);
                                        if(isMobileView) setSidebarOpen(false);
                                    }}
                                    className={`flex items-center px-3 py-2.5 text-base rounded-md transition-colors ${
                                        activeTab === item.id 
                                        ? 'bg-indigo-700 text-white font-semibold shadow-inner' 
                                        : 'text-slate-200 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    <div className="w-5 h-5 mr-3 flex items-center justify-center">{item.icon}</div>
                                    <span>{item.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
                 <div className="p-2 mt-auto border-t border-slate-700">
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); onLogout(); }}
                        className="flex items-center px-3 py-3 text-base rounded-md text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <LogoutIcon />
                        <span>{isGuest ? t('exit') : t('logout')}</span>
                    </a>
                </div>
            </div>
        );
    };

    const activeTabLabel = navItems.find(item => item.id === activeTab)?.label || '';

    return (
        <div className="flex h-screen bg-slate-200 font-sans">
            <aside className="hidden lg:block w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-lg">
                <SidebarContent />
            </aside>
            
            {isSidebarOpen && (
                 <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}>
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                     <aside className="relative z-40 w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white h-full shadow-lg">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm p-4 flex items-center justify-between z-10">
                    <div className="flex items-center">
                         <button className="lg:hidden text-slate-500 mr-4" onClick={() => setSidebarOpen(true)}>
                            <MenuIcon />
                        </button>
                        <h2 className="text-xl font-bold text-slate-800">{activeTabLabel}</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Header controls can be added here */}
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                     {showGuestBanner && (
                        <div className="relative bg-indigo-100 text-indigo-800 p-4 rounded-lg mb-6 flex items-start animate-fade-in-down">
                            <InformationCircleIcon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                            <div className="flex-grow">
                                <p className="font-semibold">{t('guestMode')}</p>
                                <p className="text-sm">{t('registerToSavePrompt')}</p>
                                <button onClick={onLogout} className="mt-2 text-sm font-bold text-indigo-600 hover:underline">{t('registerNow')}</button>
                            </div>
                            <button onClick={handleDismissGuestBanner} className="absolute top-2 right-2 text-indigo-500 hover:text-indigo-700">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                     <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            {renderActiveTab()}
                        </div>
                        <div className="hidden lg:block lg:col-span-1">
                             <PayslipPreview payslip={selectedPayslip} />
                        </div>
                    </div>
                </div>
            </main>

            {modal.type === 'deleteConfirm' && <DeleteConfirmationModal />}
             {modal.type === 'devAccess' && (
                <Modal title={t('devAccess')}>
                   <DevAccessModalContent />
                </Modal>
            )}
            {modal.type === 'viewPayslip' && modal.data && (
                <Modal title={t('payslip')}>
                    <div className="max-h-[80vh] overflow-y-auto">
                        <PayslipPreview payslip={modal.data} />
                    </div>
                </Modal>
            )}
             {modal.type === 'policy' && <PolicyModal />}
        </div>
    );
};


// =================================================================
// LOGIN/REGISTER COMPONENT
// =================================================================
const LoginRegister: React.FC<{
    users: User[];
    onLogin: (user: User) => void;
    onRegister: (newUser: User) => void;
    onContinueAsGuest: () => void;
}> = ({ users, onLogin, onRegister, onContinueAsGuest }) => {
    const { t } = useI18n();
    const [isLoginView, setIsLoginView] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [contactNumber, setContactNumber] = useState('');

    const resetForm = () => {
        setFullName('');
        setUsername('');
        setEmail('');
        setPassword('');
        setContactNumber('');
        setError('');
    };

    const handleViewToggle = () => {
        setIsLoginView(!isLoginView);
        resetForm();
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user && user.password === password) {
            onLogin(user);
        } else {
            setError(t('authInvalidCredentials'));
        }
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError(t('authPasswordTooShort'));
            return;
        }
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            setError(t('authEmailExists'));
            return;
        }
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            setError(t('authUsernameExists'));
            return;
        }

        const newUser: User = {
            id: Date.now().toString(),
            fullName,
            username,
            email,
            password,
            contactNumber
        };
        onRegister(newUser);
    };

    const AppIcon = () => (
        <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-white p-1.5 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100" height="100" rx="20" fill="#4f46e5"/>
                <rect x="25" y="25" width="50" height="60" rx="5" fill="white"/>
                <rect x="35" y="38" width="30" height="5" rx="2" fill="#a5b4fc"/>
                <rect x="35" y="50" width="30" height="5" rx="2" fill="#c7d2fe"/>
                <rect x="35" y="62" width="15" height="5" rx="2" fill="#a5b4fc"/>
            </svg>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-slate-300 flex flex-col justify-center items-center p-4 font-sans">
            <div className="max-w-md w-full mx-auto">
                <AppIcon />
                <h1 className="text-3xl font-bold text-center text-slate-800">{t('appName')}</h1>
                <p className="text-center text-slate-500 mb-8">{t('appDescription')}</p>
                
                <div className="bg-white p-8 rounded-2xl shadow-2xl">
                    <h2 className="text-2xl font-semibold text-center text-slate-700 mb-6">{isLoginView ? t('login') : t('register')}</h2>
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-center mb-4 text-sm">{error}</p>}

                    <form onSubmit={isLoginView ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
                        {!isLoginView && (
                             <>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <IdentificationIcon />
                                    </span>
                                    <input type="text" placeholder={t('fullName')} value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                                </div>
                                 <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <UserCircleIcon className="h-5 w-5 text-slate-400" />
                                    </span>
                                    <input type="text" placeholder={t('username')} value={username} onChange={e => setUsername(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                                </div>
                            </>
                        )}
                        <div className="relative">
                             <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <AtSymbolIcon />
                            </span>
                            <input type="email" placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <LockClosedIcon />
                            </span>
                            <input type="password" placeholder={t('password')} value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                        </div>
                         {!isLoginView && (
                             <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <PhoneIcon />
                                </span>
                                <input type="tel" placeholder={t('contactNumberOptional')} value={contactNumber} onChange={e => setContactNumber(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                            </div>
                         )}

                        <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors transform hover:scale-105">
                            {isLoginView ? t('login') : t('register')}
                        </button>
                    </form>

                    <div className="flex items-center my-4">
                        <div className="flex-grow border-t border-slate-300"></div>
                        <span className="flex-shrink mx-4 text-slate-400 text-sm">{t('authOr')}</span>
                        <div className="flex-grow border-t border-slate-300"></div>
                    </div>
                    
                    <button onClick={onContinueAsGuest} className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-200 transition-colors">
                        {t('authContinueAsGuest')}
                    </button>
                    
                    <p className="text-center text-sm text-slate-500 mt-6">
                        {isLoginView ? t('authNoAccount') : t('authHaveAccount')}{' '}
                        <button onClick={handleViewToggle} className="font-semibold text-indigo-600 hover:underline">
                             {isLoginView ? t('registerHere') : t('loginHere')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};


// =================================================================
// AUTH GATE COMPONENT (The new top-level App)
// =================================================================
const GUEST_USER: User = {
    id: 'guest_user',
    fullName: 'Guest User',
    username: 'guest',
    email: 'guest@crewledger.app',
    password: '',
    contactNumber: ''
};

const App: React.FC = () => {
    const [users, setUsers] = useLocalStorage<User[]>('users', []);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);

    const handleRegister = (newUser: User) => {
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
    };
    
    const handleLogin = (user: User) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    const handleContinueAsGuest = () => {
        setCurrentUser(GUEST_USER);
    };

    return (
        <>
            {currentUser ? (
                <MainApp 
                    currentUser={currentUser} 
                    onLogout={handleLogout} 
                    isGuest={currentUser.id === GUEST_USER.id}
                />
            ) : (
                <LoginRegister 
                    users={users} 
                    onLogin={handleLogin} 
                    onRegister={handleRegister}
                    onContinueAsGuest={handleContinueAsGuest}
                />
            )}
        </>
    );
};

export default App;