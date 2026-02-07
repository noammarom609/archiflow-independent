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
import { MoreVertical, User, Eye, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function ClientTable({ clients, onClick }) {
  const { t } = useLanguage();
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">פעיל</Badge>;
      case 'lead':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">ליד</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">הושלם</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800 border-red-200">לא פעיל</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-500">{status}</Badge>;
    }
  };

  const getSourceLabel = (source) => {
    const map = {
      referral: 'המלצה',
      website: 'אתר',
      social_media: 'מדיה חברתית',
      advertisement: 'פרסום',
      returning: 'לקוח חוזר',
      other: 'אחר'
    };
    return map[source] || source || '-';
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-right">לקוח</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">פרטי קשר</TableHead>
              <TableHead className="text-right">מקור</TableHead>
              <TableHead className="text-right">תאריך יצירה</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  לא נמצאו לקוחות
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => onClick && onClick(client)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
                        {client.avatar_url ? (
                          <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{client.full_name || 'ללא שם'}</div>
                        {client.company && <div className="text-xs text-slate-500">{client.company}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(client.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm text-slate-600">
                      {client.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span dir="ltr">{client.phone}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span dir="ltr">{client.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{getSourceLabel(client.source)}</span>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {client.created_date ? format(new Date(client.created_date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('a11y.openMenu')} title={t('a11y.openMenu')}>
                          <MoreVertical className="w-4 h-4 text-slate-400" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onClick && onClick(client)}>
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