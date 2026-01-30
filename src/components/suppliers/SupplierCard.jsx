import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Phone, Mail, Package, MapPin } from 'lucide-react';

const categoryLabels = {
  furniture: 'ריהוט',
  lighting: 'תאורה',
  flooring: 'ריצוף',
  tiles: 'אריחים',
  sanitary: 'סניטריה',
  kitchen: 'מטבחים',
  doors_windows: 'דלתות וחלונות',
  paint: 'צבעים',
  fabrics: 'טקסטיל',
  accessories: 'אביזרים',
  outdoor: 'חוץ',
  electronics: 'אלקטרוניקה',
  other: 'אחר'
};

const categoryColors = {
  furniture: 'bg-amber-100 text-amber-700',
  lighting: 'bg-yellow-100 text-yellow-700',
  flooring: 'bg-stone-100 text-stone-700',
  tiles: 'bg-blue-100 text-blue-700',
  sanitary: 'bg-cyan-100 text-cyan-700',
  kitchen: 'bg-orange-100 text-orange-700',
  doors_windows: 'bg-emerald-100 text-emerald-700',
  paint: 'bg-pink-100 text-pink-700',
  fabrics: 'bg-purple-100 text-purple-700',
  accessories: 'bg-rose-100 text-rose-700',
  outdoor: 'bg-green-100 text-green-700',
  electronics: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-700'
};

export default function SupplierCard({ supplier, index = 0, onClick }) {
  const rating = supplier.rating || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="bg-card border-border shadow-organic hover:shadow-organic-lg transition-all duration-300 overflow-hidden group">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-organic flex-shrink-0">
              {supplier.name?.charAt(0).toUpperCase() || 'S'}
            </div>

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground text-lg truncate group-hover:text-primary transition-colors">
                    {supplier.name}
                  </h3>
                  {supplier.company && (
                    <p className="text-sm text-muted-foreground truncate">
                      {supplier.company}
                    </p>
                  )}
                </div>
                <Badge className={`${categoryColors[supplier.category] || categoryColors.other} border-0 text-xs`}>
                  {categoryLabels[supplier.category] || 'אחר'}
                </Badge>
              </div>

              {/* Rating */}
              {rating > 0 && (
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground mr-1">({rating})</span>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-1.5">
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="truncate">{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                )}
              </div>

              {/* Footer Stats */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Package className="w-3.5 h-3.5" />
                  <span>{supplier.orders_completed || 0} הזמנות</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    supplier.status === 'active' 
                      ? 'border-green-300 text-green-700 bg-green-50' 
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  {supplier.status === 'active' ? 'פעיל' : supplier.status === 'on_hold' ? 'מושהה' : 'לא פעיל'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}