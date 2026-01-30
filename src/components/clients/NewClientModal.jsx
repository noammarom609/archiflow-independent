import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Phone, Mail, MapPin, Loader2, Plus, X, Users, Heart, Ruler, Home, Accessibility } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showSuccess, showError } from '../utils/notifications';
import { useAuth } from '@/lib/AuthContext';

// Validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\-+().\s]{7,20}$/;

export default function NewClientModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    company: '',
    source: 'other',
    notes: '',
    // Personal preferences for project planning
    personal_preferences: {
      // Household members with ergonomic info
      household_members: [],
      // Lifestyle preferences
      lifestyle: {
        religious_level: '', // secular, traditional, religious, ultra_orthodox
        kosher_kitchen: false,
        shabbat_considerations: false,
      },
      // Additional preferences
      additional: {
        pets: [],
        work_from_home: false,
        hobbies: [],
        entertaining_frequency: '', // rarely, occasionally, frequently
        storage_needs: '', // minimal, average, extensive
        accessibility_needs: [],
      }
    }
  });
  
  const [activeTab, setActiveTab] = useState('basic');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberHeight, setNewMemberHeight] = useState('');
  const [newMemberNotes, setNewMemberNotes] = useState('');
  const [newPetType, setNewPetType] = useState('');
  const [newHobby, setNewHobby] = useState('');
  const [errors, setErrors] = useState({});

  const createClientMutation = useMutation({
    mutationFn: (data) => archiflow.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showSuccess('לקוח נוצר בהצלחה!');
      onClose();
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        company: '',
        source: 'other',
        notes: '',
        personal_preferences: {
          household_members: [],
          lifestyle: {
            religious_level: '',
            kosher_kitchen: false,
            shabbat_considerations: false,
          },
          additional: {
            pets: [],
            work_from_home: false,
            hobbies: [],
            entertaining_frequency: '',
            storage_needs: '',
            accessibility_needs: [],
          }
        }
      });
      setActiveTab('basic');
    },
    onError: () => {
      showError('שגיאה ביצירת הלקוח');
    },
  });

  const validateField = (field, value) => {
    if (field === 'phone') {
      if (!value) return 'שדה חובה';
      if (!PHONE_REGEX.test(value)) return 'מספר טלפון לא תקין (לפחות 7 ספרות)';
    }
    if (field === 'email' && value && !EMAIL_REGEX.test(value)) {
      return 'כתובת אימייל לא תקינה';
    }
    return null;
  };

  const handleFieldBlur = (field) => {
    const error = validateField(field, formData[field]);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = () => {
    if (!formData.full_name || !formData.phone) {
      showError('שם וטלפון הם שדות חובה');
      return;
    }

    // Validate all fields
    const newErrors = {};
    const phoneError = validateField('phone', formData.phone);
    const emailError = validateField('email', formData.email);
    
    if (phoneError) newErrors.phone = phoneError;
    if (emailError) newErrors.email = emailError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createClientMutation.mutate({
      ...formData,
      status: 'lead',
      first_contact_date: new Date().toISOString().split('T')[0],
      // Add architect_id and architect_email for multi-tenant filtering
      architect_id: currentUser?.id || null,
      architect_email: currentUser?.email,
      created_by: currentUser?.email,
      approval_status: 'approved', // Auto-approve when created by architect
      timeline: [{
        date: new Date().toISOString(),
        type: 'lead',
        title: 'לקוח חדש נוצר',
        description: 'כרטיס לקוח נפתח במערכת',
      }],
    });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Helper functions for personal preferences
  const updateLifestyle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      personal_preferences: {
        ...prev.personal_preferences,
        lifestyle: {
          ...prev.personal_preferences.lifestyle,
          [field]: value
        }
      }
    }));
  };

  const updateAdditional = (field, value) => {
    setFormData(prev => ({
      ...prev,
      personal_preferences: {
        ...prev.personal_preferences,
        additional: {
          ...prev.personal_preferences.additional,
          [field]: value
        }
      }
    }));
  };

  const addHouseholdMember = () => {
    if (!newMemberName.trim()) return;
    const newMember = {
      id: Date.now(),
      name: newMemberName,
      height_cm: newMemberHeight ? parseInt(newMemberHeight) : null,
      notes: newMemberNotes
    };
    setFormData(prev => ({
      ...prev,
      personal_preferences: {
        ...prev.personal_preferences,
        household_members: [...prev.personal_preferences.household_members, newMember]
      }
    }));
    setNewMemberName('');
    setNewMemberHeight('');
    setNewMemberNotes('');
  };

  const removeHouseholdMember = (id) => {
    setFormData(prev => ({
      ...prev,
      personal_preferences: {
        ...prev.personal_preferences,
        household_members: prev.personal_preferences.household_members.filter(m => m.id !== id)
      }
    }));
  };

  const addPet = () => {
    if (!newPetType.trim()) return;
    setFormData(prev => ({
      ...prev,
      personal_preferences: {
        ...prev.personal_preferences,
        additional: {
          ...prev.personal_preferences.additional,
          pets: [...prev.personal_preferences.additional.pets, newPetType]
        }
      }
    }));
    setNewPetType('');
  };

  const removePet = (index) => {
    setFormData(prev => ({
      ...prev,
      personal_preferences: {
        ...prev.personal_preferences,
        additional: {
          ...prev.personal_preferences.additional,
          pets: prev.personal_preferences.additional.pets.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const addHobby = () => {
    if (!newHobby.trim()) return;
    setFormData(prev => ({
      ...prev,
      personal_preferences: {
        ...prev.personal_preferences,
        additional: {
          ...prev.personal_preferences.additional,
          hobbies: [...prev.personal_preferences.additional.hobbies, newHobby]
        }
      }
    }));
    setNewHobby('');
  };

  const removeHobby = (index) => {
    setFormData(prev => ({
      ...prev,
      personal_preferences: {
        ...prev.personal_preferences,
        additional: {
          ...prev.personal_preferences.additional,
          hobbies: prev.personal_preferences.additional.hobbies.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const toggleAccessibilityNeed = (need) => {
    const current = formData.personal_preferences.additional.accessibility_needs;
    const updated = current.includes(need)
      ? current.filter(n => n !== need)
      : [...current, need];
    updateAdditional('accessibility_needs', updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            לקוח חדש
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic" className="gap-2">
              <User className="w-4 h-4" />
              פרטים בסיסיים
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Heart className="w-4 h-4" />
              התאמות אישיות
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div>
              <Label>שם מלא *</Label>
              <div className="relative mt-1">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={formData.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  className="pr-10"
                  placeholder="שם הלקוח"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>טלפון *</Label>
                <div className="relative mt-1">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    onBlur={() => handleFieldBlur('phone')}
                    className={`pr-10 ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    placeholder="050-0000000"
                    dir="ltr"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <Label>אימייל</Label>
                <div className="relative mt-1">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    onBlur={() => handleFieldBlur('email')}
                    className={`pr-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    placeholder="email@example.com"
                    dir="ltr"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <Label>כתובת</Label>
              <div className="relative mt-1">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="pr-10"
                  placeholder="רחוב, עיר"
                />
              </div>
            </div>

            <div>
              <Label>מקור הפניה</Label>
              <Select value={formData.source} onValueChange={(value) => updateField('source', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="referral">המלצה</SelectItem>
                  <SelectItem value="website">אתר</SelectItem>
                  <SelectItem value="social_media">רשתות חברתיות</SelectItem>
                  <SelectItem value="advertisement">פרסום</SelectItem>
                  <SelectItem value="returning">לקוח חוזר</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>הערות</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="mt-1"
                placeholder="הערות נוספות..."
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Personal Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6 mt-4">
            {/* Household Members */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-900">בני הבית</h3>
                <span className="text-xs text-slate-500">(לצורך התאמה ארגונומית)</span>
              </div>

              {/* List of members */}
              {formData.personal_preferences.household_members.length > 0 && (
                <div className="space-y-2 mb-3">
                  {formData.personal_preferences.household_members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{member.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {member.height_cm && (
                              <span className="flex items-center gap-1">
                                <Ruler className="w-3 h-3" />
                                {member.height_cm} ס"מ
                              </span>
                            )}
                            {member.notes && <span>• {member.notes}</span>}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHouseholdMember(member.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add member form */}
              <div className="grid grid-cols-4 gap-2">
                <Input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="שם"
                  className="col-span-1"
                />
                <Input
                  type="number"
                  value={newMemberHeight}
                  onChange={(e) => setNewMemberHeight(e.target.value)}
                  placeholder="גובה (ס״מ)"
                  className="col-span-1"
                />
                <Input
                  value={newMemberNotes}
                  onChange={(e) => setNewMemberNotes(e.target.value)}
                  placeholder="הערה (גיל, תפקיד)"
                  className="col-span-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addHouseholdMember}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  הוסף
                </Button>
              </div>
            </div>

            {/* Lifestyle */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Home className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-900">אורח חיים</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">רמת דתיות</Label>
                  <Select
                    value={formData.personal_preferences.lifestyle.religious_level}
                    onValueChange={(value) => updateLifestyle('religious_level', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="בחר..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="secular">חילוני</SelectItem>
                      <SelectItem value="traditional">מסורתי</SelectItem>
                      <SelectItem value="religious">דתי</SelectItem>
                      <SelectItem value="ultra_orthodox">חרדי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">התאמות נוספות</Label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.personal_preferences.lifestyle.kosher_kitchen}
                        onChange={(e) => updateLifestyle('kosher_kitchen', e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      מטבח כשר (הפרדה)
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.personal_preferences.lifestyle.shabbat_considerations}
                        onChange={(e) => updateLifestyle('shabbat_considerations', e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      התאמות לשבת (תאורה, מעלית שבת)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Preferences */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-pink-600" />
                <h3 className="font-semibold text-slate-900">העדפות נוספות</h3>
              </div>

              <div className="space-y-4">
                {/* Work from home */}
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.personal_preferences.additional.work_from_home}
                    onChange={(e) => updateAdditional('work_from_home', e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  עבודה מהבית (צורך בחלל עבודה)
                </label>

                {/* Entertaining */}
                <div>
                  <Label className="text-sm">תדירות אירוח</Label>
                  <Select
                    value={formData.personal_preferences.additional.entertaining_frequency}
                    onValueChange={(value) => updateAdditional('entertaining_frequency', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="בחר..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rarely">לעיתים נדירות</SelectItem>
                      <SelectItem value="occasionally">מדי פעם</SelectItem>
                      <SelectItem value="frequently">לעיתים קרובות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Storage needs */}
                <div>
                  <Label className="text-sm">צרכי אחסון</Label>
                  <Select
                    value={formData.personal_preferences.additional.storage_needs}
                    onValueChange={(value) => updateAdditional('storage_needs', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="בחר..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">מינימלי</SelectItem>
                      <SelectItem value="average">ממוצע</SelectItem>
                      <SelectItem value="extensive">נרחב</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pets */}
                <div>
                  <Label className="text-sm mb-2 block">חיות מחמד</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.personal_preferences.additional.pets.map((pet, idx) => (
                      <Badge key={idx} variant="outline" className="gap-1 bg-white">
                        {pet}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-500"
                          onClick={() => removePet(idx)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newPetType}
                      onChange={(e) => setNewPetType(e.target.value)}
                      placeholder="סוג חיה (כלב, חתול...)"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={addPet} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Hobbies */}
                <div>
                  <Label className="text-sm mb-2 block">תחביבים מיוחדים (משפיעים על התכנון)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.personal_preferences.additional.hobbies.map((hobby, idx) => (
                      <Badge key={idx} variant="outline" className="gap-1 bg-white">
                        {hobby}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-500"
                          onClick={() => removeHobby(idx)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newHobby}
                      onChange={(e) => setNewHobby(e.target.value)}
                      placeholder="פסנתר, כושר, בישול..."
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={addHobby} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Accessibility */}
                <div>
                  <Label className="text-sm mb-2 flex items-center gap-2">
                    <Accessibility className="w-4 h-4" />
                    צרכי נגישות
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {['כיסא גלגלים', 'לקות ראייה', 'לקות שמיעה', 'קושי בניידות', 'מעלון/מעלית'].map((need) => (
                      <Badge
                        key={need}
                        variant={formData.personal_preferences.additional.accessibility_needs.includes(need) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleAccessibilityNeed(need)}
                      >
                        {need}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createClientMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {createClientMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : null}
            צור לקוח
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}