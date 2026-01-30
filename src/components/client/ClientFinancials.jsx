import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Banknote, Download, FileCheck, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ClientFinancials({ projectId }) {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['clientInvoices', projectId],
    queryFn: () => base44.entities.Invoice.filter({ project_id: projectId }, '-issue_date'),
    enabled: !!projectId
  });

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  
  const totalPending = invoices
    .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">שולם</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">ממתין לתשלום</Badge>;
      case 'overdue': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">באיחור</Badge>;
      default: return <Badge variant="outline">טיוטה</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-green-700 font-medium">סה״כ שולם</p>
                <h3 className="text-2xl font-bold text-green-900 mt-1">₪{totalPaid.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <FileCheck className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-yellow-700 font-medium">יתרה לתשלום</p>
                <h3 className="text-2xl font-bold text-yellow-900 mt-1">₪{totalPending.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-indigo-600" />
            חשבוניות ותשלומים
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Banknote className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>אין חשבוניות להצגה</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">חשבונית #{invoice.invoice_number}</h4>
                      <p className="text-sm text-slate-500">{invoice.description}</p>
                      <div className="flex items-center gap-2 mt-1 md:hidden">
                         {getStatusBadge(invoice.status)}
                         {invoice.issue_date && (
                           <span className="text-sm text-slate-500">{format(new Date(invoice.issue_date), 'dd/MM/yyyy')}</span>
                         )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between mt-4 md:mt-0">
                    <div className="hidden md:block text-right">
                      <p className="text-xs text-slate-500">תאריך</p>
                      {invoice.issue_date ? (
                        <p className="text-sm font-medium">{format(new Date(invoice.issue_date), 'dd/MM/yyyy')}</p>
                      ) : (
                        <p className="text-sm font-medium">-</p>
                      )}
                    </div>
                    
                    <div className="hidden md:block">
                      {getStatusBadge(invoice.status)}
                    </div>

                    <div className="text-right min-w-[100px]">
                      <p className="text-lg font-bold text-slate-900">₪{invoice.amount?.toLocaleString()}</p>
                    </div>

                    <Button variant="ghost" size="icon">
                      <Download className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FileText(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}