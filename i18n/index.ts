

import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';

// 1. Define Translation Data
const translations = {
  en: {
    // General
    appName: 'CrewLedger',
    appDescription: 'Daily Team Payroll',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    saveChanges: 'Save Changes',
    confirmDeletionTitle: 'Confirm Deletion',
    confirmDeletionMessage: 'Are you sure you want to delete this item? This action cannot be undone.',
    exit: 'Exit',

    // Auth
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    contactNumber: 'Contact Number',
    contactNumberOptional: 'Contact Number (Optional)',
    registerHere: 'Register here',
    loginHere: 'Login here',
    authNoAccount: "Don't have an account?",
    authHaveAccount: 'Already have an account?',
    authInvalidCredentials: 'Invalid email or password.',
    authPasswordTooShort: 'Password must be at least 8 characters long.',
    authEmailExists: 'An account with this email already exists.',
    authUsernameExists: 'This username is already taken.',
    authOr: 'or',
    authContinueAsGuest: 'Continue as Guest',

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
    editEmployee: 'Edit Employee',
    fullName: 'Full Name',
    positionOptional: 'Position (Optional)',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    profilePictureOptional: 'Profile Picture (Optional)',
    upload: 'Upload',
    noPosition: 'No position',
    noEmployeeData: 'No employee data yet.',

    // Rate Manager
    addRate: 'Add Rate',
    editRate: 'Edit Rate',
    taskJobName: 'Task/Job Name',
    ratePerUnit: 'Rate per Unit',
    perUnit: '/ unit',
    noRateData: 'No rate data yet.',
    
    // Daily Log
    dailyGroupEntry: 'Daily Group Entry',
    date: 'Date',
    selectPresentEmployees: 'Select Present Employees',
    addTask: 'Add Task',
    selectTask: '-- Select Task --',
    totalQuantity: 'Total Quantity',
    addTaskToList: '+ Add Task to List',
    todaysTaskList: "Today's Task List",
    remove: 'Remove',
    todaysTotal: "Today's Total",
    saveDailyLog: 'Save Daily Log',
    logForDate: 'Log for Date',
    workersPresent: 'workers present',
    perPerson: '/person',
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
    payslipSavedSuccess: 'Payslip for {{employeeName}} for period {{period}} has been saved successfully.',
    bulkGenerate: 'Bulk Generate',
    bulkGeneratePayslips: 'Bulk Generate Payslips',
    bulkGenerateDescription: 'This will generate and save payslips for all active employees who have earnings in the selected period.',
    generateAndSave: 'Generate & Save',
    generating: 'Generating...',
    generationSummary: 'Successfully generated {{successCount}} payslips. {{failCount}} employees had no earnings for this period.',
    
    // History
    payslipHistory: 'Payslip History',
    noPayslipHistory: 'No saved payslip history.',

    // Settings
    profileAndSettings: 'Profile & Settings',
    profile: 'User Profile',
    guestUser: 'Guest User',
    aboutThisApp: 'About This App',
    aboutText: 'This application was created to simplify the recording and calculation of piece-rate wages with an equal-sharing system.',
    viewRules: 'View Rules & Privacy Policy',
    localBackup: 'Local Backup (Manual)',
    localBackupDesc: 'Save all your application data to a JSON file on this device.',
    backupToFile: 'Backup Data to File',
    localRestore: 'Local Restore (Manual)',
    localRestoreDesc: 'Choose a backup file (.json) from your device to restore data.',
    warning: 'Warning',
    warningRestore: 'This action will overwrite all existing data in the app.',
    restoreFromFile: 'Restore Data from File',
    dataExportedSuccess: 'Data exported successfully! Save this file in a safe place.',
    dataExportedError: 'Failed to export data.',
    confirmRestore: 'ATTENTION: Restoring data will overwrite ALL current data. This action cannot be undone. Proceed?',
    dataRestoredSuccess: 'Data restored successfully!',
    dataRestoredError: 'Failed to restore data: {{error}}',
    readFileError: 'Failed to read file.',
    languageAndCurrency: 'Language & Currency',
    languageAndCurrencyDesc: 'Select the display language. The currency will be set automatically (IDR for Indonesian, USD for English).',
    language: 'Language',
    english: 'English',
    indonesian: 'Indonesian',
    ownerMode: 'Owner Mode',
    ownerModeDesc: 'Unlock advanced settings for app customization.',
    unlock: 'Unlock',
    exitOwnerMode: 'Exit Owner Mode',
    ownerCodePlaceholder: 'Enter one-time access code',
    ownerCodeInvalidError: 'Invalid access code.',
    ownerCodeUsedError: 'This access code has already been used.',
    ownerSettings: 'Owner Settings',
    appCustomization: 'App Customization',
    customizeAppName: 'App Name',
    customizeAppDesc: 'App Description',
    customizeAppIcon: 'App Icon (Upload)',
    admobSettings: 'AdMob Settings',
    admobSettingsDesc: 'This ID is intended for use by the native Android app wrapper.',
    admobBannerId: 'AdMob Banner ID',
    saveSettings: 'Save Settings',
    settingsSaved: 'Settings saved successfully. Changes are applied automatically.',
    resetSettings: 'Reset to Default',
    settingsReset: 'Custom settings have been reset.',
    confirmResetSettings: 'Are you sure you want to reset all custom settings to their default values?',
    
    // Guest Mode
    guestMode: 'Guest Mode',
    registerToSavePrompt: 'You are in Guest Mode. Register an account to save your data and access it from any device.',
    registerNow: 'Register Now',

    // Policy Modal
    policyTitle: 'Rules & Privacy Policy',
    policyWelcome: 'Welcome! Before using the app, please read and agree to the following points:',
    policyStorageTitle: '1. Data Storage',
    policyStorageText: "All data you enter (employee data, rates, daily logs) is stored locally on your device using the browser's Local Storage. This data is not sent to or stored on any external server by this application.",
    policyResponsibilityTitle: '2. User Responsibility',
    policyResponsibilityText: 'You are solely responsible for the accuracy of the data entered. The developer is not liable for calculation errors caused by incorrect data input. Please always double-check your entries.',
    policyWarrantyTitle: '3. No Warranty',
    policyWarrantyText: 'This application is provided "as is" without any warranty. While we strive to make this app as accurate as possible, we do not guarantee it will be free of bugs or errors.',
    policyOfficialTitle: '4. Not an Official Tool',
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
    shareNotSupported: 'Sharing is not supported on this browser.',
    shareError: 'An error occurred while trying to share.',
    exportToPDF: 'Export to PDF',
  },
  id: {
    // General
    appName: 'CrewLedger',
    appDescription: 'Gaji Harian Tim',
    cancel: 'Batal',
    delete: 'Hapus',
    edit: 'Ubah',
    saveChanges: 'Simpan Perubahan',
    confirmDeletionTitle: 'Konfirmasi Penghapusan',
    confirmDeletionMessage: 'Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.',
    exit: 'Keluar',
    
    // Auth
    login: 'Masuk',
    register: 'Daftar',
    logout: 'Keluar',
    email: 'Email',
    password: 'Kata Sandi',
    username: 'Nama Pengguna',
    contactNumber: 'Nomor Kontak',
    contactNumberOptional: 'Nomor Kontak (Opsional)',
    registerHere: 'Daftar di sini',
    loginHere: 'Masuk di sini',
    authNoAccount: 'Belum punya akun?',
    authHaveAccount: 'Sudah punya akun?',
    authInvalidCredentials: 'Email atau kata sandi salah.',
    authPasswordTooShort: 'Kata sandi minimal harus 8 karakter.',
    authEmailExists: 'Akun dengan email ini sudah ada.',
    authUsernameExists: 'Nama pengguna ini sudah digunakan.',
    authOr: 'atau',
    authContinueAsGuest: 'Lanjutkan sebagai Tamu',
    
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
    editEmployee: 'Ubah Karyawan',
    fullName: 'Nama Lengkap',
    positionOptional: 'Jabatan (Opsional)',
    status: 'Status',
    active: 'Aktif',
    inactive: 'Tidak Aktif',
    profilePictureOptional: 'Foto Profil (Opsional)',
    upload: 'Unggah',
    noPosition: 'Tanpa jabatan',
    noEmployeeData: 'Belum ada data karyawan.',

    // Rate Manager
    addRate: 'Tambah Tarif',
    editRate: 'Ubah Tarif',
    taskJobName: 'Nama Tugas/Pekerjaan',
    ratePerUnit: 'Tarif per Satuan',
    perUnit: '/ satuan',
    noRateData: 'Belum ada data tarif.',

    // Daily Log
    dailyGroupEntry: 'Catatan Harian Grup',
    date: 'Tanggal',
    selectPresentEmployees: 'Pilih Karyawan yang Hadir',
    addTask: 'Tambah Tugas',
    selectTask: '-- Pilih Tugas --',
    totalQuantity: 'Jumlah Total',
    addTaskToList: '+ Tambah Tugas ke Daftar',
    todaysTaskList: "Daftar Tugas Hari Ini",
    remove: 'Hapus',
    todaysTotal: 'Total Hari Ini',
    saveDailyLog: 'Simpan Catatan Harian',
    logForDate: 'Catatan untuk Tanggal',
    workersPresent: 'pekerja hadir',
    perPerson: '/orang',
    noLogEntries: 'Tidak ada catatan untuk tanggal ini.',
    alertFillAllFields: 'Harap isi tanggal, pilih setidaknya satu karyawan, dan tambahkan setidaknya satu tugas.',
    alertSelectTaskAndQuantity: 'Silakan pilih tugas dan masukkan jumlahnya.',

    // Payslip Generator
    generatePayslip: 'Buat Slip Gaji',
    selectEmployee: 'Pilih Karyawan',
    selectEmployeeOption: '-- Pilih Karyawan --',
    periodMonth: 'Periode (Bulan)',
    allowanceBonus: 'Tunjangan / Bonus',
    deductions: 'Potongan',
    payslipSavedSuccess: 'Slip gaji untuk {{employeeName}} periode {{period}} berhasil disimpan.',
    bulkGenerate: 'Buat Massal',
    bulkGeneratePayslips: 'Buat Slip Gaji Massal',
    bulkGenerateDescription: 'Ini akan membuat dan menyimpan slip gaji untuk semua karyawan aktif yang memiliki pendapatan pada periode yang dipilih.',
    generateAndSave: 'Buat & Simpan',
    generating: 'Membuat...',
    generationSummary: 'Berhasil membuat {{successCount}} slip gaji. {{failCount}} karyawan tidak memiliki pendapatan pada periode ini.',

    // History
    payslipHistory: 'Riwayat Slip Gaji',
    noPayslipHistory: 'Tidak ada riwayat slip gaji yang tersimpan.',

    // Settings
    profileAndSettings: 'Profil & Pengaturan',
    profile: 'Profil Pengguna',
    guestUser: 'Pengguna Tamu',
    aboutThisApp: 'Tentang Aplikasi Ini',
    aboutText: 'Aplikasi ini dibuat untuk menyederhanakan pencatatan dan penghitungan upah borongan dengan sistem bagi rata.',
    viewRules: 'Lihat Aturan & Kebijakan Privasi',
    localBackup: 'Cadangan Lokal (Manual)',
    localBackupDesc: 'Simpan semua data aplikasi Anda ke sebuah file JSON di perangkat ini.',
    backupToFile: 'Cadangkan Data ke File',
    localRestore: 'Pemulihan Lokal (Manual)',
    localRestoreDesc: 'Pilih file cadangan (.json) dari perangkat Anda untuk memulihkan data.',
    warning: 'Peringatan',
    warningRestore: 'Tindakan ini akan menimpa semua data yang ada di aplikasi.',
    restoreFromFile: 'Pulihkan Data dari File',
    dataExportedSuccess: 'Data berhasil diekspor! Simpan file ini di tempat yang aman.',
    dataExportedError: 'Gagal mengekspor data.',
    confirmRestore: 'PERHATIAN: Memulihkan data akan menimpa SEMUA data saat ini. Tindakan ini tidak dapat dibatalkan. Lanjutkan?',
    dataRestoredSuccess: 'Data berhasil dipulihkan!',
    dataRestoredError: 'Gagal memulihkan data: {{error}}',
    readFileError: 'Gagal membaca file.',
    languageAndCurrency: 'Bahasa & Mata Uang',
    languageAndCurrencyDesc: 'Pilih bahasa tampilan. Mata uang akan diatur secara otomatis (IDR untuk Bahasa Indonesia, USD untuk Bahasa Inggris).',
    language: 'Bahasa',
    english: 'Inggris (English)',
    indonesian: 'Indonesia',
    ownerMode: 'Mode Pemilik',
    ownerModeDesc: 'Buka pengaturan lanjutan untuk kustomisasi aplikasi.',
    unlock: 'Buka Kunci',
    exitOwnerMode: 'Keluar dari Mode Pemilik',
    ownerCodePlaceholder: 'Masukkan kode akses sekali pakai',
    ownerCodeInvalidError: 'Kode akses tidak valid.',
    ownerCodeUsedError: 'Kode akses ini sudah pernah digunakan.',
    ownerSettings: 'Pengaturan Pemilik',
    appCustomization: 'Kustomisasi Aplikasi',
    customizeAppName: 'Nama Aplikasi',
    customizeAppDesc: 'Deskripsi Aplikasi',
    customizeAppIcon: 'Ikon Aplikasi (Unggah)',
    admobSettings: 'Pengaturan AdMob',
    admobSettingsDesc: 'ID ini dimaksudkan untuk digunakan oleh pembungkus aplikasi Android asli.',
    admobBannerId: 'ID Banner AdMob',
    saveSettings: 'Simpan Pengaturan',
    settingsSaved: 'Pengaturan berhasil disimpan. Perubahan diterapkan secara otomatis.',
    resetSettings: 'Reset ke Default',
    settingsReset: 'Pengaturan kustom telah di-reset.',
    confirmResetSettings: 'Anda yakin ingin mengembalikan semua pengaturan kustom ke nilai default?',

    // Guest Mode
    guestMode: 'Mode Tamu',
    registerToSavePrompt: 'Anda berada dalam Mode Tamu. Daftarkan akun untuk menyimpan data Anda dan mengaksesnya dari perangkat mana pun.',
    registerNow: 'Daftar Sekarang',

    // Policy Modal
    policyTitle: 'Aturan & Kebijakan Privasi',
    policyWelcome: 'Selamat datang! Sebelum menggunakan aplikasi, harap baca dan setujui poin-poin berikut:',
    policyStorageTitle: '1. Penyimpanan Data',
    policyStorageText: 'Semua data yang Anda masukkan (data karyawan, tarif, catatan harian) disimpan secara lokal di perangkat Anda menggunakan Penyimpanan Lokal peramban. Data ini tidak dikirim atau disimpan di server eksternal mana pun oleh aplikasi ini.',
    policyResponsibilityTitle: '2. Tanggung Jawab Pengguna',
    policyResponsibilityText: 'Anda sepenuhnya bertanggung jawab atas keakuratan data yang dimasukkan. Pengembang tidak bertanggung jawab atas kesalahan perhitungan yang disebabkan oleh input data yang salah. Harap selalu periksa kembali entri Anda.',
    policyWarrantyTitle: '3. Tanpa Garansi',
    policyWarrantyText: 'Aplikasi ini disediakan "sebagaimana adanya" tanpa jaminan apa pun. Meskipun kami berusaha keras untuk membuat aplikasi ini seakurat mungkin, kami tidak menjamin aplikasi ini akan bebas dari bug atau kesalahan.',
    policyOfficialTitle: '4. Bukan Alat Resmi',
    policyOfficialText: 'Ini adalah alat bantu dan tidak dimaksudkan sebagai sistem penggajian yang divalidasi secara hukum. Gunakan dengan bijak.',
    policyAgree: 'Saya Mengerti dan Setuju',

    // Payslip Preview
    payslip: 'SLIP GAJI',
    period: 'Periode',
    payslipPreview: 'Pratinjau Slip Gaji',
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
    shareNotSupported: 'Berbagi tidak didukung di peramban ini.',
    shareError: 'Terjadi kesalahan saat mencoba berbagi.',
    exportToPDF: 'Ekspor ke PDF',
  },
};

// 2. Create Context and Provider
type Language = 'en' | 'id';
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en, options?: Record<string, string | number>) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check local storage or default to browser language
    const storedLang = localStorage.getItem('crewledger_language');
    if (storedLang === 'en' || storedLang === 'id') {
      return storedLang;
    }
    return navigator.language.startsWith('id') ? 'id' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('crewledger_language', language);
  }, [language]);
  
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = useCallback((key: keyof typeof translations.en, options?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations.en[key] || key;
    if (options) {
        Object.keys(options).forEach(optKey => {
            translation = translation.replace(`{{${optKey}}}`, String(options[optKey]));
        });
    }
    return translation;
  }, [language]);

  const formatCurrency = useCallback((amount: number): string => {
      const options = {
        style: 'currency',
        currency: language === 'id' ? 'IDR' : 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      };
      // For Indonesian Rupiah, it's common to not have decimal places.
      if (language === 'id') {
          options.minimumFractionDigits = 0;
          options.maximumFractionDigits = 0;
      }
      return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', options).format(amount);
  }, [language]);

  const formatDate = useCallback((dateString: string): string => {
    // Input is YYYY-MM-DD. We need to create a Date object in UTC to avoid timezone issues.
    const date = new Date(dateString + 'T00:00:00Z');
    return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC' // Explicitly use UTC
    }).format(date);
  }, [language]);


  const value = useMemo(() => ({ language, setLanguage, t, formatCurrency, formatDate }), [language, t, formatCurrency, formatDate]);

  // FIX: Replaced JSX with React.createElement to fix syntax errors in a .ts file.
  // The file uses React component logic but has a .ts extension, which does not process JSX by default.
  return React.createElement(I18nContext.Provider, { value: value }, children);
};

// 3. Custom Hook for easy access
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
