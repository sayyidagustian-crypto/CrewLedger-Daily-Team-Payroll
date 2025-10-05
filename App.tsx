
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Employee, PieceRate, DailyGroupLog, Payslip, DailyTask, PayslipLogEntry, AppConfig } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { PayslipPreview } from './components/PayslipPreview';
import { UserPlusIcon, TrashIcon, SaveIcon, UsersIcon, DocumentTextIcon, ArchiveBoxIcon, TagIcon, UserCircleIcon, CogIcon, UploadIcon, DownloadIcon, EyeIcon, XMarkIcon, SparklesIcon, MenuIcon } from './components/icons';
import { useI18n } from './i18n';
import { remoteConfigService } from './services/remoteConfig';
import { payslipService } from './services/payslipService';

type ActiveTab = 'dailyLog' | 'generator' | 'employees' | 'rates' | 'history' | 'settings';
type ModalType = null | 'addEmployee' | 'editEmployee' | 'addRate' | 'editRate' | 'deleteConfirm' | 'bulkGenerate' | 'viewPayslip' | 'policy';


// =================================================================
// MAIN APP COMPONENT
// =================================================================
const App: React.FC = () => {
    const { t, language, setLanguage, formatDate, formatCurrency } = useI18n();

    // --- STATE MANAGEMENT ---
    const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
    const [pieceRates, setPieceRates] = useLocalStorage<PieceRate[]>('pieceRates', []);
    const [dailyLogs, setDailyLogs] = useLocalStorage<DailyGroupLog[]>('dailyLogs', []);
    const [payslips, setPayslips] = useLocalStorage<Payslip[]>('payslips', []);
    const [isPolicyAgreed, setIsPolicyAgreed] = useLocalStorage<boolean>('policyAgreed', false);

    const [activeTab, setActiveTab] = useState<ActiveTab>('dailyLog');
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [modal, setModal] = useState<{ type: ModalType; data?: any }>({ type: null });
    const [configLoaded, setConfigLoaded] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);

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
                setPayslips(prev => prev.filter(p => p.id !== id));
                if (selectedPayslip?.id === id) setSelectedPayslip(null);
                break;
        }
        closeModal();
    };

    // --- UI RENDERING ---

    const PolicyModal: React.FC = () => (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative animate-fade-in-up">
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
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
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
                    <input type="text" id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900" required />
                </div>
                <div>
                    <label htmlFor="position" className="block text-sm font-medium text-slate-700">{t('positionOptional')}</label>
                    <input type="text" id="position" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900" />
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
                    <select id="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-slate-900">
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
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">{t('employees')}</h2>
                    <button onClick={() => openModal('addEmployee')} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center"><UserPlusIcon />{t('addEmployee')}</button>
                </div>
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <ul className="divide-y divide-slate-200">
                        {employees.length > 0 ? employees.map(emp => (
                            <li key={emp.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center">
                                    {emp.profilePicture ? <img src={emp.profilePicture} alt={emp.name} className="h-12 w-12 rounded-full object-cover"/> : <UserCircleIcon className="h-12 w-12 text-slate-300"/>}
                                    <div className="ml-4">
                                        <p className="text-lg font-medium text-slate-900">{emp.name}</p>
                                        <p className="text-sm text-slate-500">{emp.position || t('noPosition')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{t(emp.status.toLowerCase() as any)}</span>
                                    <button onClick={() => openModal('editEmployee', emp)} className="p-2 text-slate-500 hover:text-indigo-600">{t('edit')}</button>
                                    <button onClick={() => openModal('deleteConfirm', { itemType: 'employee', id: emp.id })} className="p-2 text-slate-500 hover:text-red-600"><TrashIcon /></button>
                                </div>
                            </li>
                        )) : <p className="p-4 text-center text-slate-500">{t('noEmployeeData')}</p>}
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
                    <input type="text" id="taskName" value={formData.taskName} onChange={e => setFormData({...formData, taskName: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900" required />
                </div>
                <div>
                    <label htmlFor="rate" className="block text-sm font-medium text-slate-700">{t('ratePerUnit')}</label>
                    <input type="number" id="rate" step="any" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900" required />
                </div>
                 <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"><SaveIcon /> {modal.type === 'editRate' ? t('saveChanges') : t('addRate')}</button>
                </div>
             </form>
        );
        
        return (
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">{t('rates')}</h2>
                    <button onClick={() => openModal('addRate')} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center"><TagIcon /> {t('addRate')}</button>
                </div>
                 <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <ul className="divide-y divide-slate-200">
                        {pieceRates.length > 0 ? pieceRates.map(rate => (
                            <li key={rate.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div>
                                    <p className="text-lg font-medium text-slate-900">{rate.taskName}</p>
                                    <p className="text-sm text-slate-500">{formatCurrency(rate.rate)} {t('perUnit')}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => openModal('editRate', rate)} className="p-2 text-slate-500 hover:text-indigo-600">{t('edit')}</button>
                                    <button onClick={() => openModal('deleteConfirm', { itemType: 'rate', id: rate.id })} className="p-2 text-slate-500 hover:text-red-600"><TrashIcon /></button>
                                </div>
                            </li>
                        )) : <p className="p-4 text-center text-slate-500">{t('noRateData')}</p>}
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

        const todaysLogs = useMemo(() => dailyLogs.filter(log => log.date === logDate), [dailyLogs, logDate]);
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
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                         <h2 className="text-xl font-bold text-slate-800">{t('dailyGroupEntry')}</h2>
                         <div>
                            <label htmlFor="logDate" className="block text-sm font-medium text-slate-700">{t('date')}</label>
                            <input type="date" id="logDate" value={logDate} onChange={e => setLogDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700">{t('selectPresentEmployees')}</label>
                            <div className="mt-2 border border-slate-300 rounded-md max-h-48 overflow-y-auto">
                                {activeEmployees.map(emp => (
                                    <div key={emp.id} className="flex items-center p-2 border-b last:border-0">
                                        <input id={`emp-${emp.id}`} type="checkbox" checked={presentEmployeeIds.includes(emp.id)} onChange={() => handleEmployeeToggle(emp.id)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded" />
                                        <label htmlFor={`emp-${emp.id}`} className="ml-3 text-sm text-slate-700">{emp.name}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                         {/* Task Adder */}
                        <div className="border-t pt-4 space-y-2">
                             <h3 className="text-lg font-semibold text-slate-700">{t('addTask')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <select value={newTask.pieceRateId} onChange={e => setNewTask({...newTask, pieceRateId: e.target.value})} className="block w-full text-sm border-slate-300 rounded-md text-slate-900">
                                    <option value="">{t('selectTask')}</option>
                                    {pieceRates.map(r => <option key={r.id} value={r.id}>{r.taskName}</option>)}
                                </select>
                                <input type="number" value={newTask.quantity} onChange={e => setNewTask({...newTask, quantity: e.target.value})} placeholder={t('totalQuantity')} className="block w-full text-sm border-slate-300 rounded-md text-slate-900" />
                            </div>
                            <button onClick={handleAddTask} className="w-full bg-slate-200 text-slate-800 py-2 rounded-md hover:bg-slate-300">{t('addTaskToList')}</button>
                        </div>

                         {/* Current Task List */}
                        {currentTasks.length > 0 && (
                             <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold text-slate-700">{t('todaysTaskList')}</h3>
                                <ul className="divide-y">
                                    {currentTasks.map((task, idx) => (
                                        <li key={idx} className="py-2 flex justify-between items-center">
                                            <div>
                                                <p>{task.taskName}</p>
                                                <p className="text-sm text-slate-500">{task.quantity} x {formatCurrency(task.rate)} = {formatCurrency(task.subTotal)}</p>
                                            </div>
                                            <button onClick={() => setCurrentTasks(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 text-sm">{t('remove')}</button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 pt-4 border-t text-right">
                                     <p className="font-semibold text-slate-600">{t('todaysTotal')}: <span className="text-xl font-bold text-slate-800">{formatCurrency(totalGross)}</span></p>
                                     <p className="text-slate-500">{t('perPerson')}: <span className="font-semibold">{formatCurrency(individualEarnings)}</span></p>
                                </div>
                            </div>
                        )}
                        <button onClick={handleSaveLog} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center"><SaveIcon/>{t('saveDailyLog')}</button>
                    </div>

                     {/* Todays Logs */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-slate-800">{t('logForDate')} {formatDate(logDate)}</h2>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            {todaysLogs.length > 0 ? todaysLogs.map(log => (
                                <div key={log.id} className="border p-4 rounded-md">
                                    <div className="flex justify-between items-start">
                                         <div>
                                            <p className="font-bold text-slate-800 text-lg">{formatCurrency(log.totalGrossEarnings)}</p>
                                            <p className="text-sm text-slate-500">{log.presentEmployeeIds.length} {t('workersPresent')} ({formatCurrency(log.individualEarnings)} / {t('perPerson')})</p>
                                        </div>
                                        <div>
                                            <button onClick={() => openModal('deleteConfirm', { itemType: 'log', id: log.id })} className="text-red-500"><TrashIcon /></button>
                                        </div>
                                    </div>
                                    <ul className="mt-2 text-sm text-slate-600">
                                        {log.tasks.map((t, i) => <li key={i}>- {t.taskName} ({t.quantity})</li>)}
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
                <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-amber-400">
                    <h2 className="text-xl font-bold text-slate-800">{t('bulkGenerate')}</h2>
                    <p className="text-slate-600 mt-2">{t('bulkGenerateDescription')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                         <div>
                             <label htmlFor="bulk-period" className="block text-sm font-medium text-slate-700">{t('periodMonth')}</label>
                            <input type="month" id="bulk-period" value={bulkPeriod} onChange={e => setBulkPeriod(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900"/>
                        </div>
                    </div>
                     <div className="mt-4">
                        <button onClick={() => openModal('bulkGenerate')} className="w-full bg-amber-500 text-white font-bold py-3 rounded-lg hover:bg-amber-600 flex items-center justify-center">
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
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-slate-800">{t('generatePayslip')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label htmlFor="employee" className="block text-sm font-medium text-slate-700">{t('selectEmployee')}</label>
                            <select id="employee" value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="mt-1 block w-full text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-slate-900">
                                <option value="">{t('selectEmployeeOption')}</option>
                                {activeEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label htmlFor="period" className="block text-sm font-medium text-slate-700">{t('periodMonth')}</label>
                            <input type="month" id="period" value={period} onChange={e => setPeriod(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900"/>
                        </div>
                        <div>
                             <label htmlFor="allowance" className="block text-sm font-medium text-slate-700">{t('allowanceBonus')}</label>
                            <input type="number" id="allowance" value={allowance} onChange={e => setAllowance(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900"/>
                        </div>
                        <div>
                             <label htmlFor="deduction" className="block text-sm font-medium text-slate-700">{t('deductions')}</label>
                            <input type="number" id="deduction" value={deduction} onChange={e => setDeduction(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900"/>
                        </div>
                    </div>
                    <div className="mt-4">
                        <button onClick={handleSingleGenerate} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center">
                            <SparklesIcon className="h-5 w-5 mr-2" />
                            {t('generatePayslip')}
                        </button>
                    </div>
                </div>

                {remoteConfigService.isFeatureEnabled('enableBulkGenerate') && <BulkGenerator />}

                {periodLogs.length > 0 && (
                     <div className="bg-white p-6 rounded-lg shadow-md mt-6">
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
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <ul className="divide-y divide-slate-200">
                        {sortedPayslips.length > 0 ? sortedPayslips.map(p => (
                            <li key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center">
                                    {p.employeeProfilePicture ? <img src={p.employeeProfilePicture} alt={p.employeeName} className="h-12 w-12 rounded-full object-cover"/> : <UserCircleIcon className="h-12 w-12 text-slate-300"/>}
                                    <div className="ml-4">
                                        <p className="text-lg font-medium text-slate-900">{p.employeeName}</p>
                                        <p className="text-sm text-slate-500">{t('period')}: {p.period}</p>
                                        <p className="text-sm font-mono text-slate-700">{formatCurrency(p.netSalary)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                     <button onClick={() => viewPayslip(p)} className="p-2 text-slate-500 hover:text-indigo-600"><EyeIcon /></button>
                                     <button onClick={() => openModal('deleteConfirm', { itemType: 'payslip', id: p.id })} className="p-2 text-slate-500 hover:text-red-600"><TrashIcon /></button>
                                </div>
                            </li>
                        )) : <p className="p-4 text-center text-slate-500">{t('noPayslipHistory')}</p>}
                    </ul>
                </div>
            </div>
        );
    };

    const Settings = () => {
        const fileRestoreRef = useRef<HTMLInputElement>(null);
        const [isOwnerMode, setIsOwnerMode] = useLocalStorage<boolean>('isOwnerMode', false);
        const [appConfig, setAppConfig] = useLocalStorage<AppConfig>('appConfig', {
            appName: '',
            appDescription: '',
            appIcon: '',
            admobBannerId: ''
        });
        const [usedCodes, setUsedCodes] = useLocalStorage<string[]>('usedAdminCodes', []);
        const [accessCode, setAccessCode] = useState('');

        // This is the one-time code you can ask AI Studio to change.
        const ADMIN_CODE = 'ADMIN-CODE-001';
        
        const handleUnlockOwnerMode = () => {
            if (accessCode.trim() !== ADMIN_CODE) {
                alert(t('ownerCodeInvalidError'));
                setAccessCode('');
                return;
            }
    
            if (usedCodes.includes(ADMIN_CODE)) {
                alert(t('ownerCodeUsedError'));
                setAccessCode('');
                return;
            }
    
            // Success
            setIsOwnerMode(true);
            setUsedCodes(prev => [...prev, ADMIN_CODE]);
            setAccessCode(''); // Clear the code after successful use
        };
    
        const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setAppConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
        };
    
        const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAppConfig(prev => ({...prev, appIcon: reader.result as string}));
                };
                reader.readAsDataURL(file);
            }
        };
        
        const resetConfig = () => {
            if (confirm(t('confirmResetSettings'))) {
                setAppConfig({ appName: '', appDescription: '', appIcon: '', admobBannerId: '' });
                alert(t('settingsReset'));
            }
        };

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
                link.download = `crewledger_backup_${new Date().toISOString().split('T')[0]}.json`;
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

        return (
            <div className="space-y-8">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('settings')}</h2>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-slate-800">{t('languageAndCurrency')}</h3>
                    <p className="text-sm text-slate-500 mt-1">{t('languageAndCurrencyDesc')}</p>
                    <div className="mt-4">
                        <label htmlFor="language-select" className="block text-sm font-medium text-slate-700">{t('language')}</label>
                        <select
                            id="language-select"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'en' | 'id')}
                            className="mt-1 block w-full md:w-1/2 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-slate-900"
                        >
                            <option value="en">{t('english')}</option>
                            <option value="id">{t('indonesian')}</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-slate-800">{t('localBackup')}</h3>
                    <p className="text-sm text-slate-500 mt-1">{t('localBackupDesc')}</p>
                    <button onClick={handleBackup} className="mt-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center"><DownloadIcon />{t('backupToFile')}</button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-slate-800">{t('localRestore')}</h3>
                    <p className="text-sm text-slate-500 mt-1">{t('localRestoreDesc')}</p>
                    <div className="mt-2 p-3 bg-amber-100 border-l-4 border-amber-500 text-amber-700">
                        <p className="font-bold">{t('warning')}</p>
                        <p>{t('warningRestore')}</p>
                    </div>
                    <div className="mt-4">
                        <input type="file" id="restoreFile" accept=".json" onChange={handleRestore} className="hidden" ref={fileRestoreRef} />
                        <label htmlFor="restoreFile" className="cursor-pointer bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center w-max"><UploadIcon />{t('restoreFromFile')}</label>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                     <h3 className="text-lg font-semibold text-slate-800">{t('aboutThisApp')}</h3>
                     <p className="text-sm text-slate-600 mt-2">{t('aboutText')}</p>
                     <button onClick={() => openModal('policy')} className="mt-6 text-sm text-indigo-600 hover:underline">{t('viewRules')}</button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-slate-800">{t('ownerMode')}</h3>
                    <p className="text-sm text-slate-500 mt-1">{t('ownerModeDesc')}</p>
                    <div className="mt-4">
                        {isOwnerMode ? (
                            <button onClick={() => setIsOwnerMode(false)} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">{t('exitOwnerMode')}</button>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    placeholder={t('ownerCodePlaceholder')}
                                    className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                                    aria-label={t('ownerCodePlaceholder')}
                                />
                                <button onClick={handleUnlockOwnerMode} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-700">{t('unlock')}</button>
                            </div>
                        )}
                    </div>
                </div>

                {isOwnerMode && (
                    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-indigo-500 animate-fade-in">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">{t('ownerSettings')}</h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-lg font-semibold text-slate-700">{t('appCustomization')}</h4>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label htmlFor="appName" className="block text-sm font-medium text-slate-700">{t('customizeAppName')}</label>
                                        <input type="text" name="appName" id="appName" value={appConfig.appName} onChange={handleConfigChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900" placeholder={t('appName')} />
                                    </div>
                                    <div>
                                        <label htmlFor="appDescription" className="block text-sm font-medium text-slate-700">{t('customizeAppDesc')}</label>
                                        <textarea name="appDescription" id="appDescription" value={appConfig.appDescription} onChange={handleConfigChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900" placeholder={t('appDescription')} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">{t('customizeAppIcon')}</label>
                                        <div className="mt-1 flex items-center space-x-4">
                                            {appConfig.appIcon ? <img src={appConfig.appIcon} alt="preview" className="h-16 w-16 object-cover rounded-md bg-slate-100" /> : <div className="h-16 w-16 bg-slate-100 rounded-md flex items-center justify-center text-slate-400">Preview</div> }
                                            <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" id="icon-upload" />
                                            <label htmlFor="icon-upload" className="cursor-pointer bg-white py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm leading-4 font-medium text-slate-700 hover:bg-slate-50">{t('upload')}</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-slate-700">{t('admobSettings')}</h4>
                                <p className="text-sm text-slate-500 mt-1">{t('admobSettingsDesc')}</p>
                                <div className="mt-4">
                                    <label htmlFor="admobBannerId" className="block text-sm font-medium text-slate-700">{t('admobBannerId')}</label>
                                    <input type="text" name="admobBannerId" id="admobBannerId" value={appConfig.admobBannerId} onChange={handleConfigChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900" placeholder="ca-app-pub-..." />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 border-t pt-4">
                                <button onClick={resetConfig} type="button" className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">{t('resetSettings')}</button>
                                <button onClick={() => alert(t('settingsSaved'))} type="button" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"><SaveIcon /> {t('saveSettings')}</button>
                            </div>
                        </div>
                    </div>
                )}
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
        const [appConfig] = useLocalStorage<AppConfig>('appConfig', { appName: '', appDescription: '', appIcon: '', admobBannerId: '' });

        const AppIcon = () => {
            if (appConfig.appIcon) {
                return <img src={appConfig.appIcon} alt="App Icon" className="h-12 w-12 rounded-lg mr-3 object-cover flex-shrink-0" />;
            }
            return (
                <div className="h-12 w-12 mr-3 rounded-lg bg-white p-1 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                        <rect width="100" height="100" rx="20" fill="#4f46e5"/>
                        <rect x="25" y="25" width="50" height="60" rx="5" fill="white"/>
                        <rect x="35" y="38" width="30" height="5" rx="2" fill="#a5b4fc"/>
                        <rect x="35" y="50" width="30" height="5" rx="2" fill="#c7d2fe"/>
                        <rect x="35" y="62" width="15" height="5" rx="2" fill="#a5b4fc"/>
                    </svg>
                </div>
            );
        };

        return (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-700 flex items-center">
                    <AppIcon />
                    <div className="overflow-hidden">
                        <h1 className="text-xl font-bold text-white truncate">{appConfig.appName || t('appName')}</h1>
                        <p className="text-sm text-slate-300 truncate">{appConfig.appDescription || t('appDescription')}</p>
                    </div>
                </div>
                <nav className="flex-grow p-2">
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
                                    className={`flex items-center px-3 py-3 text-lg rounded-md transition-colors ${
                                        activeTab === item.id 
                                        ? 'bg-indigo-700 text-white' 
                                        : 'text-slate-200 hover:bg-slate-600 hover:text-white'
                                    }`}
                                >
                                    <div className="w-5 h-5 mr-3 flex items-center justify-center">{item.icon}</div>
                                    <span>{item.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            <aside className="hidden lg:block w-64 bg-slate-800 text-white shadow-lg">
                <SidebarContent />
            </aside>
            
            {isSidebarOpen && (
                 <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}>
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                     <aside className="relative z-40 w-64 bg-slate-800 text-white h-full shadow-lg">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm p-4 flex items-center justify-between lg:justify-end">
                    <button className="lg:hidden text-slate-500" onClick={() => setSidebarOpen(true)}>
                        <MenuIcon />
                    </button>
                    <div className="flex items-center space-x-4">
                        {/* Header controls can be added here */}
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
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

export default App;
