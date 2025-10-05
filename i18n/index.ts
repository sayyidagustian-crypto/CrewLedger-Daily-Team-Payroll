
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
    // FIX: Add 'edit' translation key
    edit: 'Edit',
    // FIX: Add 'saveChanges' translation key
    saveChanges: 'Save Changes',
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
    // FIX: Add 'editEmployee' translation key
    editEmployee: 'Edit Employee',
    fullName: 'Full Name',
    fullNamePlaceholder: 'e.g. John Doe',
    positionOptional: 'Position (Optional)',
    positionPlaceholder: 'e.g. Field Staff',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    profilePictureOptional: 'Profile Picture (Optional)',
    // FIX: Add 'upload' translation key
    upload: 'Upload',
    employeeList: 'Employee List',
    noPosition: 'No position',
    noEmployeeData: 'No employee data yet.',

    // Rate Manager
    addRate: 'Add Rate',
    // FIX: Add 'editRate' translation key
    editRate: 'Edit Rate',
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
    ackGoogle: 'Google, for providing the AI Studio platform that made this application possible.',
    ackBrand: 'The developer, SAT18 Official.',
    ackContributors: 'Contributors and users who provided valuable feedback.',
    builtWith: 'Built with Assistance From',
    viewRules: 'View Rules & Privacy Policy',
    
    // Cloud Sync
    cloudSyncTitle: 'Google Drive Sync',
    driveInitializing: 'Initializing Google Drive connection...',
    driveConnectDesc: 'Back up and restore your data securely using your own Google Drive account. This app will only have access to its own backup file.',
    connectGoogleDrive: 'Connect to Google Drive',
    disconnect: 'Disconnect',
    syncToDrive: 'Sync to Drive',
    restoreFromDrive: 'Restore from Drive',
    driveLastSync: 'Last sync',
    driveAuthError: 'Could not sign in to Google Drive. Please try again.',
    driveSyncSuccess: 'Data successfully backed up to Google Drive.',
    driveSyncError: 'An error occurred while syncing to Google Drive.',
    driveRestoreConfirm: 'Are you sure you want to restore data from Google Drive? This will overwrite all current local data.',
    driveNoBackupFound: 'No backup file found in Google Drive.',
    driveRestoreError: 'An error occurred while restoring from Google Drive.',

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

    // Guest & Auth
    continueAsGuest: 'Continue as Guest',
    guestUser: 'Guest',
    logout: 'Logout',
    emailAddress: 'Email Address',
    password: 'Password',
    login: 'Login',
    register: 'Register',
    dontHaveAccount: "Don't have an account? Register",
    alreadyHaveAccount: "Already have an account? Login",
    loginSecurityWarning: 'This is for data separation on this device only. <strong>Do not use a real password.</strong>',
    registrationSuccess: 'Registration successful! You can now log in.',
    userExists: 'A user with this email already exists.',
    invalidCredentials: 'Invalid email or password.',

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
    sharing: 'Sharing... aistudio-gaji-borongan-project:gaji-borongan-app:4UnL4Fqg1PqJ1b1K0v2h1j',
    shareNotSupported: 'Sharing is not supported on this browser.',
    shareError: 'An error occurred while trying to share.',
    exportToPDF: 'Export to PDF',
    
    // Owner Mode
    ownerAccess: 'Owner Access',
    ownerAccessLogin: 'Owner Access Login',
    enterAccessCode: 'Enter the owner access code to open the developer panel.',
    accessCode: 'Access Code',
    invalidCode: 'Invalid access code.',
    enter: 'Enter',
    ownerPanel: 'Owner Panel',
    ownerPanelDesc: 'This panel contains sensitive settings. Changes here can affect the entire application.',
    adSettings: 'Ad Settings',
    admobBannerId: 'AdMob Banner ID (Web)',
    admobBannerIdPlaceholder: 'ca-app-pub-xxxxxxxx/xxxxxxxx',
    showAds: 'Show Ads',
    saveAdSettings: 'Save Ad Settings',
    adSettingsSaved: 'Ad settings have been saved.',
    dangerZone: 'Danger Zone',
    dangerZoneDesc: 'The action below is irreversible and will delete all user data stored in this browser.',
    clearAllData: 'Clear All App Data',
    clearAllDataConfirm: 'ARE YOU ABSOLUTELY SURE? This will delete all employees, rates, logs, and history from every user account on this device. This cannot be undone.',
    dataCleared: 'All application data has been cleared.',
    logoutOwnerMode: 'Logout from Owner Mode',
  },
  id: {
    // General
    appName: 'CrewLedger',
    appDescription: 'Gaji Harian Tim',
    welcomeMessage: 'Selamat Datang di CrewLedger',
    menuHint: 'Gunakan menu di sebelah kiri untuk mulai mengelola data Anda.',
    cancel: 'Batal',
    delete: 'Hapus',
    // FIX: Add 'edit' translation key
    edit: 'Ubah',
    // FIX: Add 'saveChanges' translation key
    saveChanges: 'Simpan Perubahan',
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
    // FIX: Add 'editEmployee' translation key
    editEmployee: 'Ubah Karyawan',
    fullName: 'Nama Lengkap',
    fullNamePlaceholder: 'cth. Budi Santoso',
    positionOptional: 'Jabatan (Opsional)',
    positionPlaceholder: 'cth. Staf Lapangan',
    status: 'Status',
    active: 'Aktif',
    inactive: 'Tidak Aktif',
    profilePictureOptional: 'Foto Profil (Opsional)',
    // FIX: Add 'upload' translation key
    upload: 'Unggah',
    employeeList: 'Daftar Karyawan',
    noPosition: 'Tanpa jabatan',
    noEmployeeData: 'Belum ada data karyawan.',

    // Rate Manager
    addRate: 'Tambah Tarif',
    // FIX: Add 'editRate' translation key
    editRate: 'Ubah Tarif',
    taskJobName: 'Nama Tugas/Pekerjaan',
    taskPlaceholder: 'cth. Pasang Bata',
    ratePerUnit: 'Tarif per Satuan',
    ratePlaceholder: 'cth. 1500',
    rateList: 'Daftar Tarif',
    perUnit: '/ satuan',
    noRateData: 'Belum ada data tarif.',

    // Daily Log
    dailyGroupEntry: 'Catatan Harian Grup',
    date: 'Tanggal',
    selectPresentEmployees: 'Pilih Karyawan yang Hadir',
    employeesSelected: 'dipilih',
    addTask: 'Tambah Tugas',
    task: 'Tugas',
    selectTask: '-- Pilih Tugas --',
    totalQuantity: 'Jumlah Total',
    quantityPlaceholder: 'cth. 100',
    addTaskToList: '+ Tambah Tugas ke Daftar',
    todaysTaskList: "Daftar Tugas Hari Ini",
    remove: 'Hapus',
    todaysTotal: 'Total Hari Ini',
    saveDailyLog: 'Simpan Catatan Harian',
    logForDate: 'Catatan untuk Tanggal',
    workersPresent: 'pekerja hadir',
    perPerson: '/orang',
    deleteLogEntry: 'Hapus Catatan Ini',
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
    noPayslipHistory: 'Tidak ada riwayat slip gaji yang tersimpan.',

    // Settings
    aboutThisApp: 'Tentang Aplikasi Ini',
    aboutText: 'Aplikasi ini dibuat untuk menyederhanakan pencatatan dan penghitungan upah borongan dengan sistem bagi rata.',
    acknowledgements: 'Ucapan Terima Kasih',
    ackGod: 'Tuhan Yang Maha Esa, atas segala petunjuk dan rahmat-Nya.',
    ackGoogle: 'Google, karena telah menyediakan platform AI Studio yang memungkinkan aplikasi ini dibuat.',
    ackBrand: 'Pengembang aplikasi, SAT18 Official.',
    ackContributors: 'Kontributor dan pengguna yang memberikan masukan berharga.',
    builtWith: 'Dibangun dengan Bantuan',
    viewRules: 'Lihat Aturan & Kebijakan Privasi',

    // Cloud Sync
    cloudSyncTitle: 'Sinkronisasi Google Drive',
    driveInitializing: 'Menyiapkan koneksi Google Drive...',
    driveConnectDesc: 'Cadangkan dan pulihkan data Anda dengan aman menggunakan akun Google Drive Anda sendiri. Aplikasi ini hanya akan memiliki akses ke file cadangannya sendiri.',
    connectGoogleDrive: 'Hubungkan ke Google Drive',
    disconnect: 'Putuskan',
    syncToDrive: 'Sinkronkan ke Drive',
    restoreFromDrive: 'Pulihkan dari Drive',
    driveLastSync: 'Sinkronisasi terakhir',
    driveAuthError: 'Tidak dapat masuk ke Google Drive. Silakan coba lagi.',
    driveSyncSuccess: 'Data berhasil dicadangkan ke Google Drive.',
    driveSyncError: 'Terjadi kesalahan saat sinkronisasi ke Google Drive.',
    driveRestoreConfirm: 'Apakah Anda yakin ingin memulihkan data dari Google Drive? Ini akan menimpa semua data lokal saat ini.',
    driveNoBackupFound: 'File cadangan tidak ditemukan di Google Drive.',
    driveRestoreError: 'Terjadi kesalahan saat memulihkan dari Google Drive.',

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
    dataRestoredSuccess: 'Data berhasil dipulihkan! Aplikasi akan dimuat ulang untuk menerapkan perubahan.',
    dataRestoredError: 'Gagal memulihkan data: {{error}}',
    readFileError: 'Gagal membaca file.',
    languageAndCurrency: 'Bahasa & Mata Uang',
    languageAndCurrencyDesc: 'Pilih bahasa tampilan. Mata uang akan diatur secara otomatis (IDR untuk Bahasa Indonesia, USD untuk Bahasa Inggris).',
    language: 'Bahasa',
    english: 'Inggris (English)',
    indonesian: 'Indonesia',
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

    // Guest & Auth
    continueAsGuest: 'Lanjutkan sebagai Tamu',
    guestUser: 'Tamu',
    logout: 'Keluar',
    emailAddress: 'Alamat Email',
    password: 'Kata Sandi',
    login: 'Masuk',
    register: 'Daftar',
    dontHaveAccount: 'Belum punya akun? Daftar',
    alreadyHaveAccount: 'Sudah punya akun? Masuk',
    loginSecurityWarning: 'Ini hanya untuk pemisahan data di perangkat ini. <strong>Jangan gunakan kata sandi asli Anda.</strong>',
    registrationSuccess: 'Pendaftaran berhasil! Anda sekarang dapat masuk.',
    userExists: 'Pengguna dengan email ini sudah ada.',
    invalidCredentials: 'Email atau kata sandi tidak valid.',

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

    // Owner Mode
    ownerAccess: 'Akses Pemilik',
    ownerAccessLogin: 'Login Akses Pemilik',
    enterAccessCode: 'Masukkan kode akses pemilik untuk membuka panel pengembang.',
    accessCode: 'Kode Akses',
    invalidCode: 'Kode akses tidak valid.',
    enter: 'Masuk',
    ownerPanel: 'Panel Pemilik',
    ownerPanelDesc: 'Panel ini berisi pengaturan sensitif. Perubahan di sini dapat memengaruhi seluruh aplikasi.',
    adSettings: 'Pengaturan Iklan',
    admobBannerId: 'ID Banner AdMob (Web)',
    admobBannerIdPlaceholder: 'ca-app-pub-xxxxxxxx/xxxxxxxx',
    showAds: 'Tampilkan Iklan',
    saveAdSettings: 'Simpan Pengaturan Iklan',
    adSettingsSaved: 'Pengaturan iklan telah disimpan.',
    dangerZone: 'Zona Berbahaya',
    dangerZoneDesc: 'Tindakan di bawah ini tidak dapat diurungkan dan akan menghapus semua data pengguna yang tersimpan di peramban ini.',
    clearAllData: 'Hapus Semua Data Aplikasi',
    clearAllDataConfirm: 'APAKAH ANDA BENAR-benar YAKIN? Ini akan menghapus semua karyawan, tarif, log, dan riwayat dari setiap akun pengguna di perangkat ini. Tindakan ini tidak dapat dibatalkan.',
    dataCleared: 'Semua data aplikasi telah dihapus.',
    logoutOwnerMode: 'Keluar dari Mode Pemilik',
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
