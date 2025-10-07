export interface Employee {
  id: string;
  name: string;
  position: string;
  status: 'Active' | 'Inactive';
  profilePicture?: string; // Stores a base64 string of the image
}

export interface PieceRate {
  id: string;
  taskName: string;
  rate: number;
}

export interface DailyTask {
  pieceRateId: string;
  taskName: string;
  rate: number;
  quantity: number;
  subTotal: number;
}

export interface DailyGroupLog {
  id: string;
  date: string; // YYYY-MM-DD
  tasks: DailyTask[];
  presentEmployeeIds: string[];
  totalGrossEarnings: number;
  individualEarnings: number;
}

export interface PayslipLogEntry {
    date: string;
    taskName: string;
    totalDailyGross: number;
    workersPresent: number;
    yourEarning: number;
}

export interface Payslip {
  id:string;
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  employeeProfilePicture?: string;
  period: string;
  logs: PayslipLogEntry[];
  grossSalary: number;
  allowance: number;
  deduction: number;
  netSalary: number;
  createdAt: string;
}

export interface AppConfig {
  appName: string;
  appDescription: string;
  appIcon: string; // base64 string
  admobBannerId: string;
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password: string; // In a real-world app, this should be a hash.
  contactNumber?: string;
}

export interface DevSettings {
  admobBannerId: string;
  adsenseClientId: string;
}