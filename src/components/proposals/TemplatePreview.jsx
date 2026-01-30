import React from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Send, Printer, Image } from 'lucide-react';
import ElementRenderer from './canvas/ElementRenderer';

export default function TemplatePreview({ template }) {
  const primaryColor = template.styling?.primary_color || '#4338ca';
  
  // Get pages - support both new (pages) and old (sections/items) format
  const pages = React.useMemo(() => {
    if (template.pages && template.pages.length > 0) {
      return template.pages;
    }

    // Fallback for templates with sections but no pages
    if (template.sections && template.sections.length > 0) {
      return [{ id: 'page_1', name: 'דף 1', sections: template.sections, elements: [] }];
    }

    // Fallback for legacy templates with items only (system templates)
    if (template.items && template.items.length > 0) {
      const defaultSections = [
        { id: 'header', type: 'header', title: 'כותרת', visible: true, order: 0, content: { company_name: 'שם החברה', tagline: '', contact_info: '' } },
        { id: 'intro', type: 'intro', title: 'פתיח', visible: true, order: 1, content: { greeting: 'שלום {{ClientName}},', text: template.description || 'הצעת מחיר' } },
        { 
            id: 'pricing', 
            type: 'pricing', 
            title: 'פירוט מחירים', 
            visible: true, 
            order: 2, 
            content: { 
                items: template.items.map(i => ({ description: i.title, quantity: i.quantity || 1, unit: 'יח\'', price: i.price || 0 })),
                show_subtotal: true,
                show_vat: true,
                vat_percent: 17
            } 
        },
        { id: 'terms', type: 'terms', title: 'תנאים', visible: true, order: 3, content: { payment_terms: 'שוטף + 30', validity: '30 יום' } },
        { id: 'signature', type: 'signature', title: 'חתימה', visible: true, order: 4, content: { show_date: true, show_signature_line: true } }
      ];
      return [{ id: 'page_1', name: 'דף 1', sections: defaultSections, elements: [] }];
    }

    // Empty fallback
    return [{ id: 'page_1', name: 'דף 1', sections: [], elements: [] }];
  }, [template]);

  // Replace variables with sample data
  const replaceVariables = (text) => {
    if (!text) return text;
    return text
      .replace(/\{\{ClientName\}\}/g, 'ישראל ישראלי')
      .replace(/\{\{ProjectName\}\}/g, 'שיפוץ דירה')
      .replace(/\{\{ClientEmail\}\}/g, 'israel@example.com')
      .replace(/\{\{ClientPhone\}\}/g, '050-1234567')
      .replace(/\{\{ClientAddress\}\}/g, 'תל אביב, רחוב הרצל 1')
      .replace(/\{\{TotalPrice\}\}/g, '₪45,000')
      .replace(/\{\{Subtotal\}\}/g, '₪38,462')
      .replace(/\{\{VAT\}\}/g, '₪6,538')
      .replace(/\{\{Date\}\}/g, new Date().toLocaleDateString('he-IL'));
  };

  const renderSection = (section) => {
    switch (section.type) {
      case 'header':
        return (
          <div className="text-center space-y-6 pb-12 border-b border-slate-100 px-12 pt-12">
            <div className="flex justify-center">
              {section.content?.logo_url ? (
                <img src={section.content.logo_url} alt="Logo" className="h-24 w-auto object-contain" />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-serif font-bold text-white shadow-lg" style={{ backgroundColor: primaryColor }}>
                  {section.content?.company_name?.[0] || 'A'}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight">
                {section.content?.company_name || 'שם החברה'}
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
          <div className="px-12 py-8 space-y-4 max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">
              {replaceVariables(section.content?.greeting)}
            </h2>
            <p className="text-lg text-slate-600 leading-loose">
              {replaceVariables(section.content?.text)}
            </p>
          </div>
        );

      case 'client_details':
        return (
          <div className="mx-12 my-6 bg-slate-50 p-8 rounded-xl border border-slate-100">
            <h3 className="text-sm uppercase tracking-widest font-bold text-slate-400 mb-6 border-b pb-2">לכבוד</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {section.content?.show_name !== false && (
                <div>
                  <span className="block text-xs text-slate-400 mb-1">שם הלקוח</span>
                  <span className="text-xl font-serif font-medium text-slate-900">ישראל ישראלי</span>
                </div>
              )}
              {section.content?.show_address !== false && (
                <div>
                  <span className="block text-xs text-slate-400 mb-1">כתובת הפרויקט</span>
                  <span className="text-lg text-slate-700">תל אביב, רחוב הרצל 1</span>
                </div>
              )}
              {section.content?.show_email !== false && (
                <div>
                  <span className="block text-xs text-slate-400 mb-1">אימייל</span>
                  <span className="text-slate-700">israel@example.com</span>
                </div>
              )}
              {section.content?.show_phone !== false && (
                <div>
                  <span className="block text-xs text-slate-400 mb-1">טלפון</span>
                  <span className="text-slate-700">050-1234567</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="px-12 py-8">
            <h3 className="text-2xl font-serif font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200 inline-block pr-8" style={{ borderBottomColor: primaryColor }}>
              {section.title}
            </h3>
            <div className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
              {section.content?.description}
            </div>
          </div>
        );

      case 'pricing':
        const items = section.content?.items || [];
        const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
        const vatPercent = section.content?.vat_percent || 17;
        const vatAmount = (subtotal * vatPercent) / 100;
        const total = subtotal + vatAmount;

        return (
          <div className="px-12 py-8 mt-4">
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
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 px-6 text-slate-800 font-medium">{item.description}</td>
                      <td className="py-5 px-4 text-center text-slate-500">{item.quantity}</td>
                      <td className="py-5 px-4 text-center text-slate-500">₪{(item.price || 0).toLocaleString()}</td>
                      <td className="py-5 px-6 text-left font-bold text-slate-900">₪{((item.quantity || 0) * (item.price || 0)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-end">
              <div className="w-full md:w-1/2 bg-slate-50 p-6 rounded-xl space-y-3">
                {section.content?.show_subtotal !== false && (
                  <div className="flex justify-between text-slate-600">
                    <span>סכום ביניים</span>
                    <span>₪{subtotal.toLocaleString()}</span>
                  </div>
                )}
                {section.content?.show_vat !== false && (
                  <div className="flex justify-between text-slate-600">
                    <span>מע"מ ({vatPercent}%)</span>
                    <span>₪{vatAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-200 mt-4">
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-slate-900">סה"כ לתשלום</span>
                    <span className="text-3xl font-serif font-bold" style={{ color: primaryColor }}>
                      ₪{total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="mx-12 my-8 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                {section.title}
              </h4>
              <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                {section.content?.payment_terms && (
                  <div className="flex gap-2">
                    <span className="font-semibold text-slate-800">תנאי תשלום:</span>
                    <span>{section.content.payment_terms}</span>
                  </div>
                )}
                {section.content?.validity && (
                  <div className="flex gap-2">
                    <span className="font-semibold text-slate-800">תוקף:</span>
                    <span>{section.content.validity}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              {section.content?.notes && (
                <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-100 h-full">
                  <h4 className="font-bold text-amber-900 mb-3">הערות נוספות</h4>
                  <p className="text-sm text-amber-800/80 leading-relaxed whitespace-pre-wrap">
                    {section.content.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="px-12 py-8 text-center">
            <p className="text-xl font-serif italic text-slate-500 mb-8">
              "{section.content?.text}"
            </p>
            {section.content?.cta_text && (
              <Button 
                size="lg" 
                style={{ backgroundColor: primaryColor }} 
                className="px-12 py-6 text-lg"
              >
                {section.content.cta_text}
              </Button>
            )}
          </div>
        );

      case 'signature':
        return (
          <div className="px-12 mt-16 pt-12 pb-12">
            <div className="flex justify-between items-end gap-12">
              {section.content?.show_date !== false && (
                <div className="text-center flex-1">
                  <div className="text-lg font-medium text-slate-900 pb-2 border-b-2 border-slate-200 mb-2">
                    {new Date().toLocaleDateString('he-IL')}
                  </div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">תאריך</p>
                </div>
              )}
              <div className="flex-1"></div>
              {section.content?.show_signature_line !== false && (
                <div className="text-center flex-1">
                  <div className="pb-2 border-b-2 border-slate-200 mb-2 h-16 flex items-end justify-center">
                    <span className="text-slate-300 text-sm">מקום לחתימה</span>
                  </div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    {section.content?.signature_label || 'חתימה'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'text_block':
        return (
          <div className="p-10">
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
              {replaceVariables(section.content?.text)}
            </p>
          </div>
        );

      case 'image_block':
        return (
          <div className="p-10 flex justify-center">
            {section.content?.image_url ? (
              <img 
                src={section.content.image_url} 
                alt={section.content?.alt_text || ''} 
                className="max-w-full rounded-xl shadow-lg"
                style={{ 
                  maxHeight: section.styling?.max_height || 400,
                  objectFit: section.styling?.object_fit || 'contain'
                }}
              />
            ) : (
              <div className="w-64 h-40 bg-slate-100 rounded-xl flex items-center justify-center">
                <Image className="w-10 h-10 text-slate-300" />
              </div>
            )}
          </div>
        );

      case 'divider':
        return (
          <div className="px-10 py-4">
            <hr 
              className="border-slate-200" 
              style={{ borderStyle: section.content?.style || 'solid' }}
            />
          </div>
        );

      case 'spacer':
        return <div style={{ height: section.content?.height || 24 }} />;

      default:
        return null;
    }
  };

  // Render freeform elements
  const renderFreeformElements = (elements) => {
    if (!elements || elements.length === 0) return null;
    
    return (
      <div className="relative" style={{ minHeight: 800 }}>
        {elements.map((element) => (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: element.x || 0,
              top: element.y || 0,
              width: element.width || 200,
              height: element.height || 100,
              transform: `rotate(${element.rotation || 0}deg)`,
              zIndex: element.zIndex || 1,
            }}
          >
            <ElementRenderer element={element} styling={template.styling} isEditing={false} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-200">
      {/* Preview Controls */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-700">תצוגה מקדימה</Badge>
          <span className="text-sm text-slate-500">כך ייראה המסמך ללקוח</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 ml-2" />
            הדפס
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 ml-2" />
            הורד PDF
          </Button>
        </div>
      </div>

      {/* Document Preview */}
      <ScrollArea className="flex-1 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {pages.map((page, pageIndex) => (
            <div key={page.id} className="mb-8">
              {/* Page indicator */}
              {pages.length > 1 && (
                <div className="text-center mb-4">
                  <Badge variant="outline" className="text-xs">
                    {page.name || `דף ${pageIndex + 1}`} מתוך {pages.length}
                  </Badge>
                </div>
              )}
              
              <div 
                className="bg-white rounded-2xl shadow-2xl overflow-hidden"
                style={{ 
                  backgroundColor: page.styling?.background_color || template.styling?.background_color || '#ffffff',
                  minHeight: 800
                }}
              >
                {/* Render freeform elements if exist */}
                {page.elements && page.elements.length > 0 ? (
                  renderFreeformElements(page.elements)
                ) : (
                  /* Render block sections */
                  (page.sections || [])
                    .filter(s => s.visible)
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div key={section.id}>
                        {renderSection(section)}
                      </div>
                    ))
                )}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-slate-500">
            <p>מסמך זה הופק באמצעות ArchiFlow</p>
          </div>
        </motion.div>
      </ScrollArea>
    </div>
  );
}