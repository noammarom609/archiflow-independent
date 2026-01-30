import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users,
  Lightbulb,
  Palette,
  CheckCircle2,
  Plus,
  Trash2,
  Layout,
  Maximize2,
  Check,
  Sparkles,
  Home,
  Bed,
  Bath,
  UtensilsCrossed,
  Sofa,
  Briefcase,
  Baby,
  Dog,
  Search,
  Filter,
  X,
  Heart
} from 'lucide-react';
import { showSuccess } from '@/components/utils/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import MoodboardPreview from '@/components/library/moodboard/MoodboardPreview';

// Predefined room suggestions
const roomSuggestions = [
  { name: 'חדר שינה הורים', icon: Bed, category: 'bedroom' },
  { name: 'חדר ילדים', icon: Baby, category: 'bedroom' },
  { name: 'חדר רחצה', icon: Bath, category: 'bathroom' },
  { name: 'מטבח', icon: UtensilsCrossed, category: 'kitchen' },
  { name: 'סלון', icon: Sofa, category: 'living' },
  { name: 'חדר עבודה', icon: Briefcase, category: 'office' },
  { name: 'מרפסת', icon: Home, category: 'outdoor' },
  { name: 'מזווה', icon: UtensilsCrossed, category: 'storage' },
  { name: 'חדר כביסה', icon: Home, category: 'utility' },
  { name: 'ממ״ד', icon: Home, category: 'safety' },
];

export default function ConceptStage({ project, onUpdate }) {
  const [programData, setProgramData] = useState(project.program_data || {
      adults: 2,
      children: 0,
      pets: '',
      rooms_required: [],
      style_notes: '',
      special_requests: ''
  });

  const [newRoom, setNewRoom] = useState('');
  const [showRoomSuggestions, setShowRoomSuggestions] = useState(false);
  const [moodboardSearch, setMoodboardSearch] = useState('');
  const [moodboardFilter, setMoodboardFilter] = useState('all'); // all, modern, classic, minimalist, etc.

  const handleUpdate = (field, value) => {
      const updated = { ...programData, [field]: value };
      setProgramData(updated);
  };

  const handleSave = () => {
      onUpdate({ program_data: programData });
      showSuccess('פרוגרמה נשמרה בהצלחה');
  };

  const addRoom = () => {
      if (!newRoom) return;
      handleUpdate('rooms_required', [...(programData.rooms_required || []), newRoom]);
      setNewRoom('');
      setShowRoomSuggestions(false);
  };

  const addRoomFromSuggestion = (roomName) => {
      if (programData.rooms_required?.includes(roomName)) return;
      handleUpdate('rooms_required', [...(programData.rooms_required || []), roomName]);
  };

  const removeRoom = (idx) => {
      const updated = [...(programData.rooms_required || [])];
      updated.splice(idx, 1);
      handleUpdate('rooms_required', updated);
  };

  // Filter room suggestions - exclude already added
  const availableRoomSuggestions = roomSuggestions.filter(
    room => !programData.rooms_required?.includes(room.name)
  );

  // Calculate program completion
  const programCompletion = useMemo(() => {
    let score = 0;
    if (programData.adults > 0) score += 20;
    if (programData.rooms_required?.length > 0) score += 30;
    if (programData.style_notes?.length > 10) score += 25;
    if (programData.special_requests?.length > 0) score += 15;
    if (programData.approved_moodboard_id) score += 10;
    return Math.min(score, 100);
  }, [programData]);

  // Moodboards Logic
  const [previewMoodboard, setPreviewMoodboard] = useState(null);
  const queryClient = useQueryClient();

  const { data: moodboards = [] } = useQuery({
      queryKey: ['moodboards'],
      queryFn: () => base44.entities.Moodboard.list('-created_date', 50),
      staleTime: 5 * 60 * 1000, // 5 minutes - prevent excessive refetching
      refetchOnWindowFocus: false,
  });

  const handleApproveMoodboard = async (moodboard) => {
      // 1. Update Project with approved moodboard ID
      const updatedProgramData = { 
          ...programData, 
          approved_moodboard_id: moodboard.id 
      };
      
      // Update local state
      setProgramData(updatedProgramData);
      
      // Update Project
      onUpdate({ program_data: updatedProgramData });

      // 2. Link Moodboard to Project if not already linked
      if (moodboard.project_id !== project.id) {
          try {
              await base44.entities.Moodboard.update(moodboard.id, { 
                  project_id: project.id,
                  project_name: project.name
              });
              queryClient.invalidateQueries(['moodboards']);
              showSuccess('לוח ההשראה אושר ושויך לפרויקט');
          } catch (error) {
              console.error(error);
          }
      } else {
          showSuccess('לוח ההשראה אושר לפרויקט');
      }

      setPreviewMoodboard(null);
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="border-slate-200 bg-gradient-to-r from-pink-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-pink-600" />
              <span className="font-medium text-slate-900">התקדמות הפרוגרמה</span>
            </div>
            <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0">
              {programCompletion}%
            </Badge>
          </div>
          <Progress value={programCompletion} className="h-2" />
          <p className="text-xs text-slate-500 mt-2">
            {programCompletion < 50 && 'מלא את פרטי המשפחה והחדרים הנדרשים'}
            {programCompletion >= 50 && programCompletion < 80 && 'הוסף העדפות סגנון ובחר לוח השראה'}
            {programCompletion >= 80 && 'הפרוגרמה כמעט מושלמת!'}
          </p>
        </CardContent>
      </Card>
      
      {/* Family Composition */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            הרכב משפחתי וצרכים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Family Members - Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <Label className="font-medium text-blue-900">מבוגרים</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleUpdate('adults', Math.max(1, programData.adults - 1))}
                      >-</Button>
                      <span className="text-2xl font-bold text-blue-700 w-8 text-center">{programData.adults}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleUpdate('adults', programData.adults + 1)}
                      >+</Button>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Baby className="w-5 h-5 text-pink-600" />
                      </div>
                      <Label className="font-medium text-pink-900">ילדים</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleUpdate('children', Math.max(0, programData.children - 1))}
                      >-</Button>
                      <span className="text-2xl font-bold text-pink-700 w-8 text-center">{programData.children}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleUpdate('children', programData.children + 1)}
                      >+</Button>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Dog className="w-5 h-5 text-amber-600" />
                      </div>
                      <Label className="font-medium text-amber-900">חיות מחמד</Label>
                    </div>
                    <Input 
                        placeholder="כלב, חתול..."
                        value={programData.pets} 
                        onChange={(e) => handleUpdate('pets', e.target.value)}
                        className="bg-white/70"
                    />
                </div>
            </div>

            {/* Rooms Section - Enhanced */}
            <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Home className="w-4 h-4 text-indigo-600" />
                    רשימת חדרים נדרשת
                  </Label>
                  <Badge variant="outline">{programData.rooms_required?.length || 0} חדרים</Badge>
                </div>
                
                {/* Add Room Input */}
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Input 
                          placeholder="הוסף חדר (לדוגמה: חדר עבודה, מזווה)" 
                          value={newRoom}
                          onChange={(e) => {
                            setNewRoom(e.target.value);
                            setShowRoomSuggestions(true);
                          }}
                          onFocus={() => setShowRoomSuggestions(true)}
                          onKeyDown={(e) => e.key === 'Enter' && addRoom()}
                      />
                      
                      {/* Room Suggestions Dropdown */}
                      <AnimatePresence>
                        {showRoomSuggestions && availableRoomSuggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto"
                          >
                            <div className="p-2">
                              <p className="text-xs text-slate-500 px-2 py-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                הצעות חדרים
                              </p>
                              {availableRoomSuggestions.map((room, idx) => {
                                const RoomIcon = room.icon;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => addRoomFromSuggestion(room.name)}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors text-right"
                                  >
                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                      <RoomIcon className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <span className="text-sm text-slate-700">{room.name}</span>
                                    <Plus className="w-4 h-4 text-indigo-400 mr-auto" />
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <Button onClick={addRoom} className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                </div>
                
                {/* Selected Rooms */}
                <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {programData.rooms_required?.map((room, idx) => {
                          const roomSuggestion = roomSuggestions.find(r => r.name === room);
                          const RoomIcon = roomSuggestion?.icon || Home;
                          return (
                            <motion.div 
                              key={room}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 px-3 py-2 rounded-xl flex items-center gap-2 text-sm border border-indigo-200"
                            >
                                <RoomIcon className="w-4 h-4 text-indigo-600" />
                                {room}
                                <button 
                                  onClick={() => removeRoom(idx)} 
                                  className="hover:text-red-500 transition-colors p-0.5 hover:bg-red-100 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                          );
                      })}
                    </AnimatePresence>
                    {(!programData.rooms_required || programData.rooms_required.length === 0) && (
                        <div className="w-full py-6 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                          <Home className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-400">לא הוגדרו חדרים עדיין</p>
                          <p className="text-xs text-slate-400">לחץ על הצעות או הוסף ידנית</p>
                        </div>
                    )}
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Style & Concept */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            סגנון וקונספט עיצובי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Label>הערות סגנון מועדף</Label>
                <Textarea 
                    placeholder="מודרני, כפרי, נורדי, צבעים מועדפים..."
                    value={programData.style_notes}
                    onChange={(e) => handleUpdate('style_notes', e.target.value)}
                    className="mt-2 min-h-[100px]"
                />
            </div>
            <div>
                <Label>בקשות מיוחדות</Label>
                <Textarea 
                    placeholder="נגישות, חשמל חכם, אודיו/וידאו..."
                    value={programData.special_requests}
                    onChange={(e) => handleUpdate('special_requests', e.target.value)}
                    className="mt-2"
                />
            </div>
        </CardContent>
      </Card>

      {/* Inspiration Moodboards */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-indigo-600" />
              לוחות השראה (Moodboards)
            </CardTitle>
            <Badge variant="outline">{moodboards.length} לוחות</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="חפש לוח השראה..."
                  value={moodboardSearch}
                  onChange={(e) => setMoodboardSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'modern', 'minimalist', 'classic', 'industrial'].map(filter => (
                  <Button
                    key={filter}
                    variant={moodboardFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMoodboardFilter(filter)}
                    className={moodboardFilter === filter ? 'bg-indigo-600' : ''}
                  >
                    {filter === 'all' && 'הכל'}
                    {filter === 'modern' && 'מודרני'}
                    {filter === 'minimalist' && 'מינימליסטי'}
                    {filter === 'classic' && 'קלאסי'}
                    {filter === 'industrial' && 'תעשייתי'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Selected Moodboard Banner */}
            {programData.approved_moodboard_id && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-800">לוח השראה נבחר!</p>
                  <p className="text-sm text-green-600">
                    {moodboards.find(m => m.id === programData.approved_moodboard_id)?.name || 'לוח השראה'}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    handleUpdate('approved_moodboard_id', null);
                    showSuccess('בחירת לוח ההשראה בוטלה');
                  }}
                  className="text-green-600 hover:text-green-700 hover:bg-green-100"
                >
                  שנה בחירה
                </Button>
              </motion.div>
            )}

            {/* Moodboards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {moodboards
                    .filter(mb => {
                      // Search filter
                      if (moodboardSearch && !mb.name?.toLowerCase().includes(moodboardSearch.toLowerCase())) {
                        return false;
                      }
                      // Style filter (if moodboard has style tag)
                      if (moodboardFilter !== 'all' && mb.style && mb.style !== moodboardFilter) {
                        return false;
                      }
                      return true;
                    })
                    .map((mb, idx) => (
                    <motion.div 
                        key={mb.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`
                            group relative aspect-square rounded-xl border-2 overflow-hidden cursor-pointer transition-all
                            ${programData.approved_moodboard_id === mb.id 
                              ? 'border-green-500 ring-2 ring-green-100 scale-[1.02]' 
                              : 'border-slate-100 hover:border-indigo-300 hover:shadow-lg'}
                        `}
                        onClick={() => setPreviewMoodboard(mb)}
                    >
                        {mb.thumbnail_url ? (
                            <img src={mb.thumbnail_url} alt={mb.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-300">
                                <Layout className="w-12 h-12" />
                            </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-12">
                            <p className="text-white font-medium text-sm truncate">{mb.name}</p>
                            {mb.style && (
                              <Badge variant="secondary" className="mt-1 text-[10px] bg-white/20 text-white border-0">
                                {mb.style}
                              </Badge>
                            )}
                        </div>

                        {/* Selected Badge */}
                        {programData.approved_moodboard_id === mb.id && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium shadow-lg">
                                <Check className="w-3 h-3" />
                                נבחר
                            </div>
                        )}

                        {/* Hover Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg bg-white/90 hover:bg-white">
                                <Maximize2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Create New Moodboard Card */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-slate-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center mb-3 transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">צור לוח חדש</span>
                </motion.div>
            </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewMoodboard} onOpenChange={(open) => !open && setPreviewMoodboard(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{previewMoodboard?.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
                <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    <MoodboardPreview moodboard={previewMoodboard} />
                </div>
                
                {previewMoodboard?.description && (
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-slate-700 mb-2">תיאור</h4>
                        <p className="text-slate-600">{previewMoodboard.description}</p>
                    </div>
                )}
            </div>

            <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setPreviewMoodboard(null)}>
                    סגור
                </Button>
                <Button 
                    onClick={() => handleApproveMoodboard(previewMoodboard)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={programData.approved_moodboard_id === previewMoodboard?.id}
                >
                    {programData.approved_moodboard_id === previewMoodboard?.id ? (
                        <>
                            <Check className="w-4 h-4 ml-2" />
                            מאושר לפרויקט
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            אשר לוח זה לפרויקט
                        </>
                    )}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between">
          <Button onClick={handleSave} variant="outline">
              שמור שינויים
          </Button>
          <Button onClick={() => { handleSave(); onUpdate({ status: 'sketches' }); }} className="bg-indigo-600 hover:bg-indigo-700">
              <CheckCircle2 className="w-4 h-4 ml-2" />
              סיום פרוגרמה ומעבר לסקיצות
          </Button>
      </div>
    </div>
  );
}