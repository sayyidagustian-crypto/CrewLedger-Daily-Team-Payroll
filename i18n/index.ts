

import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';

// 1. Define Translation Data
const translations = {
  en: {
    // General
    appName: 'CrewLedger',
    appDescription: 'Daily Team Payroll',
    welcomeMessage: 'Welcome to CrewLedger',
    menuHint: 'Use the menu on the left to start managing your data.',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDeletionTitle: 'Confirm Deletion',
    confirmDeletionMessage: 'Are you sure you want to delete this item? This action cannot be undone.',

    // Tabs
    dailyLog: 'Daily Log',
    payslipGenerator: 'Payslip Generator',
    history: 'History',
    employees: 'Employees',
    rates: 'Rates',
    settings: 'Settings',

    // Employee Manager
    addEmployee: 'Add Employee',
    addNewEmployee: 'Add New Employee',
    fullName: 'Full Name',
    fullNamePlaceholder: 'e.g. John Doe',
    positionOptional: 'Position (Optional)',
    positionPlaceholder: 'e.g. Field Staff',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    profilePictureOptional: 'Profile Picture (Optional)',
    employeeList: 'Employee List',
    noPosition: 'No position',
    noEmployeeData: 'No employee data yet.',

    // Rate Manager
    addRate: 'Add Rate',
    taskJobName: 'Task/Job Name',
    taskPlaceholder: 'e.g. Brick Laying',
    ratePerUnit: 'Rate per Unit',
    ratePlaceholder: 'e.g. 15.50',
    rateList: 'Rate List',
    perUnit: '/ unit',
    noRateData: 'No rate data yet.',
    
    // Daily Log
    dailyGroupEntry: 'Daily Group Entry',
    date: 'Date',
    selectPresentEmployees: 'Select Present Employees',
    employeesSelected: 'selected',
    addTask: 'Add Task',
    task: 'Task',
    selectTask: '-- Select Task --',
    totalQuantity: 'Total Quantity',
    quantityPlaceholder: 'e.g. 100',
    addTaskToList: '+ Add Task to List',
    todaysTaskList: "Today's Task List",
    remove: 'Remove',
    todaysTotal: "Today's Total",
    saveDailyLog: 'Save Daily Log',
    logForDate: 'Log for Date',
    workersPresent: 'workers present',
    perPerson: '/person',
    deleteLogEntry: 'Delete this Log Entry',
    noLogEntries: 'No log entries for this date.',
    alertFillAllFields: 'Please fill in the date, select at least one employee, and add at least one task.',
    alertSelectTaskAndQuantity: 'Please select a task and enter the quantity.',

    // Payslip Generator
    generatePayslip: 'Generate Payslip',
    selectEmployee: 'Select Employee',
    selectEmployeeOption: '-- Select Employee --',
    periodMonth: 'Period (Month)',
    allowanceBonus: 'Allowance / Bonus',
    deductions: 'Deductions',
    savePayslipToHistory: 'Save Payslip to History',
    payslipSavedSuccess: 'Payslip for {{employeeName}} for period {{period}} has been saved successfully.',
    bulkGenerate: 'Bulk Generate',
    bulkGeneratePayslips: 'Bulk Generate Payslips',
    bulkGenerateDescription: 'This will generate and save payslips for all active employees who have earnings in the selected period.',
    generateAndSave: 'Generate & Save',
    generating: 'Generating...',
    generationComplete: 'Generation Complete',
    generationSummary: 'Successfully generated {{successCount}} payslips. {{failCount}} employees had no earnings for this period.',
    
    // History
    payslipHistory: 'Payslip History',
    noPayslipHistory: 'No saved payslip history.',

    // Settings
    aboutThisApp: 'About This App',
    aboutText: 'This application was created to simplify the recording and calculation of piece-rate wages with an equal-sharing system.',
    acknowledgements: 'Acknowledgements',
    ackGod: 'God Almighty, for all His guidance and blessings.',
    ackContributors: 'Contributors and users who provided valuable feedback.',
    builtWith: 'Built with Assistance From',
    viewRules: 'View Rules & Privacy Policy',
    cloudSyncComingSoon: 'Cloud Sync (Coming Soon)',
    cloudSyncDesc: 'This is an optional feature that is not yet enabled, to keep the app free and simple to configure.',
    cloudSyncBackupHint: 'You can still use the "Local Backup" feature below to securely save your data to your device.',
    googleDriveSync: 'Google Drive Sync',
    googleDriveSyncDesc: 'Link your Google account to securely back up and restore data to your Google Drive.',
    connectGoogle: 'Connect Google Account',
    signInToEnable: 'Sign In to Enable',
    signInToEnableDesc: 'Sign in with your Google account to enable cloud backup and restore.',
    backup: 'Backup',
    restore: 'Restore',
    disconnectAccount: 'Disconnect Account',
    localBackup: 'Local Backup',
    localBackupDesc: 'Save all your application data to a JSON file on this device.',
    backupToFile: 'Backup Data to File',
    localRestore: 'Local Restore',
    localRestoreDesc: 'Choose a backup file (.json) from your device to restore data.',
    warning: 'Warning',
    warningRestore: 'This action will overwrite all existing data in the app.',
    restoreFromFile: 'Restore Data from File',
    dataExportedSuccess: 'Data exported successfully! Save this file in a safe place, like Google Drive.',
    dataExportedError: 'Failed to export data.',
    confirmRestore: 'ATTENTION: Restoring data will overwrite ALL current data. This action cannot be undone. Proceed?',
    dataRestoredSuccess: 'Data restored successfully! The application will now reload to apply the changes.',
    dataRestoredError: 'Failed to restore data: {{error}}',
    readFileError: 'Failed to read file.',
    languageAndCurrency: 'Language & Currency',
    languageAndCurrencyDesc: 'Select the display language. The currency will be set automatically (IDR for Indonesian, USD for English).',
    language: 'Language',
    english: 'English',
    indonesian: 'Indonesian',
    reportProblem: 'Report a Problem',
    reportProblemDesc: 'Found a bug or have a suggestion? Let us know!',
    openReportForm: 'Open Report Form',
    reportModalTitle: 'Report a Problem or Suggestion',
    reportIntro: 'Please describe the issue you are facing or your suggestion for improvement. Be as detailed as possible.',
    reportSubject: 'Subject',
    reportSubjectPlaceholder: 'e.g., Calculation error on daily log',
    reportDescription: 'Description',
    reportDescriptionPlaceholder: 'e.g., Steps to reproduce:\n1. Go to Daily Log page\n2. ...',
    sendReport: 'Send Report via Email',

    // Guest Mode
    continueAsGuest: 'Continue as Guest',
    guestUser: 'Guest User',
    signIn: 'Sign In',
    logout: 'Sign Out',
    
    // Policy Modal
    policyTitle: 'Rules & Privacy Policy',
    policyWelcome: 'Welcome! Before using the app, please read and agree to the following points:',
    policyStorageTitle: '1. Data Storage',
    policyStorageText: "All data you enter (employee data, rates, daily logs) is stored locally on your device using the browser's Local Storage. This data is not sent to or stored on any external server by this application.",
    policyGoogleTitle: '2. Google Drive Sync (Optional)',
    policyGoogleText: 'This app provides a feature to back up and restore data to your personal Google Drive. This feature is entirely optional. If you choose to use it, the app will request permission to access your Google Drive solely to create and read the app-specific backup file (`crewledger-backup.json`). We do not have access to any other files in your Drive.',
    policyResponsibilityTitle: '3. User Responsibility',
    policyResponsibilityText: 'You are solely responsible for the accuracy of the data entered. The developer is not liable for calculation errors caused by incorrect data input. Please always double-check your entries.',
    policyWarrantyTitle: '4. No Warranty',
    policyWarrantyText: 'This application is provided "as is" without any warranty. While we strive to make this app as accurate as possible, we do not guarantee it will be free of bugs or errors.',
    policyOfficialTitle: '5. Not an Official Tool',
    policyOfficialText: 'This is a helper tool and is not intended as a legally validated payroll system. Use it wisely.',
    policyAgree: 'I Understand and Agree',
    
    // Payslip Preview
    payslip: 'PAYSLIP',
    period: 'Period',
    payslipPreview: 'Payslip Preview',
    generatePayslipHint: 'Generate a payslip to see a preview here.',
    employeeDetails: 'Employee Details',
    employeeName: 'Employee Name',
    position: 'Position',
    dailyPieceRateEarnings: 'Daily Piece-Rate Earnings',
    tasks: 'Tasks',
    groupTotal: 'Group Total',
    presentCrew: 'Present Crew',
    yourEarning: 'Your Earning',
    grossSalary: 'Gross Salary',
    allowancesBonus: 'Allowances / Bonus',
    netSalary: 'NET SALARY',
    share: 'Share',
    sharing: 'Sharing...',
    exportToPDF: 'Export to PDF',
    shareNotSupported: 'Sharing is not supported in this browser.',
    shareError: 'Failed to share payslip.',

    // Owner Mode
    ownerAccess: 'Owner Access',
    ownerAccessLogin: 'Developer Access Login',
    enterAccessCode: 'Enter Access Code',
    accessCode: 'Access Code',
    enter: 'Enter',
    invalidCode: 'Invalid access code.',
    ownerPanel: 'Developer Panel',
    ownerPanelDesc: 'These settings are for the application owner and can affect core functionality. Use with caution.',
    adSettings: 'Ad Settings',
    admobBannerId: 'AdMob Banner ID',
    admobBannerIdPlaceholder: 'ca-app-pub-xxxxxxxx/xxxxxxxx',
    showAds: 'Show Banner Ads',
    saveAdSettings: 'Save Ad Settings',
    adSettingsSaved: 'Ad settings saved. Reload app to see changes.',
    dangerZone: 'Danger Zone',
    dangerZoneDesc: 'These actions are irreversible. Be absolutely sure before proceeding.',
    clearAllData: 'Clear All Application Data',
    clearAllDataConfirm: 'WARNING! You are about to delete ALL data for ALL users from this device. This cannot be undone. Are you absolutely sure?',
    dataCleared: 'All application data has been cleared.',
    logoutOwnerMode: 'Logout from Developer Mode',
  },
  id: {
    // General
    appName: 'CrewLedger',
    appDescription: 'Penggajian Tim Harian',
    welcomeMessage: 'Selamat Datang di CrewLedger',
    menuHint: 'Gunakan menu di kiri untuk mulai mengelola data Anda.',
    cancel: 'Batal',
    delete: 'Hapus',
    confirmDeletionTitle: 'Konfirmasi Penghapusan',
    confirmDeletionMessage: 'Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.',

    // Tabs
    dailyLog: 'Catatan Harian',
    payslipGenerator: 'Buat Slip Gaji',
    history: 'Riwayat',
    employees: 'Karyawan',
    rates: 'Tarif',
    settings: 'Pengaturan',

    // Employee Manager
    addEmployee: 'Tambah Karyawan',
    addNewEmployee: 'Tambah Karyawan Baru',
    fullName: 'Nama Lengkap',
    fullNamePlaceholder: 'cth. Budi Santoso',
    positionOptional: 'Jabatan (Opsional)',
    positionPlaceholder: 'cth. Staf Lapangan',
    status: 'Status',
    active: 'Aktif',
    inactive: 'Non-aktif',
    profilePictureOptional: 'Foto Profil (Opsional)',
    employeeList: 'Daftar Karyawan',
    noPosition: 'Tanpa jabatan',
    noEmployeeData: 'Data karyawan masih kosong.',
    
    // Rate Manager
    addRate: 'Tambah Tarif',
    taskJobName: 'Nama Tugas/Pekerjaan',
    taskPlaceholder: 'cth. Pasang Bata',
    ratePerUnit: 'Tarif per Satuan',
    ratePlaceholder: 'cth. 50000',
    rateList: 'Daftar Tarif',
    perUnit: '/ satuan',
    noRateData: 'Data tarif masih kosong.',

    // Daily Log
    dailyGroupEntry: 'Catatan Grup Harian',
    date: 'Tanggal',
    selectPresentEmployees: 'Pilih Karyawan Hadir',
    employeesSelected: 'terpilih',
    addTask: 'Tambah Tugas',
    task: 'Tugas',
    selectTask: '-- Pilih Tugas --',
    totalQuantity: 'Jumlah Total',
    quantityPlaceholder: 'cth. 100',
    addTaskToList: '+ Tambah Tugas ke Daftar',
    todaysTaskList: "Daftar Tugas Hari Ini",
    remove: 'Hapus',
    todaysTotal: "Total Hari Ini",
    saveDailyLog: 'Simpan Catatan Harian',
    logForDate: 'Catatan Tanggal',
    workersPresent: 'pekerja hadir',
    perPerson: '/orang',
    deleteLogEntry: 'Hapus catatan ini',
    noLogEntries: 'Tidak ada catatan untuk tanggal ini.',
    alertFillAllFields: 'Harap isi tanggal, pilih minimal satu karyawan, dan tambah minimal satu tugas.',
    alertSelectTaskAndQuantity: 'Harap pilih tugas dan masukkan jumlahnya.',

    // Payslip Generator
    generatePayslip: 'Buat Slip Gaji',
    selectEmployee: 'Pilih Karyawan',
    selectEmployeeOption: '-- Pilih Karyawan --',
    periodMonth: 'Periode (Bulan)',
    allowanceBonus: 'Tunjangan / Bonus',
    deductions: 'Potongan',
    savePayslipToHistory: 'Simpan Slip Gaji ke Riwayat',
    payslipSavedSuccess: 'Slip gaji untuk {{employeeName}} periode {{period}} berhasil disimpan.',
    bulkGenerate: 'Buat Massal',
    bulkGeneratePayslips: 'Buat Slip Gaji Massal',
    bulkGenerateDescription: 'Ini akan membuat dan menyimpan slip gaji untuk semua karyawan aktif yang memiliki pendapatan pada periode yang dipilih.',
    generateAndSave: 'Buat & Simpan',
    generating: 'Membuat...',
    generationComplete: 'Pembuatan Selesai',
    generationSummary: 'Berhasil membuat {{successCount}} slip gaji. {{failCount}} karyawan tidak memiliki pendapatan pada periode ini.',
    
    // History
    payslipHistory: 'Riwayat Slip Gaji',
    noPayslipHistory: 'Riwayat slip gaji masih kosong.',

    // Settings
    aboutThisApp: 'Tentang Aplikasi Ini',
    aboutText: 'Aplikasi ini dibuat untuk mempermudah pencatatan dan perhitungan upah borongan dengan sistem bagi rata.',
    acknowledgements: 'Ucapan Terima Kasih',
    ackGod: 'Tuhan Yang Maha Esa, atas segala petunjuk dan karunia-Nya.',
    ackContributors: 'Kontributor dan pengguna yang memberikan masukan berharga.',
    builtWith: 'Dibuat dengan Bantuan Dari',
    viewRules: 'Lihat Aturan & Kebijakan Privasi',
    cloudSyncComingSoon: 'Sinkronisasi Cloud (Segera Hadir)',
    cloudSyncDesc: 'Ini adalah fitur opsional yang belum diaktifkan, agar aplikasi tetap gratis dan mudah dikonfigurasi.',
    cloudSyncBackupHint: 'Anda masih bisa menggunakan fitur "Cadangan Lokal" di bawah ini untuk menyimpan data Anda dengan aman ke perangkat Anda.',
    googleDriveSync: 'Sinkronisasi Google Drive',
    googleDriveSyncDesc: 'Hubungkan akun Google Anda untuk mencadangkan dan memulihkan data dengan aman ke Google Drive Anda.',
    connectGoogle: 'Hubungkan Akun Google',
    signInToEnable: 'Masuk untuk Mengaktifkan',
    signInToEnableDesc: 'Masuk dengan akun Google Anda untuk mengaktifkan pencadangan dan pemulihan cloud.',
    backup: 'Cadangkan',
    restore: 'Pulihkan',
    disconnectAccount: 'Putuskan Akun',
    localBackup: 'Cadangan Lokal',
    localBackupDesc: 'Simpan semua data aplikasi Anda ke sebuah file JSON di perangkat ini.',
    backupToFile: 'Cadangkan Data ke File',
    localRestore: 'Pemulihan Lokal',
    localRestoreDesc: 'Pilih file cadangan (.json) dari perangkat Anda untuk memulihkan data.',
    warning: 'Peringatan',
    warningRestore: 'Tindakan ini akan menimpa semua data yang ada di aplikasi.',
    restoreFromFile: 'Pulihkan Data dari File',
    dataExportedSuccess: 'Data berhasil diekspor! Simpan file ini di tempat aman, seperti Google Drive.',
    dataExportedError: 'Gagal mengekspor data.',
    confirmRestore: 'PERHATIAN: Memulihkan data akan menimpa SEMUA data saat ini. Tindakan ini tidak dapat dibatalkan. Lanjutkan?',
    dataRestoredSuccess: 'Data berhasil dipulihkan! Aplikasi akan dimuat ulang untuk menerapkan perubahan.',
    dataRestoredError: 'Gagal memulihkan data: {{error}}',
    readFileError: 'Gagal membaca file.',
    languageAndCurrency: 'Bahasa & Mata Uang',
    languageAndCurrencyDesc: 'Pilih bahasa tampilan. Mata uang akan diatur otomatis (IDR untuk Bahasa Indonesia, USD untuk Bahasa Inggris).',
    language: 'Bahasa',
    english: 'English',
    indonesian: 'Bahasa Indonesia',
    reportProblem: 'Laporkan Masalah',
    reportProblemDesc: 'Menemukan bug atau punya saran? Beri tahu kami!',
    openReportForm: 'Buka Formulir Laporan',
    reportModalTitle: 'Laporkan Masalah atau Saran',
    reportIntro: 'Harap jelaskan masalah yang Anda hadapi atau saran Anda untuk perbaikan. Mohon berikan detail sebanyak mungkin.',
    reportSubject: 'Subjek',
    reportSubjectPlaceholder: 'cth., Kesalahan perhitungan di catatan harian',
    reportDescription: 'Deskripsi',
    reportDescriptionPlaceholder: 'cth., Langkah-langkah untuk mereproduksi:\n1. Buka halaman Catatan Harian\n2. ...',
    sendReport: 'Kirim Laporan via Email',

    // Guest Mode
    continueAsGuest: 'Lanjutkan sebagai Tamu',
    guestUser: 'Pengguna Tamu',
    signIn: 'Masuk',
    logout: 'Keluar',

    // Policy Modal
    policyTitle: 'Aturan & Kebijakan Privasi',
    policyWelcome: 'Selamat datang! Sebelum menggunakan aplikasi, harap baca dan setujui poin-poin berikut:',
    policyStorageTitle: '1. Penyimpanan Data',
    policyStorageText: 'Semua data yang Anda masukkan (data karyawan, tarif, catatan harian) disimpan secara lokal di perangkat Anda menggunakan Local Storage browser. Data ini tidak dikirim atau disimpan di server eksternal mana pun oleh aplikasi ini.',
    policyGoogleTitle: '2. Sinkronisasi Google Drive (Opsional)',
    policyGoogleText: 'Aplikasi ini menyediakan fitur untuk mencadangkan dan memulihkan data ke Google Drive pribadi Anda. Fitur ini sepenuhnya opsional. Jika Anda memilih untuk menggunakannya, aplikasi akan meminta izin untuk mengakses Google Drive Anda hanya untuk membuat dan membaca file cadangan khusus aplikasi (`crewledger-backup.json`). Kami tidak memiliki akses ke file lain di Drive Anda.',
    policyResponsibilityTitle: '3. Tanggung Jawab Pengguna',
    policyResponsibilityText: 'Anda bertanggung jawab penuh atas keakuratan data yang dimasukkan. Pengembang tidak bertanggung jawab atas kesalahan perhitungan yang disebabkan oleh input data yang salah. Harap selalu periksa kembali entri Anda.',
    policyWarrantyTitle: '4. Tanpa Garansi',
    policyWarrantyText: 'Aplikasi ini disediakan "sebagaimana adanya" tanpa jaminan apa pun. Meskipun kami berusaha membuat aplikasi ini seakurat mungkin, kami tidak menjamin aplikasi ini akan bebas dari bug atau kesalahan.',
    policyOfficialTitle: '5. Bukan Alat Resmi',
    policyOfficialText: 'Ini adalah alat bantu dan tidak dimaksudkan sebagai sistem penggajian yang divalidasi secara hukum. Gunakan dengan bijak.',
    policyAgree: 'Saya Mengerti dan Setuju',

    // Payslip Preview
    payslip: 'SLIP GAJI',
    period: 'Periode',
    payslipPreview: 'Pratinau Slip Gaji',
    generatePayslipHint: 'Buat slip gaji untuk melihat pratinjau di sini.',
    employeeDetails: 'Detail Karyawan',
    employeeName: 'Nama Karyawan',
    position: 'Jabatan',
    dailyPieceRateEarnings: 'Pendapatan Harian Borongan',
    tasks: 'Tugas',
    groupTotal: 'Total Grup',
    presentCrew: 'Kru Hadir',
    yourEarning: 'Pendapatan Anda',
    grossSalary: 'Gaji Kotor',
    allowancesBonus: 'Tunjangan / Bonus',
    netSalary: 'GAJI BERSIH',
    share: 'Bagikan',
    sharing: 'Membagikan...',
    exportToPDF: 'Ekspor ke PDF',
    shareNotSupported: 'Fitur berbagi tidak didukung di browser ini.',
    shareError: 'Gagal membagikan slip gaji.',

    // Owner Mode
    ownerAccess: 'Akses Pemilik',
    ownerAccessLogin: 'Login Akses Developer',
    enterAccessCode: 'Masukkan Kode Akses',
    accessCode: 'Kode Akses',
    enter: 'Masuk',
    invalidCode: 'Kode akses tidak valid.',
    ownerPanel: 'Panel Developer',
    ownerPanelDesc: 'Pengaturan ini untuk pemilik aplikasi dan dapat memengaruhi fungsionalitas inti. Gunakan dengan hati-hati.',
    adSettings: 'Pengaturan Iklan',
    admobBannerId: 'ID Banner AdMob',
    admobBannerIdPlaceholder: 'ca-app-pub-xxxxxxxx/xxxxxxxx',
    showAds: 'Tampilkan Iklan Banner',
    saveAdSettings: 'Simpan Pengaturan Iklan',
    adSettingsSaved: 'Pengaturan iklan disimpan. Muat ulang aplikasi untuk melihat perubahan.',
    dangerZone: 'Zona Berbahaya',
    dangerZoneDesc: 'Tindakan ini tidak dapat dibatalkan. Pastikan Anda benar-benar yakin sebelum melanjutkan.',
    clearAllData: 'Hapus Semua Data Aplikasi',
    clearAllDataConfirm: 'PERINGATAN! Anda akan menghapus SEMUA data untuk SEMUA pengguna dari perangkat ini. Tindakan ini tidak dapat dibatalkan. Apakah Anda benar-benar yakin?',
    dataCleared: 'Semua data aplikasi telah dihapus.',
    logoutOwnerMode: 'Keluar dari Mode Developer',
  }
};

type Language = 'en' | 'id';

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
    formatCurrency: (amount: number) => string;
    formatDate: (dateString: string, options?: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('id'); // Default to Indonesian for review

    useEffect(() => {
        // 1. Check localStorage for a saved language preference
        const savedLang = localStorage.getItem('crewledger_language') as Language | null;
        if (savedLang && ['en', 'id'].includes(savedLang)) {
            setLanguageState(savedLang);
            return;
        }

        // 2. If no preference, detect based on IP (best effort)
        fetch('https://ip-api.com/json/?fields=countryCode')
            .then(response => response.json())
            .then(data => {
                const lang: Language = data.countryCode === 'ID' ? 'id' : 'en';
                setLanguageState(lang);
                localStorage.setItem('crewledger_language', lang);
            })
            .catch(() => {
                // On error, we rely on the default state which is now 'id'
                 const lang: Language = 'id';
                 setLanguageState(lang);
                 localStorage.setItem('crewledger_language', lang);
            });
    }, []);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('crewledger_language', lang);
    }, []);

    const t = useCallback((key: string, replacements: Record<string, string | number> = {}) => {
        // Fallback logic: if a key doesn't exist in the current language, use the English version.
        let translation = translations[language][key as keyof typeof translations.en] || translations.en[key as keyof typeof translations.en] || key;
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(new RegExp(`{{${placeholder}}}`, 'g'), String(replacements[placeholder]));
        });
        return translation;
    }, [language]);
    
    const formatCurrency = useCallback((amount: number) => {
        const locale = language === 'id' ? 'id-ID' : 'en-US';
        const currency = language === 'id' ? 'IDR' : 'USD';
        const options: Intl.NumberFormatOptions = {
            style: 'currency',
            currency,
        };
        // For IDR, we don't want decimals. For USD, we do by default.
        if (currency === 'IDR') {
            options.minimumFractionDigits = 0;
            options.maximumFractionDigits = 0;
        }

        return new Intl.NumberFormat(locale, options).format(amount);
    }, [language]);

    const formatDate = useCallback((dateString: string, options?: Intl.DateTimeFormatOptions) => {
        const locale = language === 'id' ? 'id-ID' : 'en-US';
        const defaultOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };

        // The Intl.DateTimeFormat API throws an error if style options (like dateStyle)
        // are mixed with component options (like day, month, year).
        // This logic prevents that by using only the passed options if they include a style,
        // otherwise it merges them with the defaults.
        const finalOptions = (options && (options.dateStyle || options.timeStyle))
            ? options
            : { ...defaultOptions, ...options };

        // Ensure we're not affected by timezone shifts by interpreting the date as UTC
        const date = new Date(dateString);
        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        return utcDate.toLocaleString(locale, finalOptions);
    }, [language]);

    const value = useMemo(() => ({ language, setLanguage, t, formatCurrency, formatDate }), 
        [language, setLanguage, t, formatCurrency, formatDate]
    );

    // FIX: Replaced JSX with React.createElement.
    // The file has a .ts extension, which typically does not have JSX parsing enabled.
    // This was causing the compiler to interpret the '<' and '>' characters as
    // comparison operators, leading to syntax errors.
    return React.createElement(I18nContext.Provider, { value: value }, children);
};
