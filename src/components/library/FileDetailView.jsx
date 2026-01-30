import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Ruler, 
  Package, 
  Palette, 
  Image as ImageIcon,
  Info,
  ShoppingCart,
  Check,
  Star,
  Truck,
  Shield,
  Download,
} from 'lucide-react';
import { showSuccess } from '../utils/notifications';
import MoodboardDetailView from './MoodboardDetailView';

export default function FileDetailView({ file, onImageSelect }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(file.mainImage || 0);
  const [selectedColor, setSelectedColor] = useState(null);

  if (!file) return null;

  // Moodboard Details
  if (file.type === 'moodboard' && file.details) {
    return <MoodboardDetailView moodboard={file} />;
  }

  // OLD Moodboard fallback (if no extended details)
  if (file.type === 'moodboard') {
    return (
      <div className="space-y-6 mt-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" />
          פירוט לוח השראה
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Items */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              פריטים בלוח
            </h4>
            <ul className="space-y-2">
              {file.details.items.map((item, idx) => (
                <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              פלטת צבעים
            </h4>
            <div className="flex flex-wrap gap-3">
              {file.details.colors.map((color, idx) => (
                <div key={idx} className="text-center">
                  <div 
                    className="w-12 h-12 rounded-lg shadow-md border-2 border-white"
                    style={{ backgroundColor: color }}
                  ></div>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{color}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Style & Budget */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              סגנון
            </h4>
            <Badge className="bg-purple-100 text-purple-800 text-sm">
              {file.details.style}
            </Badge>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              תקציב משוער
            </h4>
            <p className="text-2xl font-bold text-purple-700">{file.details.budget}</p>
          </div>
        </div>
      </div>
    );
  }

  // Furniture Details
  if (file.type === 'furniture' && file.furniture) {
    const furn = file.furniture;
    
    const handleImageClick = (idx) => {
      setSelectedImageIndex(idx);
      if (onImageSelect) {
        onImageSelect(idx);
      }
      showSuccess('תמונה הוגדרה כתמונה ראשית ✓');
    };

    const handleSetMainImage = () => {
      showSuccess('תמונה נשמרה כתמונת נושא לרהיט ✓');
    };

    const handleAddToProject = () => {
      showSuccess('הרהיט נוסף לפרויקט בהצלחה! 🎉');
    };

    const handleDownloadSpecs = () => {
      showSuccess('מפרט טכני הורד בהצלחה 📄');
    };

    return (
      <div className="space-y-6 mt-6 p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            פרטי רהיט מלאים
          </h3>
          {furn.onSale && (
            <Badge className="bg-red-500 text-white text-sm px-3 py-1">
              🔥 מבצע
            </Badge>
          )}
        </div>

        {/* Multiple Images Gallery - INTERACTIVE */}
        {furn.images && furn.images.length > 1 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                גלריית תמונות ({furn.images.length})
              </h4>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleSetMainImage}
              >
                <Star className="w-4 h-4 ml-2" />
                הגדר כתמונת נושא
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {furn.images.map((img, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleImageClick(idx)}
                  className={`relative aspect-square rounded-lg overflow-hidden shadow-md cursor-pointer border-4 transition-all ${
                    selectedImageIndex === idx 
                      ? 'border-green-600 ring-2 ring-green-400' 
                      : 'border-transparent hover:border-green-300'
                  }`}
                >
                  <img src={img} alt={`זווית ${idx + 1}`} className="w-full h-full object-cover" />
                  {selectedImageIndex === idx && (
                    <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs text-center">תמונה {idx + 1}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-2 text-center">
              💡 לחץ על תמונה כדי להגדיר אותה כתמונה ראשית בספרייה
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SKU & Category */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 mb-2">קטגוריה</h4>
            <p className="text-slate-900 font-medium">{furn.category}</p>
            {furn.sku && (
              <p className="text-xs text-slate-500 mt-1">SKU: {furn.sku}</p>
            )}
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 mb-2">יצרן</h4>
            <p className="text-slate-900 font-medium">{furn.manufacturer}</p>
            {furn.warranty && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                אחריות: {furn.warranty}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              מחיר
            </h4>
            {furn.onSale && furn.salePrice ? (
              <div>
                <p className="text-sm text-slate-500 line-through">{furn.price}</p>
                <p className="text-2xl font-bold text-red-600">{furn.salePrice}</p>
                <p className="text-xs text-red-600 mt-1">
                  חסכון: ₪{parseInt(furn.price.replace(/[^\d]/g, '')) - parseInt(furn.salePrice.replace(/[^\d]/g, ''))}
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-green-700">{furn.price}</p>
            )}
          </div>

          {/* Dimensions & Weight */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              מידות ומשקל
            </h4>
            <p className="text-slate-900">{furn.dimensions}</p>
            {furn.weight && (
              <p className="text-sm text-slate-600 mt-1">משקל: {furn.weight}</p>
            )}
          </div>

          {/* Available Colors - INTERACTIVE */}
          <div className="bg-white rounded-lg p-4 md:col-span-2">
            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              צבעים זמינים
            </h4>
            <div className="flex flex-wrap gap-3">
              {(Array.isArray(furn.colors) ? 
                furn.colors.map((c, idx) => typeof c === 'string' ? { name: c, available: true } : c) 
                : []
              ).map((color, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedColor(idx)}
                  className={`relative cursor-pointer ${!color.available && 'opacity-50'}`}
                >
                  <div className="flex items-center gap-2 p-2 rounded-lg border-2 transition-colors"
                    style={{ 
                      borderColor: selectedColor === idx ? '#10b981' : '#e5e7eb',
                      backgroundColor: selectedColor === idx ? '#f0fdf4' : 'white'
                    }}
                  >
                    {color.hex && (
                      <div
                        className="w-8 h-8 rounded-md border-2 border-white shadow-md"
                        style={{ backgroundColor: color.hex }}
                      ></div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-900">{color.name}</p>
                      <p className="text-xs text-slate-500">
                        {color.available ? '✓ זמין במלאי' : '✗ לא זמין'}
                      </p>
                    </div>
                  </div>
                  {selectedColor === idx && (
                    <div className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Materials */}
          <div className="bg-white rounded-lg p-4 md:col-span-2">
            <h4 className="font-semibold text-slate-700 mb-3">חומרים ובניה</h4>
            <div className="flex flex-wrap gap-2">
              {furn.materials.map((material, idx) => (
                <Badge key={idx} className="bg-green-100 text-green-800 text-sm">
                  {material}
                </Badge>
              ))}
            </div>
          </div>

          {/* Delivery & Assembly */}
          {(furn.delivery || furn.assembly) && (
            <div className="bg-white rounded-lg p-4 md:col-span-2">
              <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                משלוח והרכבה
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {furn.delivery && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>{furn.delivery}</span>
                  </div>
                )}
                {furn.assembly && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Package className="w-4 h-4 text-orange-600" />
                    <span>{furn.assembly}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Features */}
          {furn.features && furn.features.length > 0 && (
            <div className="bg-white rounded-lg p-4 md:col-span-2">
              <h4 className="font-semibold text-slate-700 mb-3">תכונות מיוחדות</h4>
              <ul className="space-y-2">
                {furn.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
          <Button 
            onClick={handleAddToProject}
            className="bg-green-600 hover:bg-green-700 h-12"
          >
            <ShoppingCart className="w-5 h-5 ml-2" />
            הוסף לפרויקט
          </Button>
          <Button 
            onClick={handleDownloadSpecs}
            variant="outline" 
            className="h-12"
          >
            <Download className="w-5 h-5 ml-2" />
            הורד מפרט טכני
          </Button>
        </div>
      </div>
    );
  }

  // Texture Details
  if (file.type === 'texture' && file.texture) {
    return (
      <div className="space-y-6 mt-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          פרטים טכניים מלאים
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 text-sm mb-2">סוג חומר</h4>
            <p className="text-slate-900 font-medium">{file.texture.type}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 text-sm mb-2">גימור</h4>
            <p className="text-slate-900 font-medium">{file.texture.finish}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 text-sm mb-2">עובי</h4>
            <p className="text-slate-900 font-medium">{file.texture.thickness || 'משתנה'}</p>
          </div>
          <div className="bg-white rounded-lg p-4 md:col-span-2">
            <h4 className="font-semibold text-slate-700 text-sm mb-2">שימושים מומלצים</h4>
            <p className="text-slate-600 text-sm">{file.texture.usage}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 text-sm mb-2">התקנה</h4>
            <p className="text-slate-600 text-sm">{file.texture.installation || 'סטנדרטי'}</p>
          </div>
          <div className="bg-white rounded-lg p-4 md:col-span-3">
            <h4 className="font-semibold text-slate-700 text-sm mb-2">תחזוקה</h4>
            <p className="text-slate-600 text-sm">{file.texture.maintenance || 'תחזוקה רגילה'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
            <ShoppingCart className="w-4 h-4 ml-2" />
            הוסף לפרויקט
          </Button>
          <Button variant="outline" className="flex-1">
            <Download className="w-4 h-4 ml-2" />
            הורד מפרט
          </Button>
        </div>
      </div>
    );
  }

  // Reference Details
  if (file.type === 'reference' && file.reference) {
    return (
      <div className="space-y-6 mt-6 p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Info className="w-5 h-5 text-orange-600" />
          פרטי רפרנס מלאים
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 text-sm mb-2">חלל</h4>
            <p className="text-slate-900 font-medium">{file.reference.room}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 text-sm mb-2">סגנון</h4>
            <p className="text-slate-900 font-medium">{file.reference.style}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 text-sm mb-2">שטח</h4>
            <p className="text-slate-900 font-medium">{file.reference.area || 'לא צוין'}</p>
          </div>
          {file.reference.colors && (
            <div className="bg-white rounded-lg p-4 md:col-span-3">
              <h4 className="font-semibold text-slate-700 text-sm mb-2">צבעים עיקריים</h4>
              <div className="flex flex-wrap gap-2">
                {file.reference.colors.map((color, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white rounded-lg p-4 md:col-span-3">
            <h4 className="font-semibold text-slate-700 text-sm mb-2">תיאור ופרטים</h4>
            <p className="text-slate-700 leading-relaxed">{file.reference.notes}</p>
          </div>
          {file.reference.budget && (
            <div className="bg-white rounded-lg p-4 md:col-span-3">
              <h4 className="font-semibold text-slate-700 text-sm mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                תקציב משוער
              </h4>
              <p className="text-2xl font-bold text-orange-700">{file.reference.budget}</p>
            </div>
          )}
        </div>
        <Button className="w-full bg-orange-600 hover:bg-orange-700 h-12">
          <Star className="w-5 h-5 ml-2" />
          שמור כהשראה לפרויקט
        </Button>
      </div>
    );
  }

  return null;
}