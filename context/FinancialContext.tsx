import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import {
  Transaction,
  User,
  CompanySettings,
  FinancialReport,
  ReportType,
  ActivityGroup,
  TransactionType,
  AccountType,
  TransactionStatus,
  Notification,
  FinancialRatio,
  UserRole,
} from "../types";
import { TRANSLATIONS } from "../constants";
import { generateReportAnalysis } from "../services/geminiService";
import { supabase } from "../lib/supabaseClient";

interface FinancialContextType {
  currentUser: User | null;
  allUsers: User[];
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    name?: string,
    role?: UserRole,
    invitationCode?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserProfile: (user: Partial<User>) => void;
  requestPasswordReset: () => Promise<string>;
  confirmPasswordChange: (code: string, newPass: string) => Promise<boolean>;
  fetchAllUsers: () => Promise<void>;
  addNewUser: (
    user: Partial<User>
  ) => Promise<{ success: boolean; code?: string }>;
  toggleUserStatus: (userId: string, currentStatus: string) => Promise<void>;

  companySettings: CompanySettings;
  updateCompanySettings: (settings: CompanySettings) => void;

  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateTransactionStatus: (id: string, status: TransactionStatus) => void;

  reports: FinancialReport[];
  generateReport: (
    type: ReportType,
    startDate: string,
    endDate: string
  ) => void;
  analyzeReport: (folio: string) => Promise<void>;

  notifications: Notification[];
  dismissNotification: (id: string) => void;
  isLoading: boolean;
  t: (key: string) => string;

  // New Invitation Methods
  createInvitation: (
    email: string,
    name: string,
    role: string
  ) => Promise<string | null>;
  verifyInvitation: (
    code: string
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(
  undefined
);

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissedNotifs, setDismissedNotifs] = useState<Set<string>>(
    new Set()
  );

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "FinMKS Global",
    taxId: "XAXX010101000",
    address: "123 Business St",
    logoUrl: "",
    taxRate: 16,
    language: "ES",
  });

  const t = (key: string): string => {
    const lang = currentUser?.language || companySettings.language || "ES";
    return TRANSLATIONS[lang]?.[key] || key;
  };

  // 1. SUPABASE AUTH LISTENER
  useEffect(() => {
    setIsLoading(true);

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setCurrentUser(null);
        setTransactions([]);
        setReports([]);
        setAllUsers([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (uid: string, email: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (data) {
      // SECURITY CHECK: If user is inactive, force logout
      if (data.status === "INACTIVE") {
        console.warn("User is inactive. Logging out.");
        await logout();
        return;
      }

      const user: User = {
        id: data.id,
        email: data.email || email,
        name: data.full_name || "User",
        role: (data.role as UserRole) || UserRole.VIEWER,
        avatar: data.avatar_url,
        phone: data.phone,
        bio: data.bio,
        language: data.language as "EN" | "ES",
        status: (data.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
      };
      setCurrentUser(user);
      fetchData(user.id, user.role);
    } else if (error) {
      console.error("Error fetching profile:", JSON.stringify(error));

      if (error.code === "PGRST116") {
        console.log("Profile row missing. Creating default profile...");
        const { error: createError } = await supabase.from("profiles").insert({
          id: uid,
          email: email,
          full_name: "New User",
          role: "ADMIN",
          language: "ES",
          status: "ACTIVE",
        });

        if (!createError) {
          const newUser: User = {
            id: uid,
            email: email,
            name: "New User",
            role: UserRole.ADMIN,
            avatar: "",
            language: "ES",
            status: "ACTIVE",
          };
          setCurrentUser(newUser);
          fetchData(uid, UserRole.ADMIN);
        } else {
          console.error(
            "Error creating default profile:",
            JSON.stringify(createError)
          );
        }
      }
    }
  };

  const fetchData = async (userId: string, role: UserRole) => {
    // Fetch Company Settings
    const { data: settings } = await supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .single();
    if (settings) {
      setCompanySettings({
        name: settings.name,
        taxId: settings.tax_id,
        address: settings.address,
        logoUrl: settings.logo_url || "",
        taxRate: settings.tax_rate,
        language: "ES",
      });
    }

    // Fetch Transactions
    const { data: txs } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });
    if (txs) {
      const mappedTxs: Transaction[] = txs.map((tx) => ({
        id: tx.id,
        date: tx.date,
        dueDate: tx.due_date,
        description: tx.description,
        amount: parseFloat(tx.amount),
        group: tx.group as ActivityGroup,
        type: tx.type as TransactionType,
        accountType: tx.account_type as AccountType,
        status: tx.status as TransactionStatus,
        receiptImage: tx.receipt_image,
      }));
      setTransactions(mappedTxs);

      // Seed if empty
      // if (mappedTxs.length === 0) {
      //   seedInitialData(userId);
      //}
    }

    // Fetch Reports
    const { data: rpts } = await supabase
      .from("financial_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (rpts) {
      const mappedReports: FinancialReport[] = rpts.map((r) => ({
        folio: r.folio,
        type: r.type as ReportType,
        dateGenerated: r.created_at,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        generatedBy: r.generated_by,
        companySnapshot: r.company_snapshot,
        data: r.data,
        ratios: r.ratios,
        aiAnalysis: r.ai_analysis,
      }));
      setReports(mappedReports);
    }

    // Fetch Users if Admin
    if (role === UserRole.ADMIN) {
      fetchAllUsers();
    }

    setIsLoading(false);
  };

  const fetchAllUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (data) {
      const mappedUsers: User[] = data.map((u) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role as UserRole,
        avatar: u.avatar_url,
        phone: u.phone,
        bio: u.bio,
        language: u.language as "EN" | "ES",
        status: (u.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
      }));
      setAllUsers(mappedUsers);
    } else if (error) {
      console.error("Error fetching all users:", JSON.stringify(error));
    }
  };

  // INVITATION LOGIC
  const createInvitation = async (
    email: string,
    name: string,
    role: string
  ) => {
    // Generate 4-digit HEX code
    const code = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, "0");
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(); // 6 Hours

    const { error } = await supabase.from("invitations").insert({
      code,
      email,
      name,
      role,
      expires_at: expiresAt,
    });

    if (error) {
      console.error("Error creating invitation:", error);
      if (error.code === "42501") {
        alert(
          "Permission Denied: Admins need 'insert' access to invitations table."
        );
      }
      return null;
    }
    return code;
  };

  const verifyInvitation = async (code: string) => {
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("code", code)
      .single();

    if (error || !data) {
      return { success: false, error: "Invalid Code" };
    }

    const now = new Date();
    const expires = new Date(data.expires_at);

    if (now > expires) {
      // Cleanup expired
      await supabase.from("invitations").delete().eq("code", code);
      return { success: false, error: "Code Expired" };
    }

    return { success: true, data };
  };

  const addNewUser = async (user: Partial<User>) => {
    if (!user.email || !user.name || !user.role) return { success: false };
    const code = await createInvitation(user.email, user.name, user.role);
    return { success: !!code, code: code || undefined };
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const { data, error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", userId)
      .select();

    if (!error) {
      if (data && data.length > 0) {
        setAllUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, status: newStatus as any } : u
          )
        );
        console.log(`User ${userId} status updated to ${newStatus}`);
      } else {
        console.error(
          "Update succeeded but no rows modified. RLS likely prevented update."
        );
        alert(
          "Permission Denied: You do not have permission to update this user's status."
        );
      }
    } else {
      console.error("Error updating user status:", error);
      alert("Failed to update status. Database error.");
    }
  };

  const seedInitialData = async (userId: string) => {
    // Generate 50 transactions logic
    const txsPayload = [];
    const today = new Date();
    const descriptions = [
      {
        d: "Consulting Services",
        t: TransactionType.INCOME,
        g: ActivityGroup.OPERATING,
        a: AccountType.RECEIVABLE,
      },
      {
        d: "Office Rent",
        t: TransactionType.EXPENSE,
        g: ActivityGroup.OPERATING,
        a: AccountType.PAYABLE,
      },
      {
        d: "Server Hosting",
        t: TransactionType.EXPENSE,
        g: ActivityGroup.OPERATING,
        a: AccountType.PAYABLE,
      },
      {
        d: "New Laptop",
        t: TransactionType.EXPENSE,
        g: ActivityGroup.INVESTING,
        a: AccountType.CASH,
      },
      {
        d: "Client Retainer",
        t: TransactionType.INCOME,
        g: ActivityGroup.OPERATING,
        a: AccountType.CASH,
      },
    ];

    for (let i = 0; i < 20; i++) {
      const tmpl =
        descriptions[Math.floor(Math.random() * descriptions.length)];
      const isPast = Math.random() > 0.2;
      const date = new Date(today);
      date.setDate(
        today.getDate() +
          (isPast
            ? -Math.floor(Math.random() * 90)
            : Math.floor(Math.random() * 30))
      );

      let status = TransactionStatus.PAID;
      let dueDate = null;

      if (tmpl.a === AccountType.PAYABLE || tmpl.a === AccountType.RECEIVABLE) {
        status =
          Math.random() > 0.5
            ? TransactionStatus.PAID
            : TransactionStatus.PENDING;
        const d = new Date(date);
        d.setDate(d.getDate() + 15);
        dueDate = d.toISOString().split("T")[0];
      }

      txsPayload.push({
        user_id: userId,
        date: date.toISOString().split("T")[0],
        due_date: dueDate,
        description: `${tmpl.d} #${1000 + i}`,
        amount: Math.floor(Math.random() * 5000) + 100,
        group: tmpl.g,
        type: tmpl.t,
        account_type: tmpl.a,
        status: status,
      });
    }

    const { error } = await supabase.from("transactions").insert(txsPayload);
    if (!error) {
      console.log("✅ Seed data inserted successfully");
      fetchData(userId, UserRole.ADMIN); // Role doesn't matter for fetching own txs
    }
  };

  // Notifications Logic
  const notifications = useMemo(() => {
    const alerts: Notification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    transactions.forEach((t) => {
      if (dismissedNotifs.has(t.id)) return;
      if (
        t.status === TransactionStatus.PENDING &&
        t.dueDate &&
        (t.accountType === AccountType.PAYABLE ||
          t.accountType === AccountType.RECEIVABLE)
      ) {
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const prefix =
          t.accountType === AccountType.PAYABLE ? "Payable" : "Receivable";

        if (diffDays < 0) {
          alerts.push({
            id: t.id,
            transactionId: t.id,
            message: `${prefix}: "${t.description}" is OVERDUE by ${Math.abs(
              diffDays
            )} days.`,
            severity: "high",
            date: t.dueDate,
            type: "OVERDUE",
          });
        } else if (diffDays <= 7) {
          alerts.push({
            id: t.id,
            transactionId: t.id,
            message: `${prefix}: "${t.description}" due in ${diffDays} days.`,
            severity: "medium",
            date: t.dueDate,
            type: "DUE_SOON",
          });
        } else if (diffDays <= 30) {
          alerts.push({
            id: t.id,
            transactionId: t.id,
            message: `${prefix}: "${t.description}" due in ${diffDays} days.`,
            severity: "low",
            date: t.dueDate,
            type: "UPCOMING",
          });
        }
      }
    });
    return alerts.sort((a, b) => (a.severity === "high" ? -1 : 1));
  }, [transactions, dismissedNotifs]);

  const dismissNotification = (id: string) =>
    setDismissedNotifs((prev) => new Set(prev).add(id));

  // --- AUTH METHODS ---

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data.user) {
      // Check if user is active
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", data.user.id)
        .single();
      if (profile && profile.status === "INACTIVE") {
        await supabase.auth.signOut();
        return { success: false, error: t("accountInactive") };
      }
    }

    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string,
    role?: UserRole,
    invitationCode?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };

    if (data.user) {
      // If invitation details are provided, update the profile immediately
      if (name || role) {
        console.log("Applying invitation details to new user...");
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: name,
            role: role || UserRole.VIEWER,
            status: "ACTIVE",
          })
          .eq("id", data.user.id);

        if (updateError)
          console.error("Error updating invited profile:", updateError);
      }

      // Cleanup Invitation Code
      if (invitationCode) {
        await supabase.from("invitations").delete().eq("code", invitationCode);
      }
    }
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const updateUserProfile = async (updatedFields: Partial<User>) => {
    if (!currentUser) return;

    const updates = {
      full_name: updatedFields.name,
      phone: updatedFields.phone,
      bio: updatedFields.bio,
      avatar_url: updatedFields.avatar,
      language: updatedFields.language,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", currentUser.id);

    if (!error) {
      console.log("✅ Profile updated successfully:", updates);
      setCurrentUser({ ...currentUser, ...updatedFields });
    } else {
      console.error("Update profile failed", JSON.stringify(error));
      alert("Failed to update profile. See console.");
    }
  };

  const requestPasswordReset = async (): Promise<string> => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      currentUser?.email || "",
      {
        redirectTo: window.location.origin,
      }
    );
    if (error) console.error(error);
    return "123456";
  };

  const confirmPasswordChange = async (
    code: string,
    newPass: string
  ): Promise<boolean> => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    return !error;
  };

  const updateCompanySettings = async (settings: CompanySettings) => {
    const { error } = await supabase
      .from("company_settings")
      .update({
        name: settings.name,
        tax_id: settings.taxId,
        address: settings.address,
        logo_url: settings.logoUrl,
        tax_rate: settings.taxRate,
      })
      .gt("id", 0);

    if (!error) {
      console.log("✅ Company settings updated successfully:", settings);
      setCompanySettings(settings);
    }
  };

  const addTransaction = async (t: Transaction) => {
    if (!currentUser) {
      alert("User not logged in");
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: currentUser.id,
        date: t.date,
        due_date: t.dueDate,
        description: t.description,
        amount: t.amount,
        group: t.group,
        type: t.type,
        account_type: t.accountType,
        status: t.status,
        receipt_image: t.receiptImage,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding transaction:", JSON.stringify(error));
      alert("Failed to add transaction to database.");
      return;
    }

    if (data) {
      console.log("✅ Transaction saved to Supabase:", data);
      setTransactions((prev) => [{ ...t, id: data.id }, ...prev]);
    }
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) {
      console.log("✅ Transaction deleted:", id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const updateTransactionStatus = async (
    id: string,
    status: TransactionStatus
  ) => {
    const { error } = await supabase
      .from("transactions")
      .update({ status })
      .eq("id", id);
    if (!error)
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
  };

  const generateReport = async (
    type: ReportType,
    startDate: string,
    endDate: string
  ) => {
    try {
      if (!currentUser) {
        alert("Please log in to generate reports.");
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const periodTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= start && tDate <= end;
      });

      let reportData: any = {};
      let calculatedRatios: FinancialRatio[] = [];

      const lang = currentUser?.language || "ES";
      const tr = (k: string) => TRANSLATIONS[lang]?.[k] || k;

      // --- CALCULATION LOGIC ---
      if (type === ReportType.INCOME_STATEMENT) {
        const revenues = periodTransactions.filter(
          (t) =>
            t.type === TransactionType.INCOME &&
            t.group === ActivityGroup.OPERATING
        );
        const expenses = periodTransactions.filter(
          (t) =>
            t.type === TransactionType.EXPENSE &&
            t.group === ActivityGroup.OPERATING
        );
        const totalRevenue = revenues.reduce((acc, t) => acc + t.amount, 0);
        const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);
        const incomeBeforeTax = totalRevenue - totalExpenses;
        const taxAmount =
          incomeBeforeTax > 0
            ? incomeBeforeTax * (companySettings.taxRate / 100)
            : 0;
        const netIncome = incomeBeforeTax - taxAmount;

        reportData = {
          period: `${startDate} to ${endDate}`,
          revenues,
          expenses,
          totalRevenue,
          totalExpenses,
          incomeBeforeTax,
          taxRate: companySettings.taxRate,
          taxAmount,
          netIncome,
        };
        calculatedRatios = [
          {
            name: tr("ratio_gross_margin"),
            value:
              totalRevenue > 0
                ? (
                    ((totalRevenue - totalExpenses) / totalRevenue) *
                    100
                  ).toFixed(2) + "%"
                : "0%",
          },
          {
            name: tr("ratio_op_margin"),
            value:
              totalRevenue > 0
                ? ((incomeBeforeTax / totalRevenue) * 100).toFixed(2) + "%"
                : "0%",
          },
          {
            name: tr("ratio_net_profit_margin"),
            value:
              totalRevenue > 0
                ? ((netIncome / totalRevenue) * 100).toFixed(2) + "%"
                : "0%",
          },
          {
            name: tr("ratio_exp_revenue"),
            value:
              totalRevenue > 0
                ? ((totalExpenses / totalRevenue) * 100).toFixed(2) + "%"
                : "0%",
          },
          {
            name: tr("ratio_tax_burden"),
            value:
              incomeBeforeTax > 0
                ? ((taxAmount / incomeBeforeTax) * 100).toFixed(2) + "%"
                : "0%",
          },
        ];
      } else if (type === ReportType.BALANCE_SHEET) {
        const snapshotTransactions = transactions.filter(
          (t) => new Date(t.date) <= end
        );
        const cashAssets =
          snapshotTransactions
            .filter(
              (t) =>
                t.accountType === AccountType.CASH &&
                t.type === TransactionType.INCOME
            )
            .reduce((acc, t) => acc + t.amount, 0) -
          snapshotTransactions
            .filter(
              (t) =>
                t.accountType === AccountType.CASH &&
                t.type === TransactionType.EXPENSE
            )
            .reduce((acc, t) => acc + t.amount, 0);
        const receivablesTx = snapshotTransactions.filter(
          (t) =>
            t.accountType === AccountType.RECEIVABLE &&
            t.status === TransactionStatus.PENDING
        );
        const receivables = receivablesTx.reduce((acc, t) => acc + t.amount, 0);
        const fixedAssets = snapshotTransactions
          .filter(
            (t) =>
              t.group === ActivityGroup.INVESTING &&
              t.type === TransactionType.EXPENSE
          )
          .reduce((acc, t) => acc + t.amount, 0);
        const payablesTx = snapshotTransactions.filter(
          (t) =>
            t.accountType === AccountType.PAYABLE &&
            t.status === TransactionStatus.PENDING
        );
        const payables = payablesTx.reduce((acc, t) => acc + t.amount, 0);
        const totalAssets = cashAssets + receivables + fixedAssets;
        const totalLiabilities = payables;
        const totalEquity = totalAssets - totalLiabilities;

        reportData = {
          date: endDate,
          assets: {
            cashAndEquivalents: cashAssets,
            accountsReceivable: receivables,
            fixedAssets: fixedAssets,
            totalAssets,
          },
          liabilities: {
            accountsPayable: payables,
            longTermDebt: 0,
            totalLiabilities,
          },
          equity: totalEquity,
          details: {
            pendingReceivables: receivablesTx,
            pendingPayables: payablesTx,
          },
        };
        calculatedRatios = [
          {
            name: tr("ratio_current_ratio"),
            value:
              totalLiabilities > 0
                ? ((cashAssets + receivables) / totalLiabilities).toFixed(2)
                : "N/A",
          },
          {
            name: tr("ratio_debt_ratio"),
            value:
              totalAssets > 0
                ? (totalLiabilities / totalAssets).toFixed(2)
                : "0",
          },
          {
            name: tr("ratio_debt_equity"),
            value:
              totalEquity > 0
                ? (totalLiabilities / totalEquity).toFixed(2)
                : "N/A",
          },
          {
            name: tr("ratio_working_capital"),
            value: `$${(cashAssets + receivables - payables).toFixed(2)}`,
          },
          {
            name: tr("ratio_cash_ratio"),
            value:
              totalLiabilities > 0
                ? (cashAssets / totalLiabilities).toFixed(2)
                : "N/A",
          },
        ];
      } else if (type === ReportType.CASH_FLOW) {
        const isCashImpact = (t: Transaction) =>
          t.accountType === AccountType.CASH ||
          t.status === TransactionStatus.PAID;
        const getGroupTx = (group: ActivityGroup) =>
          periodTransactions.filter(
            (t) => t.group === group && isCashImpact(t)
          );
        const operatingTx = getGroupTx(ActivityGroup.OPERATING);
        const investingTx = getGroupTx(ActivityGroup.INVESTING);
        const financingTx = getGroupTx(ActivityGroup.FINANCING);
        const calcFlow = (txs: Transaction[]) =>
          txs.reduce(
            (acc, t) =>
              t.type === TransactionType.INCOME
                ? acc + t.amount
                : acc - t.amount,
            0
          );
        const operatingFlow = calcFlow(operatingTx);
        const investingFlow = calcFlow(investingTx);
        const financingFlow = calcFlow(financingTx);
        const netCashFlow = operatingFlow + investingFlow + financingFlow;

        reportData = {
          period: `${startDate} to ${endDate}`,
          operatingActivities: operatingFlow,
          investingActivities: investingFlow,
          financingActivities: financingFlow,
          netCashFlow: netCashFlow,
          details: {
            operatingTransactions: operatingTx,
            investingTransactions: investingTx,
            financingTransactions: financingTx,
          },
        };
        calculatedRatios = [
          { name: tr("ratio_op_cash_flow"), value: "Requires Current Liab." },
          {
            name: tr("ratio_free_cash_flow"),
            value: `$${(operatingFlow + investingFlow).toFixed(2)}`,
          },
          { name: tr("ratio_cash_flow_cov"), value: "N/A" },
          { name: tr("ratio_cash_flow_margin"), value: "Requires Revenue" },
          {
            name: tr("ratio_net_cash_change"),
            value: `$${netCashFlow.toFixed(2)}`,
          },
        ];
      }

      const folio = `FOL-${Date.now().toString().slice(-6)}`;

      const { data: insertedReport, error } = await supabase
        .from("financial_reports")
        .insert({
          folio,
          user_id: currentUser.id,
          type,
          period_start: startDate,
          period_end: endDate,
          generated_by: currentUser.name || "Unknown",
          company_snapshot: companySettings,
          data: reportData,
          ratios: calculatedRatios,
        })
        .select()
        .single();

      if (insertedReport && !error) {
        console.log(
          "✅ Report generated and saved to Supabase:",
          insertedReport
        );
        const newReport: FinancialReport = {
          folio: insertedReport.folio,
          type: insertedReport.type as ReportType,
          dateGenerated: insertedReport.created_at,
          periodStart: insertedReport.period_start,
          periodEnd: insertedReport.period_end,
          generatedBy: insertedReport.generated_by,
          companySnapshot: insertedReport.company_snapshot,
          data: insertedReport.data,
          ratios: insertedReport.ratios,
          aiAnalysis: undefined,
        };
        setReports((prev) => [newReport, ...prev]);
      } else {
        console.error("Error generating report:", JSON.stringify(error));
        alert("Failed to save report to database.");
      }
    } catch (e) {
      console.error("Report generation logic failed", e);
      alert("Failed to generate report.");
    }
  };

  const analyzeReport = async (folio: string) => {
    setIsLoading(true);
    try {
      const reportToAnalyze = reports.find((r) => r.folio === folio);
      if (!reportToAnalyze) return;

      const lang = currentUser?.language || "ES";
      const { analysis, ratios: analyzedRatios } = await generateReportAnalysis(
        reportToAnalyze.type,
        reportToAnalyze.data,
        reportToAnalyze.ratios,
        lang
      );

      const analysisMap = new Map(
        analyzedRatios.map((r) => [r.name, r.analysis])
      );
      const updatedRatios = reportToAnalyze.ratios.map((r) => ({
        ...r,
        analysis: analysisMap.get(r.name) || r.analysis,
      }));

      // Update in Supabase
      const { error } = await supabase
        .from("financial_reports")
        .update({
          ai_analysis: analysis,
          ratios: updatedRatios,
        })
        .eq("folio", folio);

      if (!error) {
        console.log("✅ Report analyzed and updated in Supabase");
      }

      // Update local
      setReports((prev) =>
        prev.map((r) =>
          r.folio === folio
            ? { ...r, aiAnalysis: analysis, ratios: updatedRatios }
            : r
        )
      );
    } catch (e) {
      console.error("AI Analysis failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FinancialContext.Provider
      value={{
        currentUser,
        allUsers,
        login,
        signUp,
        logout,
        updateUserProfile,
        requestPasswordReset,
        confirmPasswordChange,
        companySettings,
        updateCompanySettings,
        transactions,
        addTransaction,
        deleteTransaction,
        updateTransactionStatus,
        reports,
        generateReport,
        analyzeReport,
        isLoading,
        notifications,
        dismissNotification,
        t,
        fetchAllUsers,
        addNewUser,
        toggleUserStatus,
        createInvitation,
        verifyInvitation,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinancialContext);
  if (!context)
    throw new Error("useFinance must be used within FinancialProvider");
  return context;
};
