import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  FileText,
  Calendar,
  Download,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Receipt
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';
import { showSuccess } from '../components/utils/notifications';
import PageHeader from '../components/layout/PageHeader';
import NewInvoiceDialog from '../components/financials/NewInvoiceDialog';
import NewReceiptDialog from '../components/financials/NewReceiptDialog';
import NewExpenseDialog from '../components/financials/NewExpenseDialog';

const categoryLabels = {
  materials: 'חומרים',
  contractors: 'קבלנים',
  office: 'משרד',
  marketing: 'שיווק',
  equipment: 'ציוד',
  travel: 'נסיעות',
  other: 'אחר',
};

const statusConfig = {
  draft: { label: 'טיוטה', color: 'bg-muted text-foreground border-border', icon: FileText },
  paid: { label: 'שולם', color: 'bg-archiflow-forest-green/20 text-archiflow-forest-green border-archiflow-forest-green/30', icon: CheckCircle2 },
  pending: { label: 'ממתין', color: 'bg-archiflow-terracotta/20 text-archiflow-terracotta border-archiflow-terracotta/30', icon: Clock },
  overdue: { label: 'באיחור', color: 'bg-destructive/20 text-destructive border-destructive/30', icon: AlertCircle },
  cancelled: { label: 'בוטל', color: 'bg-muted text-muted-foreground border-border', icon: AlertCircle },
};

export default function Financials() {
  const [activeTab, setActiveTab] = useState('invoices');
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);

  // Fetch current user for multi-tenant filtering (with bypass support)
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(base44),
  });

  const isSuperAdmin = user?.app_role === 'super_admin';

  // Fetch invoices from database
  const { data: allInvoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
  });

  // Fetch expenses from database
  const { data: allExpenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-expense_date'),
  });

  // Multi-tenant filtering
  const invoices = isSuperAdmin 
    ? allInvoices 
    : allInvoices.filter(inv => inv.created_by === user?.email);

  const expenses = isSuperAdmin 
    ? allExpenses 
    : allExpenses.filter(exp => exp.created_by === user?.email);

  const handleDownloadReport = () => {
    showSuccess('דוח כספי הורד בהצלחה! 📊');
  };

  const totalInvoices = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Calculate financial summary data
  const financialData = [
    { label: 'הכנסות (שולם)', value: `₪${paidInvoices.toLocaleString()}`, change: '', trend: 'up', icon: DollarSign },
    { label: 'הוצאות החודש', value: `₪${totalExpenses.toLocaleString()}`, change: '', trend: 'down', icon: Wallet },
    { label: 'רווח נקי', value: `₪${(paidInvoices - totalExpenses).toLocaleString()}`, change: '', trend: paidInvoices > totalExpenses ? 'up' : 'down', icon: TrendingUp },
    { label: 'ממתין לגבייה', value: `₪${(pendingInvoices + overdueInvoices).toLocaleString()}`, change: '', trend: 'neutral', icon: Clock },
  ];

  // Group expenses by category for analytics
  const expensesByCategory = expenses.reduce((acc, exp) => {
    const cat = exp.category || 'other';
    acc[cat] = (acc[cat] || 0) + (exp.amount || 0);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <PageHeader 
          title="כספים" 
          subtitle="מעקב אחר הכנסות, הוצאות וחשבוניות"
        >
          <div className="flex gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
            <Button 
              onClick={handleDownloadReport}
              variant="outline"
              className="gap-1.5 sm:gap-2 border-border shadow-soft-organic text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">ייצא </span>דוח
            </Button>
            <Button 
              onClick={() => setShowInvoiceDialog(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 sm:gap-2 shadow-soft-organic text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">חשבונית</span>
              <span className="sm:hidden">חשב׳</span>
            </Button>
            <Button 
              onClick={() => setShowReceiptDialog(true)}
              variant="outline"
              className="gap-1.5 sm:gap-2 border-border shadow-soft-organic text-xs sm:text-sm hidden md:flex"
            >
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              קבלה
            </Button>
            <Button 
              onClick={() => setShowExpenseDialog(true)}
              variant="outline"
              className="gap-1.5 sm:gap-2 border-border shadow-soft-organic text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              הוצאה
            </Button>
          </div>
        </PageHeader>

        {/* Dialogs */}
        <NewInvoiceDialog isOpen={showInvoiceDialog} onClose={() => setShowInvoiceDialog(false)} />
        <NewReceiptDialog isOpen={showReceiptDialog} onClose={() => setShowReceiptDialog(false)} />
        <NewExpenseDialog isOpen={showExpenseDialog} onClose={() => setShowExpenseDialog(false)} />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          {financialData.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-border hover:shadow-soft-organic-hover transition-shadow">
                  <CardHeader className="pb-2 sm:pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                        {item.label}
                      </CardTitle>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" strokeWidth={1.5} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2">{item.value}</p>
                    <div className="flex items-center gap-1">
                      {item.trend === 'up' && <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-archiflow-forest-green" />}
                      {item.trend === 'down' && <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-archiflow-terracotta" />}
                      <span className={`text-xs sm:text-sm font-medium ${
                        item.trend === 'up' ? 'text-archiflow-forest-green' : 
                        item.trend === 'down' ? 'text-archiflow-terracotta' : 
                        'text-muted-foreground'
                      }`}>
                        {item.change}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground hidden lg:inline">מהחודש הקודם</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 sm:mb-6">
          <TabsList className="bg-card border border-border p-1 shadow-soft-organic w-full grid grid-cols-3">
            <TabsTrigger value="invoices" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">חשבוניות </span>
              <span className="sm:hidden">חשב׳ </span>
              ({invoices.length})
            </TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">הוצאות </span>
              <span className="sm:hidden">הוצ׳ </span>
              ({expenses.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">
              ניתוח
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    חשבוניות
                  </CardTitle>
                  <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                    <Badge className="bg-archiflow-forest-green/20 text-archiflow-forest-green text-[10px] sm:text-xs">
                      <span className="hidden sm:inline">שולם: </span>₪{paidInvoices.toLocaleString()}
                    </Badge>
                    <Badge className="bg-archiflow-terracotta/20 text-archiflow-terracotta text-[10px] sm:text-xs">
                      <span className="hidden sm:inline">ממתין: </span>₪{pendingInvoices.toLocaleString()}
                    </Badge>
                    <Badge className="bg-destructive/20 text-destructive text-[10px] sm:text-xs">
                      <span className="hidden sm:inline">באיחור: </span>₪{overdueInvoices.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingInvoices ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm sm:text-base">אין חשבוניות עדיין</p>
                  </div>
                ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground">#</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground">פרויקט</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground hidden md:table-cell">תאריך</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground hidden lg:table-cell">תאריך יעד</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground">סכום</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground">סטטוס</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground hidden sm:table-cell">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice, index) => {
                        const status = statusConfig[invoice.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        return (
                          <motion.tr
                            key={invoice.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                          >
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-muted-foreground">{index + 1}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-foreground text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{invoice.project_name}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-muted-foreground hidden md:table-cell">
                              {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('he-IL') : '-'}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-muted-foreground hidden lg:table-cell">
                              {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('he-IL') : '-'}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-base sm:text-lg font-bold text-foreground">
                              ₪{(invoice.amount || 0).toLocaleString()}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <Badge className={`${status.color} border flex items-center gap-1 w-fit text-[10px] sm:text-xs`}>
                                <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="hidden sm:inline">{status.label}</span>
                              </Badge>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                              <Button size="sm" variant="outline" className="text-xs">
                                <Download className="w-3 h-3 ml-1" />
                                <span className="hidden lg:inline">הורד</span>
                              </Button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    הוצאות
                  </CardTitle>
                  <Badge className="bg-archiflow-terracotta/20 text-archiflow-terracotta text-sm sm:text-lg px-3 sm:px-4 py-1">
                    סה״כ: ₪{totalExpenses.toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loadingExpenses ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : expenses.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm sm:text-base">אין הוצאות עדיין</p>
                  </div>
                ) : (
                <div className="space-y-2 sm:space-y-3">
                  {expenses.map((expense, index) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                          <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{expense.description}</h4>
                          <Badge variant="outline" className="text-[10px] sm:text-xs border-border">{categoryLabels[expense.category] || expense.category}</Badge>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString('he-IL') : '-'}
                          </div>
                          {expense.project_name && (
                            <span className="truncate">• {expense.project_name}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-archiflow-terracotta text-left sm:text-right">
                        -₪{(expense.amount || 0).toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-base sm:text-lg">התפלגות הוצאות לפי קטגוריה</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {Object.entries(expensesByCategory).map(([category, amount], idx) => {
                      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                      const colors = ['bg-archiflow-terracotta', 'bg-archiflow-forest-green', 'bg-archiflow-taupe', 'bg-secondary', 'bg-primary', 'bg-archiflow-espresso', 'bg-destructive'];
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">{categoryLabels[category] || category}</span>
                            <span className="text-xs sm:text-sm font-bold text-foreground">₪{amount.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 sm:h-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: idx * 0.1 }}
                              className={`h-full ${colors[idx % colors.length]}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(expensesByCategory).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">אין נתונים</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-base sm:text-lg">הכנסות לפי פרויקט</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {invoices
                      .filter(inv => inv.status === 'paid')
                      .slice(0, 5)
                      .map((invoice, idx) => (
                      <div key={invoice.id} className="flex items-center justify-between gap-2 p-2.5 sm:p-3 bg-muted/50 rounded-lg">
                        <span className="font-medium text-foreground text-xs sm:text-sm truncate">{invoice.project_name}</span>
                        <span className="text-base sm:text-lg font-bold text-archiflow-forest-green flex-shrink-0">₪{(invoice.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                    {invoices.filter(inv => inv.status === 'paid').length === 0 && (
                      <p className="text-muted-foreground text-center py-4 text-sm sm:text-base">אין הכנסות עדיין</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}