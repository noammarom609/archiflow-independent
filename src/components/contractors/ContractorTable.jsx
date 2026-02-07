import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Briefcase, Eye, Phone, Mail, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function ContractorTable({ contractors, onClick }) {
  const { t } = useLanguage();
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">פעיל</Badge>;
      case 'on_hold':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">בהשהיה</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800 border-red-200">לא פעיל</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-500">{status}</Badge>;
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      contractor: 'קבלן',
      partner: 'שותף',
      supplier: 'ספק'
    };
    return map[type] || type;
  };

  const getSpecialtyLabel = (specialty) => {
     const map = {
        electrical: 'חשמל',
        plumbing: 'אינסטלציה',
        drywall: 'גבס',
        flooring: 'ריצוף',
        carpentry: 'נגרות',
        painting: 'צביעה',
        hvac: 'מיזוג',
        general_contractor: 'קבלן ראשי',
        engineer: 'מהנדס',
        designer: 'מעצב',
        supplier: 'ספק',
        other: 'אחר'
      };
      return map[specialty] || specialty;
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-right">קבלן/ספק</TableHead>
              <TableHead className="text-right">תחום</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">פרטי קשר</TableHead>
              <TableHead className="text-right">דירוג</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contractors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  לא נמצאו קבלנים
                </TableCell>
              </TableRow>
            ) : (
              contractors.map((contractor) => (
                <TableRow key={contractor.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => onClick && onClick(contractor)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
                        {contractor.avatar_url ? (
                          <img src={contractor.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Briefcase className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{contractor.name || 'ללא שם'}</div>
                        {contractor.company && <div className="text-xs text-slate-500">{contractor.company}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{getSpecialtyLabel(contractor.specialty)}</span>
                        <span className="text-xs text-slate-500">{getTypeLabel(contractor.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(contractor.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm text-slate-600">
                      {contractor.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span dir="ltr">{contractor.phone}</span>
                        </div>
                      )}
                      {contractor.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span dir="ltr">{contractor.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-sm font-medium text-slate-700">{contractor.rating || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('a11y.openMenu')} title={t('a11y.openMenu')}>
                          <MoreVertical className="w-4 h-4 text-slate-400" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onClick && onClick(contractor)}>
                          <Eye className="w-4 h-4 ml-2 text-slate-500" />
                          צפה בפרטים
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}