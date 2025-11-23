
export enum ActivityGroup {
  OPERATING = 'OPERATING', // Actividades Operativas
  INVESTING = 'INVESTING', // Actividades de Inversión
  FINANCING = 'FINANCING'  // Actividades Financieras
}

export enum TransactionType {
  INCOME = 'INCOME', // Ingreso
  EXPENSE = 'EXPENSE' // Egreso
}

export enum AccountType {
  CASH = 'CASH', // Efectivo / Banco inmediato
  RECEIVABLE = 'RECEIVABLE', // Cuentas por Cobrar
  PAYABLE = 'PAYABLE' // Cuentas por Pagar
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID'
}

export interface Transaction {
  id: string;
  date: string;
  dueDate?: string; // For AP/AR
  description: string;
  amount: number;
  group: ActivityGroup;
  type: TransactionType;
  accountType: AccountType;
  status: TransactionStatus;
  receiptImage?: string; // Base64
}

export enum UserRole {
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  VIEWER = 'VIEWER'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
  password?: string; // Stored locally for simulation
  phone?: string;
  bio?: string;
  verificationCode?: string; // For password reset
  language?: 'EN' | 'ES';
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CompanySettings {
  name: string;
  taxId: string; // RFC
  address: string;
  logoUrl: string; // Base64 or URL
  taxRate: number; // Percentage (e.g., 16 for 16%)
  language: 'EN' | 'ES';
}

export enum ReportType {
  BALANCE_SHEET = 'Balance General',
  INCOME_STATEMENT = 'Estado de Resultados',
  CASH_FLOW = 'Flujo de Efectivo'
}

export interface FinancialRatio {
  name: string;
  value: number | string;
  analysis?: string; // Optional, filled by AI later
}

export interface FinancialReport {
  folio: string;
  type: ReportType;
  dateGenerated: string;
  periodStart: string;
  periodEnd: string;
  generatedBy: string; // User Name
  companySnapshot: CompanySettings; // Snapshot of company details at time of generation
  data: any; // Flexible payload depending on report type
  ratios: FinancialRatio[];
  aiAnalysis?: string; // Optional, filled by AI later
}

export interface Notification {
  id: string;
  transactionId: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  date: string;
  type: 'OVERDUE' | 'DUE_SOON' | 'UPCOMING';
}
