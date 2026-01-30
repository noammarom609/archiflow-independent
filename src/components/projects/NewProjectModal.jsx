import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar, DollarSign, Upload, X, User, Search, Check, Home, Building, Building2, Briefcase, Castle, UtensilsCrossed, Store, Sparkles, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { PROJECT_TYPES, PROJECT_CATEGORIES } from '../utils/checklistLoader';
import { useAuth } from '@/lib/AuthContext';

const stockImages = [
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80',
];

export default function NewProjectModal({ isOpen, onClose, onCreateProject, preselectedClient = null, preselectedClientId = null }) {
  const { user } = useAuth();
  const userEmail = user?.email;
  
  // Fetch existing clients for selection
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => archiflow.entities.Client.list('-created_date'),
    enabled: isOpen,
  });

  // Find preselected client by ID
  const clientFromId = preselectedClientId 
    ? clients.find(c => c.id === preselectedClientId) 
    : null;

  const [formData, setFormData] = useState({
    name: '',
    client: '',
    client_id: '',
    client_email: '',
    client_phone: '',
    location: '',
    project_type: 'renovation_apartment', // New field matching entity enum
    budget: '',
    startDate: '',
    endDate: '',
    image: stockImages[0],
  });

  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null); // No category expanded by default
  const [isEditingProjectType, setIsEditingProjectType] = useState(false); // Controls whether full list is shown

  // Pre-populate with preselected client
  useEffect(() => {
    const clientToSelect = preselectedClient || clientFromId;
    if (clientToSelect && isOpen) {
      selectClient(clientToSelect);
    }
  }, [preselectedClient, clientFromId, isOpen]);

  // Filter clients based on search
  const filteredClients = clients.filter(c => 
    c.full_name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    c.phone?.includes(clientSearchQuery) ||
    c.email?.toLowerCase().includes(clientSearchQuery.toLowerCase())
  );

  const selectClient = (client) => {
    setSelectedClient(client);
    setFormData(prev => ({
      ...prev,
      client: client.full_name,
      client_id: client.id,
      client_email: client.email || '',
      client_phone: client.phone || '',
      location: prev.location || client.address || '',
    }));
    setClientSearchQuery('');
    setShowClientDropdown(false);
  };

  const clearClientSelection = () => {
    setSelectedClient(null);
    setFormData(prev => ({
      ...prev,
      client: '',
      client_id: '',
      client_email: '',
      client_phone: '',
    }));
  };

  const [errors, setErrors] = useState({});
  const [showImagePicker, setShowImagePicker] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'שם הפרויקט חובה';
    }
    if (!formData.client.trim()) {
      newErrors.client = 'שם הלקוח חובה';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Format timeline
    const timeline = formData.startDate && formData.endDate
      ? `${new Date(formData.startDate).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })} - ${new Date(formData.endDate).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}`
      : 'לא צוין';

    const newProject = {
      name: formData.name,
      client_id: formData.client_id || null,
      client_email: formData.client_email || null,
      client_phone: formData.client_phone || null,
      location: formData.location || 'לא צוין',
      timeline,
      budget: formData.budget ? parseInt(formData.budget) : 0,
      status: 'active',
      current_stage: 'first_call',
      image: formData.image,
      project_type: formData.project_type,
      start_date: formData.startDate || null,
      end_date: formData.endDate || null,
      architect_email: userEmail,
      created_by: userEmail,
    };

    // If a new client name was entered (no existing client selected), create a Client entity
    if (!formData.client_id && formData.client.trim()) {
      try {
        const newClient = await archiflow.entities.Client.create({
          full_name: formData.client.trim(),
          email: formData.client_email || null,
          phone: formData.client_phone || null,
          address: formData.location || null,
          status: 'lead',
          architect_email: userEmail,
          created_by: userEmail,
        });
        // Link the new client to the project
        newProject.client_id = newClient.id;
      } catch (error) {
        console.error("Failed to create Client entity:", error);
        showError("שגיאה ביצירת כרטיס לקוח. הפרויקט ייווצר ללא קישור ללקוח.");
      }
    }

    onCreateProject(newProject);
    showSuccess('הפרויקט הוקם בהצלחה! 🎉');
    
    // Reset form
    setFormData({
      name: '',
      client: '',
      client_id: '',
      client_email: '',
      client_phone: '',
      location: '',
      project_type: 'renovation_apartment',
      budget: '',
      startDate: '',
      endDate: '',
      image: stockImages[0],
    });
    setSelectedClient(null);
    setClientSearchQuery('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            הקמת פרויקט חדש
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Row 1: Project Name + Client Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                שם הפרויקט <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="שיפוץ דופלקס - משפחת כהן"
                className={`mt-2 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="relative">
              <Label htmlFor="client" className="text-sm font-semibold text-slate-700">
                לקוח <span className="text-red-500">*</span>
              </Label>
              
              {selectedClient ? (
                <div className="mt-2 flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{selectedClient.full_name}</p>
                      <p className="text-sm text-slate-500">{selectedClient.phone}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearClientSelection}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative mt-2">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="client"
                    value={clientSearchQuery || formData.client}
                    onChange={(e) => {
                      setClientSearchQuery(e.target.value);
                      handleChange('client', e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="חפש לקוח קיים או הזן שם חדש..."
                    className={`pr-10 ${errors.client ? 'border-red-500' : ''}`}
                  />
                  
                  {/* Clients Dropdown */}
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">לקוחות קיימים</p>
                      </div>
                      {filteredClients.slice(0, 5).map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => selectClient(client)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-right transition-colors"
                        >
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{client.full_name}</p>
                            <p className="text-sm text-slate-500">{client.phone}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {client.status === 'active' ? 'פעיל' : 'ליד'}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {errors.client && (
                <p className="text-xs text-red-500 mt-1">{errors.client}</p>
              )}
            </div>
          </div>

          {/* Row 2: Project Type Selection - Compact with Edit Mode */}
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-3 block">
              סוג פרויקט <span className="text-red-500">*</span>
            </Label>
            
            {/* Compact View - Selected Type with Edit Button */}
            {!isEditingProjectType && formData.project_type && PROJECT_TYPES[formData.project_type] && (
              <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-indigo-900">{PROJECT_TYPES[formData.project_type].label}</p>
                    <p className="text-xs text-indigo-600">נבחר</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProjectType(true)}
                  className="border-indigo-300 bg-white text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 shadow-sm"
                >
                  <Pencil className="w-4 h-4 ml-1" />
                  ערוך
                </Button>
              </div>
            )}
            
            {/* Full Categories List - Only shown in edit mode */}
            <AnimatePresence>
              {isEditingProjectType && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-2">
                    {Object.entries(PROJECT_CATEGORIES).map(([categoryKey, category]) => {
                      const isExpanded = expandedCategory === categoryKey;
                      const CategoryIcon = categoryKey === 'residential' ? Home : categoryKey === 'commercial' ? Building2 : Sparkles;
                      const hasSelectedType = category.types.includes(formData.project_type);
                      
                      return (
                        <div key={categoryKey} className="border border-slate-100 rounded-lg overflow-hidden">
                          {/* Category Header */}
                          <button
                            type="button"
                            onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
                            className={`
                              w-full flex items-center justify-between p-3 text-right transition-colors
                              ${hasSelectedType ? 'bg-indigo-50' : 'bg-slate-50 hover:bg-slate-100'}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <CategoryIcon className={`w-5 h-5 ${hasSelectedType ? 'text-indigo-600' : 'text-slate-500'}`} />
                              <span className={`font-medium ${hasSelectedType ? 'text-indigo-900' : 'text-slate-700'}`}>
                                {category.label}
                              </span>
                              {hasSelectedType && (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                  נבחר
                                </span>
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          
                          {/* Category Types */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-2 grid grid-cols-2 gap-2 bg-white">
                                  {category.types.map((typeKey) => {
                                    const config = PROJECT_TYPES[typeKey];
                                    if (!config) return null;
                                    
                                    const isSelected = formData.project_type === typeKey;
                                    
                                    // Get appropriate icon
                                    const getIcon = () => {
                                      if (config.icon === 'Castle') return Castle;
                                      if (config.icon === 'UtensilsCrossed') return UtensilsCrossed;
                                      if (config.icon === 'Store') return Store;
                                      if (config.icon === 'Sparkles') return Sparkles;
                                      if (config.icon === 'Building2') return Building2;
                                      if (config.icon === 'Briefcase') return Briefcase;
                                      if (config.icon === 'Building') return Building;
                                      return Home;
                                    };
                                    const TypeIcon = getIcon();
                                    
                                    return (
                                      <button
                                        key={typeKey}
                                        type="button"
                                        onClick={() => {
                                          handleChange('project_type', typeKey);
                                          setIsEditingProjectType(false); // Auto-collapse after selection
                                          setExpandedCategory(null);
                                        }}
                                        className={`
                                          relative p-3 rounded-lg border-2 text-right transition-all duration-200
                                          ${isSelected 
                                            ? 'border-indigo-500 bg-indigo-50' 
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                          }
                                        `}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className={`
                                            w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                            ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}
                                          `}>
                                            <TypeIcon className="w-4 h-4" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className={`font-medium text-xs ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                              {config.shortLabel}
                                            </p>
                                          </div>
                                          {isSelected && (
                                            <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <p className="text-xs text-slate-500 mt-2">
              סוג הפרויקט קובע את צ'קליסט בירור הצרכים בפגישה ראשונה
            </p>
          </div>

          {/* Row 3: Location */}
          <div>
            <Label htmlFor="location" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              כתובת/מיקום
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="תל אביב, רח' דיזנגוף 123"
              className="mt-2"
            />
          </div>

          {/* Row 3: Budget + Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                תקציב משוער
              </Label>
              <div className="relative mt-2">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleChange('budget', e.target.value)}
                  placeholder="450000"
                  className="pr-8"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                טווח זמנים
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  placeholder="התחלה"
                />
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  placeholder="סיום"
                />
              </div>
            </div>
          </div>

          {/* Image Selection */}
          <div>
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              תמונת כיסוי
            </Label>
            <div className="mt-2 space-y-3">
              {/* Current Image Preview */}
              <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-slate-200">
                <img
                  src={formData.image}
                  alt="Project cover"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Stock Images Picker */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowImagePicker(!showImagePicker)}
                className="w-full"
              >
                בחר תמונה מהגלריה
              </Button>

              {showImagePicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-4 gap-2"
                >
                  {stockImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        handleChange('image', img);
                        setShowImagePicker(false);
                      }}
                      className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        formData.image === img
                          ? 'border-indigo-600 ring-2 ring-indigo-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={img} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              צור פרויקט
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}