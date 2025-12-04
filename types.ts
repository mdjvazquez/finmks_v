export enum ActivityGroup {
  OPERATING = "OPERATING", // Actividades Operativas
  INVESTING = "INVESTING", // Actividades de Inversión
  FINANCING = "FINANCING", // Actividades Financieras
}

export enum TransactionType {
  INCOME = "INCOME", // Ingreso
  EXPENSE = "EXPENSE", // Egreso
  TRANSFER = "TRANSFER", // Transferencia entre cajas
}

export enum AccountType {
  CASH = "CASH", // Efectivo / Banco inmediato
  RECEIVABLE = "RECEIVABLE", // Cuentas por Cobrar
  PAYABLE = "PAYABLE", // Cuentas por Pagar
}

export enum TransactionStatus {
  PENDING = "PENDING",
  PAID = "PAID",
}

export interface CashRegister {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  balance?: number; // Calculated on the fly
  companyId: string;
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
  cashRegisterId: string; // Origin Box / Affected Box
  // Destination removed from DB for standard transactions, kept in type for UI unification if needed
  destinationCashRegisterId?: string;
  companyId: string;
}

// New Interface for the separate table
export interface Transfer {
  id: string;
  date: string;
  description: string;
  amount: number;
  originCashRegisterId: string;
  destinationCashRegisterId: string;
  userId: string;
  companyId: string;
}

export enum UserRole {
  ADMIN = "ADMIN",
  ACCOUNTANT = "ACCOUNTANT",
  VIEWER = "VIEWER",
}

// Dynamic Role Interface from DB
export interface AppRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // List of permission keys e.g. "transactions.create"
  isSystem: boolean;
  companyId?: string; // NULL for system roles, ID for custom roles
}

// Permission Definition Structure
export interface PermissionModule {
  module: string;
  actions: string[];
  children?: PermissionModule[];
}

export interface Company {
  id: string;
  name: string;
  taxId: string;
  address: string;
  logoUrl: string;
  taxRate: number;
  createdBy: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  bio?: string;
  language?: "EN" | "ES";
  role: UserRole | string;
  status?: "ACTIVE" | "INACTIVE";
  companyId?: string; // Direct link to company in profiles table
}

export interface Employee {
  id: string;
  companyId: string;
  userId?: string; // Link to auth user if they have system access
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  salary: number;
  hireDate: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
}

// Legacy support alias, mapping to Company for UI components
export interface CompanySettings extends Omit<Company, "id" | "createdBy"> {
  language: "EN" | "ES"; // Language remains a user preference usually, or app setting
}

export enum ReportType {
  BALANCE_SHEET = "Balance General",
  INCOME_STATEMENT = "Estado de Resultados",
  CASH_FLOW = "Flujo de Efectivo",
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
  companyId: string;
}

export interface Notification {
  id: string;
  transactionId: string;
  message: string;
  severity: "high" | "medium" | "low";
  date: string;
  type: "OVERDUE" | "DUE_SOON" | "UPCOMING";
}
