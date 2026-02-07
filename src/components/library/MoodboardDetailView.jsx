import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Palette,
  Package,
  DollarSign,
  Home,
  Users,
  FileText,
  Plus,
  Trash2,
  Edit,
  Download,
  Share2,
  Link as LinkIcon,
  Copy,
  Send,
} from 'lucide-react';
import { showSuccess } from '../utils/notifications';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function MoodboardDetailView({ moodboard, onClose }) {
  const { t } = useLanguage();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState(moodboard.details);

  const handleExport = () => {
    showSuccess('לוח ההשראה מיוצא כ-PDF 📄');
  };

  const handleShare = () => {
    showSuccess('קישור שיתוף הועתק ללוח ✓');
  };

  const handleSendToClient = () => {
    showSuccess('לוח ההשראה נשלח ללקוח בהצלחה 📧');
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{moodboard.name}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 ml-2" />
            שתף
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 ml-2" />
            ייצא PDF
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSendToClient}>
            <Send className="w-4 h-4 ml-2" />
            שלח ללקוח
          </Button>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <h4 className="font-semibold text-purple-900">פרויקט</h4>
            </div>
            <p className="text-lg font-bold text-slate-900">{editedData.projectName}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-blue-900">לקוח</h4>
            </div>
            <p className="text-lg font-bold text-slate-900">{editedData.client}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <h4 className="font-semibold text-green-900">תקציב</h4>
            </div>
            <p className="text-xl font-bold text-green-700">{editedData.totalBudget}</p>
            <p className="text-xs text-slate-600">משוער: {editedData.estimatedBudget}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rooms */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">חללים בפרויקט</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {editedData.rooms.map((room, idx) => (
              <Badge key={idx} className="bg-indigo-100 text-indigo-800 px-3 py-1">
                {room}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Palette */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-slate-900">פלטת צבעים</h3>
          </div>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {editedData.colors.map((color, idx) => (
              <div key={idx} className="group relative">
                <div
                  className="w-full aspect-square rounded-xl shadow-lg cursor-pointer transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onClick={() => {
                      navigator.clipboard.writeText(color);
                      showSuccess(`צבע ${color} הועתק ללוח`);
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-center mt-1 font-mono text-slate-600">{color}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Materials */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">חומרים</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {editedData.materials.map((material, idx) => (
              <div key={idx} className="bg-slate-50 rounded-lg p-3 text-center border border-slate-200">
                <p className="font-medium text-slate-900">{material}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Items Breakdown */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">פריטים ומחירים</h3>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 ml-2" />
              הוסף פריט
            </Button>
          </div>

          <div className="space-y-3">
            {editedData.items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-600">כמות: {item.qty}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-indigo-700">{item.price}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('a11y.viewLink')} title={t('a11y.viewLink')}>
                    <LinkIcon className="w-4 h-4" aria-hidden />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 pt-4 border-t-2 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-700">סה״כ פריטים:</span>
              <span className="text-2xl font-bold text-indigo-700">
                ₪{editedData.items.reduce((sum, item) => sum + parseInt(item.price.replace(/[^\d]/g, '')), 0).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-slate-500 text-left mt-1">
              (לא כולל עבודה, משלוח והרכבה)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Style & Notes */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">סגנון עיצובי</h4>
              <Badge className="bg-purple-100 text-purple-800 text-base px-4 py-1">
                {editedData.style}
              </Badge>
            </div>
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">הערות והנחיות</h4>
              <p className="text-slate-600 bg-slate-50 p-4 rounded-lg leading-relaxed">
                {editedData.notes}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Furniture */}
      {editedData.furnitureIds && editedData.furnitureIds.length > 0 && (
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-indigo-900">רהיטים משוייכים</h3>
            </div>
            <p className="text-sm text-indigo-700">
              {editedData.furnitureIds.length} רהיטים משוייכים ללוח השראה זה
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              <LinkIcon className="w-4 h-4 ml-2" />
              הצג רהיטים
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}