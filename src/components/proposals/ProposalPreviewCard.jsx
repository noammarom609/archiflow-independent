import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

// Helper to check if signature is a real image or just a status string
const isRealSignatureImage = (signatureData) => {
  if (!signatureData) return false;
  // Check if it's a base64 image or URL
  return signatureData.startsWith('data:image') || 
         signatureData.startsWith('http') || 
         signatureData.startsWith('/');
};

// Component to render signature (either image or digital approval badge)
const SignatureDisplay = ({ signatureData, label = 'חתימת הלקוח' }) => {
  if (!signatureData) {
    return (
      <div className="text-center">
        <div className="w-40 border-b-2 border-slate-300 mb-2 h-12" />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    );
  }

  if (isRealSignatureImage(signatureData)) {
    return (
      <div className="text-center">
        <div className="mb-2">
          <img 
            src={signatureData} 
            alt="חתימה דיגיטלית" 
            className="h-16 object-contain mx-auto"
          />
        </div>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    );
  }

  // Digital approval (not a real image) - show a nice badge
  return (
    <div className="text-center">
      <div className="mb-2 flex flex-col items-center justify-center h-16">
        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full border border-green-200">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm">אושר דיגיטלית</span>
        </div>
      </div>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
};

export default function ProposalPreviewCard({ proposalData, project, template, formatCurrency, signatureData }) {
  const primaryColor = template?.styling?.primary_color || '#0891b2';

  // Replace template variables with actual data
  const replaceVariables = (text) => {
    if (!text) return text;
    return text
      .replace(/\{\{ClientName\}\}/g, project?.client || '')
      .replace(/\{\{ProjectName\}\}/g, project?.name || '')
      .replace(/\{\{ClientEmail\}\}/g, project?.client_email || '')
      .replace(/\{\{ClientPhone\}\}/g, project?.client_phone || '')
      .replace(/\{\{ClientAddress\}\}/g, project?.location || '')
      .replace(/\{\{TotalPrice\}\}/g, formatCurrency(proposalData.total_amount))
      .replace(/\{\{Subtotal\}\}/g, formatCurrency(proposalData.subtotal))
      .replace(/\{\{VAT\}\}/g, formatCurrency(proposalData.vat_amount))
      .replace(/\{\{Date\}\}/g, new Date().toLocaleDateString('he-IL'));
  };

  // If no template, render simple preview
  if (!template) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-xl font-bold text-center mb-4">{proposalData.title}</h3>
        <p className="text-slate-600 mb-4">{proposalData.scope_of_work}</p>
        
        <div className="border-t pt-4">
          {proposalData.items.map((item, idx) => (
            <div key={idx} className="flex justify-between py-2 border-b border-slate-100">
              <span>{item.description}</span>
              <span className="font-medium">{formatCurrency(item.total)}</span>
            </div>
          ))}
        </div>

        <div className="text-left mt-4 pt-4 border-t-2 border-slate-300">
          <span className="text-2xl font-bold text-cyan-700">
            {formatCurrency(proposalData.total_amount)}
          </span>
          <span className="text-slate-500 mr-2">(כולל מע"מ)</span>
        </div>

        {/* Signature Section for simple preview */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-slate-500 mb-1">תאריך</p>
              <p className="text-slate-700">{new Date().toLocaleDateString('he-IL')}</p>
            </div>
            <SignatureDisplay signatureData={signatureData} />
          </div>
        </div>
      </div>
    );
  }

  // Render with template structure
  const visibleSections = template.sections
    ?.filter(s => s.visible)
    .sort((a, b) => a.order - b.order) || [];

  return (
    <div className="bg-white text-slate-800 font-sans leading-relaxed shadow-2xl mx-auto" style={{ maxWidth: '210mm', minHeight: '297mm' }}>
      {/* Decorative Top Border */}
      <div className="h-2 w-full" style={{ backgroundColor: primaryColor }}></div>
      
      <div className="p-12 md:p-16 space-y-12">
        {visibleSections.map((section, index) => {
          switch (section.type) {
            case 'header':
              return (
                <div key={section.id} className="text-center space-y-6 pb-12 border-b border-slate-100">
                  <div className="flex justify-center">
                    {/* Logo Placeholder or Company Initials */}
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-serif font-bold text-white shadow-lg" style={{ backgroundColor: primaryColor }}>
                      {section.content?.company_name?.[0] || 'A'}
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight">
                      {section.content?.company_name || 'ArchiFlow'}
                    </h1>
                    {section.content?.tagline && (
                      <p className="text-slate-500 text-lg uppercase tracking-widest mt-3 font-light">
                        {section.content.tagline}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-center items-center gap-6 text-sm text-slate-500 font-medium">
                    <span>{section.content?.contact_info?.split('|')[0]}</span>
                    {section.content?.contact_info?.split('|')[1] && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        <span>{section.content?.contact_info?.split('|')[1]}</span>
                      </>
                    )}
                  </div>
                </div>
              );

            case 'intro':
              return (
                <div key={section.id} className="space-y-4 max-w-2xl mx-auto text-center">
                  <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">
                    {replaceVariables(section.content?.greeting)}
                  </h2>
                  <p className="text-lg text-slate-600 leading-loose">
                    {replaceVariables(section.content?.text) || proposalData.scope_of_work}
                  </p>
                </div>
              );

            case 'client_details':
              return (
                <div key={section.id} className="bg-slate-50 p-8 rounded-xl border border-slate-100">
                  <h3 className="text-sm uppercase tracking-widest font-bold text-slate-400 mb-6 border-b pb-2">לכבוד</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {section.content?.show_name !== false && (
                      <div>
                        <span className="block text-xs text-slate-400 mb-1">שם הלקוח</span>
                        <span className="text-xl font-serif font-medium text-slate-900">{project?.client}</span>
                      </div>
                    )}
                    {section.content?.show_address !== false && project?.location && (
                      <div>
                        <span className="block text-xs text-slate-400 mb-1">כתובת הפרויקט</span>
                        <span className="text-lg text-slate-700">{project?.location}</span>
                      </div>
                    )}
                    {section.content?.show_email !== false && project?.client_email && (
                      <div>
                        <span className="block text-xs text-slate-400 mb-1">אימייל</span>
                        <span className="text-slate-700">{project?.client_email}</span>
                      </div>
                    )}
                    {section.content?.show_phone !== false && project?.client_phone && (
                      <div>
                        <span className="block text-xs text-slate-400 mb-1">טלפון</span>
                        <span className="text-slate-700">{project?.client_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              );

            case 'services':
              return (
                <div key={section.id}>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200 inline-block pr-8" style={{ borderBottomColor: primaryColor }}>
                    {section.title}
                  </h3>
                  <div className="text-slate-600 leading-relaxed text-lg">
                    {replaceVariables(section.content?.description) || proposalData.scope_of_work}
                  </div>
                </div>
              );

            case 'pricing':
              return (
                <div key={section.id} className="mt-12">
                  <h3 className="text-2xl font-serif font-bold text-slate-900 mb-8 pb-2 border-b border-slate-200 inline-block pr-8" style={{ borderBottomColor: primaryColor }}>
                    {section.title}
                  </h3>
                  
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                          <th className="text-right py-4 px-6 font-semibold">תיאור השירות</th>
                          <th className="text-center py-4 px-4 font-semibold">כמות</th>
                          <th className="text-center py-4 px-4 font-semibold">מחיר יח'</th>
                          <th className="text-left py-4 px-6 font-semibold">סה"כ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {proposalData.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-5 px-6 text-slate-800 font-medium">{item.description}</td>
                            <td className="py-5 px-4 text-center text-slate-500">{item.quantity}</td>
                            <td className="py-5 px-4 text-center text-slate-500">{formatCurrency(item.unit_price)}</td>
                            <td className="py-5 px-6 text-left font-bold text-slate-900">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <div className="w-full md:w-1/2 bg-slate-50 p-6 rounded-xl space-y-3">
                      {section.content?.show_subtotal && (
                        <div className="flex justify-between text-slate-600">
                          <span>סכום ביניים</span>
                          <span>{formatCurrency(proposalData.subtotal)}</span>
                        </div>
                      )}
                      {section.content?.show_vat && (
                        <div className="flex justify-between text-slate-600">
                          <span>מע"מ ({proposalData.vat_percent}%)</span>
                          <span>{formatCurrency(proposalData.vat_amount)}</span>
                        </div>
                      )}
                      <div className="pt-4 border-t border-slate-200 mt-4">
                        <div className="flex justify-between items-end">
                          <span className="text-lg font-bold text-slate-900">סה"כ לתשלום</span>
                          <span className="text-3xl font-serif font-bold" style={{ color: primaryColor }}>
                            {formatCurrency(proposalData.total_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );

            case 'terms':
              return (
                <div key={section.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                      {section.title}
                    </h4>
                    <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                      {(section.content?.payment_terms || proposalData.payment_terms) && (
                        <div className="flex gap-2">
                          <span className="font-semibold text-slate-800">תנאי תשלום:</span>
                          <span>{section.content?.payment_terms || proposalData.payment_terms}</span>
                        </div>
                      )}
                      {(section.content?.validity || proposalData.terms_and_conditions) && (
                        <div className="flex gap-2">
                          <span className="font-semibold text-slate-800">תוקף:</span>
                          <span>{section.content?.validity || proposalData.terms_and_conditions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {(section.content?.notes || proposalData.notes) && (
                      <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-100 h-full">
                        <h4 className="font-bold text-amber-900 mb-3">הערות נוספות</h4>
                        <p className="text-sm text-amber-800/80 leading-relaxed">
                          {section.content?.notes || proposalData.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );

            case 'summary':
              return (
                <div key={section.id} className="text-center py-8">
                  <p className="text-xl font-serif italic text-slate-500">
                    "{replaceVariables(section.content?.text)}."
                  </p>
                </div>
              );

            case 'signature':
              return (
                <div key={section.id} className="mt-16 pt-12 pb-6">
                  <div className="flex justify-between items-end gap-12">
                    {section.content?.show_date !== false && (
                      <div className="text-center flex-1">
                        <div className="text-lg font-medium text-slate-900 pb-2 border-b-2 border-slate-200 mb-2">
                          {new Date().toLocaleDateString('he-IL')}
                        </div>
                        <p className="text-xs uppercase tracking-widest text-slate-400">תאריך</p>
                      </div>
                    )}
                    <div className="flex-1"></div> {/* Spacer */}
                    {section.content?.show_signature_line !== false && (
                      <div className="text-center flex-1">
                        <div className="pb-2 mb-2 min-h-[4rem] flex items-end justify-center">
                          {signatureData ? (
                            isRealSignatureImage(signatureData) ? (
                              <img 
                                src={signatureData} 
                                alt="חתימה דיגיטלית" 
                                className="h-14 object-contain"
                              />
                            ) : (
                              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full border border-green-200">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-medium text-sm">אושר דיגיטלית</span>
                              </div>
                            )
                          ) : (
                            <div className="w-full border-b-2 border-slate-200">
                              <span className="text-slate-300 text-sm">מקום לחתימה</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs uppercase tracking-widest text-slate-400">
                          {section.content?.signature_label || 'חתימת הלקוח'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
      
      {/* Decorative Footer */}
      <div className="h-4 w-full mt-auto" style={{ backgroundColor: primaryColor }}></div>
    </div>
  );
}