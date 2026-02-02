import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { showSuccess, showError } from '@/components/utils/notifications';
import UserAccessStatus from '@/components/users/UserAccessStatus';
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  Edit,
  Trash2,
  Save,
  X,
  Briefcase,
  FolderKanban,
  Calendar,
  Award,
  Users,
  Zap,
  Droplets,
  Lightbulb,
  Shield,
  Wind,
  Volume2,
  Ruler,
  HardHat,
  FileText,
  Clock,
  CheckCircle2
} from 'lucide-react';

// Entity type configurations
const ENTITY_CONFIG = {
  client: {
    title: 'לקוח',
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    entityName: 'Client',
    fields: ['full_name', 'email', 'phone', 'address', 'company', 'notes'],
  },
  contractor: {
    title: 'קבלן',
    icon: Briefcase,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    entityName: 'Contractor',
    fields: ['name', 'email', 'phone', 'company', 'specialty', 'type', 'status', 'hourly_rate', 'notes'],
    types: [
      { value: 'contractor', label: 'קבלן' },
      { value: 'partner', label: 'שותף' },
    ],
    specialties: [
      { value: 'general_contractor', label: 'קבלן ראשי' },
      { value: 'electrical', label: 'חשמל' },
      { value: 'plumbing', label: 'אינסטלציה' },
      { value: 'drywall', label: 'גבס' },
      { value: 'flooring', label: 'ריצוף' },
      { value: 'carpentry', label: 'נגרות' },
      { value: 'painting', label: 'צביעה' },
      { value: 'hvac', label: 'מיזוג אוויר' },
      { value: 'other', label: 'אחר' },
    ],
  },
  supplier: {
    title: 'ספק',
    icon: Building2,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    entityName: 'Supplier',
    fields: ['name', 'email', 'phone', 'company', 'address', 'category', 'website', 'payment_terms', 'delivery_time', 'notes'],
    categories: [
      { value: 'furniture', label: 'ריהוט' },
      { value: 'lighting', label: 'תאורה' },
      { value: 'flooring', label: 'ריצוף' },
      { value: 'tiles', label: 'אריחים' },
      { value: 'sanitary', label: 'סניטריה' },
      { value: 'kitchen', label: 'מטבחים' },
      { value: 'doors_windows', label: 'דלתות וחלונות' },
      { value: 'paint', label: 'צבעים' },
      { value: 'fabrics', label: 'טקסטיל' },
      { value: 'accessories', label: 'אביזרים' },
      { value: 'outdoor', label: 'חוץ' },
      { value: 'electronics', label: 'אלקטרוניקה' },
      { value: 'other', label: 'אחר' },
    ],
  },
  consultant: {
    title: 'יועץ',
    icon: HardHat,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    entityName: 'Consultant',
    fields: ['name', 'email', 'phone', 'company', 'address', 'consultant_type', 'license_number', 'rating', 'notes'],
    consultantTypes: [
      { value: 'structural', label: 'קונסטרוקטור', icon: Building2 },
      { value: 'electrical', label: 'יועץ חשמל', icon: Zap },
      { value: 'plumbing', label: 'יועץ אינסטלציה', icon: Droplets },
      { value: 'hvac', label: 'יועץ מיזוג ואוורור', icon: Wind },
      { value: 'lighting', label: 'יועץ תאורה', icon: Lightbulb },
      { value: 'civil_defense', label: 'יועץ הג"א', icon: Shield },
      { value: 'acoustics', label: 'יועץ אקוסטיקה', icon: Volume2 },
      { value: 'hydrology', label: 'הידרולוג', icon: Droplets },
      { value: 'surveyor', label: 'מודד', icon: Ruler },
      { value: 'fire_safety', label: 'יועץ בטיחות אש', icon: Shield },
      { value: 'accessibility', label: 'יועץ נגישות', icon: Users },
      { value: 'other', label: 'אחר', icon: HardHat },
    ],
  },
  team_member: {
    title: 'איש צוות',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    entityName: 'TeamMember',
    fields: ['full_name', 'email', 'phone', 'role', 'department', 'notes'],
    roles: [
      { value: 'architect', label: 'אדריכל' },
      { value: 'designer', label: 'מעצב' },
      { value: 'project_manager', label: 'מנהל פרויקט' },
      { value: 'assistant', label: 'עוזר' },
      { value: 'admin', label: 'מנהל' },
      { value: 'other', label: 'אחר' },
    ],
  },
};

export default function EntityDetailModal({ isOpen, onClose, entity, entityType, onUpdate, onDelete, onViewFullProfile }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(entity || {});
  const [activeTab, setActiveTab] = useState('info');

  // Reset editing state when entity changes or modal closes
  useEffect(() => {
    setIsEditing(false);
    setFormData(entity || {});
    setActiveTab('info');
  }, [entity?.id, isOpen]);

  const config = ENTITY_CONFIG[entityType];

  // Fetch related projects for consultants
  const { data: projectConsultants = [] } = useQuery({
    queryKey: ['projectConsultants', entity?.id],
    queryFn: () => entityType === 'consultant' && entity?.id
      ? archiflow.entities.ProjectConsultant.filter({ consultant_id: entity.id })
      : Promise.resolve([]),
    enabled: !!entity?.id && entityType === 'consultant' && !!config,
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => archiflow.entities.Project.list(),
    enabled: (entityType === 'consultant' || entityType === 'client') && !!config,
  });

  // Fetch tasks for contractors
  const { data: tasks = [] } = useQuery({
    queryKey: ['contractorTasks', entity?.id],
    queryFn: () => entityType === 'contractor' && entity?.id
      ? archiflow.entities.Task.filter({ contractor_id: entity.id })
      : Promise.resolve([]),
    enabled: !!entity?.id && entityType === 'contractor' && !!config,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (!config) return;
      return archiflow.entities[config.entityName].update(entity.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityType + 's'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['consultants'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      showSuccess('עודכן בהצלחה');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    },
    onError: () => showError('שגיאה בעדכון'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!config) return;
      return archiflow.entities[config.entityName].delete(entity.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityType + 's'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['consultants'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      showSuccess('נמחק בהצלחה');
      onClose();
      if (onDelete) onDelete();
    },
    onError: () => showError('שגיאה במחיקה'),
  });

  // Early return AFTER all hooks
  if (!config) return null;

  const Icon = config.icon;

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את ${config.title}?`)) {
      deleteMutation.mutate();
    }
  };

  const getDisplayName = () => {
    return entity?.full_name || entity?.name || 'לא ידוע';
  };

  const getTypeLabel = () => {
    if (entityType === 'consultant' && entity?.consultant_type) {
      const type = config.consultantTypes?.find(t => t.value === entity.consultant_type);
      return type?.label || entity.consultant_type;
    }
    if (entityType === 'contractor' && entity?.type) {
      const type = config.types?.find(t => t.value === entity.type);
      return type?.label || entity.type;
    }
    if (entityType === 'supplier' && entity?.category) {
      const category = config.categories?.find(c => c.value === entity.category);
      return category?.label || entity.category;
    }
    if (entityType === 'team_member' && entity?.role) {
      const role = config.roles?.find(r => r.value === entity.role);
      return role?.label || entity.role;
    }
    return config.title;
  };

  const getClientProjects = () => {
    if (entityType !== 'client') return [];
    return projects.filter(p => p.client_id === entity?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 ${config.bgColor} rounded-2xl flex items-center justify-center`}>
                <Icon className={`w-7 h-7 ${config.color}`} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {getDisplayName()}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="border-border">
                    {getTypeLabel()}
                  </Badge>
                  {entity?.status && (
                    <Badge className={entity.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {entity.status === 'active' ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  )}
                  {entity?.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{entity.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  {onViewFullProfile && entityType === 'client' && (
                    <Button variant="outline" size="sm" onClick={() => onViewFullProfile(entity?.id)}>
                      <FolderKanban className="w-4 h-4 ml-1" />
                      לכרטיס מלא
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 ml-1" />
                    עריכה
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 ml-1" />
                    מחיקה
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 ml-1" />
                    ביטול
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                    <Save className="w-4 h-4 ml-1" />
                    שמור
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="info">
              <User className="w-4 h-4 ml-2" />
              פרטים
            </TabsTrigger>
            <TabsTrigger value="activity">
              <FolderKanban className="w-4 h-4 ml-2" />
              פעילות
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="mt-4 space-y-4">
            {/* Contact Info */}
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground mb-4">פרטי קשר</h3>
                
                {/* Email */}
                {(entity?.email || isEditing) && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">אימייל</p>
                      {isEditing ? (
                        <Input
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          dir="ltr"
                        />
                      ) : (
                        <>
                          <p className="font-medium text-foreground">{entity?.email}</p>
                          <UserAccessStatus
                            email={entity?.email}
                            name={getDisplayName()}
                            type={entityType}
                            entityId={entity?.id}
                            userStatus={entity?.user_status}
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Phone */}
                {(entity?.phone || isEditing) && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">טלפון</p>
                      {isEditing ? (
                        <Input
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          dir="ltr"
                        />
                      ) : (
                        <p className="font-medium text-foreground" dir="ltr">{entity?.phone}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Company */}
                {(entity?.company || isEditing) && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">חברה</p>
                      {isEditing ? (
                        <Input
                          value={formData.company || ''}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        />
                      ) : (
                        <p className="font-medium text-foreground">{entity?.company}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Address */}
                {(entity?.address || isEditing) && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">כתובת</p>
                      {isEditing ? (
                        <Input
                          value={formData.address || ''}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      ) : (
                        <p className="font-medium text-foreground">{entity?.address}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Info based on type */}
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground mb-4">מידע נוסף</h3>

                {/* Consultant Type */}
                {entityType === 'consultant' && (
                  <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <span className="text-muted-foreground">סוג יועץ</span>
                    {isEditing ? (
                      <Select
                        value={formData.consultant_type || ''}
                        onValueChange={(value) => setFormData({ ...formData, consultant_type: value })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {config.consultantTypes?.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className="bg-accent text-accent-foreground">{getTypeLabel()}</Badge>
                    )}
                  </div>
                )}

                {/* Contractor Type */}
                {entityType === 'contractor' && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                      <span className="text-muted-foreground">סוג</span>
                      {isEditing ? (
                        <Select
                          value={formData.type || ''}
                          onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {config.types?.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className="bg-accent text-accent-foreground">{getTypeLabel()}</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                      <span className="text-muted-foreground">התמחות</span>
                      {isEditing ? (
                        <Select
                          value={formData.specialty || ''}
                          onValueChange={(value) => setFormData({ ...formData, specialty: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {config.specialties?.map(s => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="font-medium">{config.specialties?.find(s => s.value === entity?.specialty)?.label || entity?.specialty}</span>
                      )}
                    </div>
                    {(entity?.hourly_rate || isEditing) && (
                      <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                        <span className="text-muted-foreground">תעריף שעתי</span>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={formData.hourly_rate || ''}
                            onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
                            className="w-32"
                            dir="ltr"
                          />
                        ) : (
                          <span className="font-medium">₪{entity?.hourly_rate}</span>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Supplier Category */}
                {entityType === 'supplier' && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                      <span className="text-muted-foreground">קטגוריה</span>
                      {isEditing ? (
                        <Select
                          value={formData.category || ''}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {config.categories?.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className="bg-accent text-accent-foreground">{getTypeLabel()}</Badge>
                      )}
                    </div>
                    {(entity?.website || isEditing) && (
                      <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                        <span className="text-muted-foreground">אתר אינטרנט</span>
                        {isEditing ? (
                          <Input
                            value={formData.website || ''}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="w-48"
                            dir="ltr"
                          />
                        ) : (
                          <a href={entity?.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{entity?.website}</a>
                        )}
                      </div>
                    )}
                    {(entity?.payment_terms || isEditing) && (
                      <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                        <span className="text-muted-foreground">תנאי תשלום</span>
                        {isEditing ? (
                          <Input
                            value={formData.payment_terms || ''}
                            onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                            className="w-48"
                          />
                        ) : (
                          <span className="font-medium">{entity?.payment_terms}</span>
                        )}
                      </div>
                    )}
                    {(entity?.delivery_time || isEditing) && (
                      <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                        <span className="text-muted-foreground">זמן אספקה</span>
                        {isEditing ? (
                          <Input
                            value={formData.delivery_time || ''}
                            onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                            className="w-48"
                          />
                        ) : (
                          <span className="font-medium">{entity?.delivery_time}</span>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Team Member Role */}
                {entityType === 'team_member' && (
                  <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <span className="text-muted-foreground">תפקיד</span>
                    {isEditing ? (
                      <Select
                        value={formData.role || ''}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {config.roles?.map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className="bg-accent text-accent-foreground">{getTypeLabel()}</Badge>
                    )}
                  </div>
                )}

                {/* License Number for Consultant */}
                {entityType === 'consultant' && (entity?.license_number || isEditing) && (
                  <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <span className="text-muted-foreground">מספר רישיון</span>
                    {isEditing ? (
                      <Input
                        value={formData.license_number || ''}
                        onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                        className="w-48"
                        dir="ltr"
                      />
                    ) : (
                      <span className="font-medium">{entity?.license_number}</span>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label className="text-muted-foreground">הערות</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-2"
                      rows={3}
                    />
                  ) : entity?.notes ? (
                    <p className="mt-2 text-foreground whitespace-pre-wrap">{entity?.notes}</p>
                  ) : (
                    <p className="mt-2 text-muted-foreground italic">אין הערות</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-4">
            <Card className="border-border">
              <CardContent className="p-6">
                {/* Consultant Projects */}
                {entityType === 'consultant' && (
                  <>
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <FolderKanban className="w-5 h-5" />
                      פרויקטים ({projectConsultants.length})
                    </h3>
                    {projectConsultants.length > 0 ? (
                      <div className="space-y-3">
                        {projectConsultants.map((pc, index) => {
                          const project = projects.find(p => p.id === pc.project_id);
                          return (
                            <motion.div
                              key={pc.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="p-4 bg-accent/50 rounded-lg"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-foreground">{project?.name || 'פרויקט'}</p>
                                  <p className="text-sm text-muted-foreground">{pc.scope || 'תחום לא הוגדר'}</p>
                                </div>
                                <Badge className={pc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {pc.status === 'active' ? 'פעיל' : pc.status === 'completed' ? 'הושלם' : 'ממתין'}
                                </Badge>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FolderKanban className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-muted-foreground">אין פרויקטים משויכים</p>
                      </div>
                    )}
                  </>
                )}

                {/* Client Projects */}
                {entityType === 'client' && (
                  <>
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <FolderKanban className="w-5 h-5" />
                      פרויקטים ({getClientProjects().length})
                    </h3>
                    {getClientProjects().length > 0 ? (
                      <div className="space-y-3">
                        {getClientProjects().map((project, index) => (
                          <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 bg-accent/50 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-foreground">{project.name}</p>
                                <p className="text-sm text-muted-foreground">{project.address}</p>
                              </div>
                              <Badge className={project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {project.status === 'active' ? 'פעיל' : project.status === 'completed' ? 'הושלם' : 'ממתין'}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FolderKanban className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-muted-foreground">אין פרויקטים</p>
                      </div>
                    )}
                  </>
                )}

                {/* Contractor Tasks */}
                {entityType === 'contractor' && (
                  <>
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      משימות ({tasks.length})
                    </h3>
                    {tasks.length > 0 ? (
                      <div className="space-y-3">
                        {tasks.map((task, index) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 bg-accent/50 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-foreground">{task.title}</p>
                                <p className="text-sm text-muted-foreground">{task.project_name}</p>
                              </div>
                              <Badge className={
                                task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }>
                                {task.status === 'completed' ? 'הושלם' : task.status === 'in_progress' ? 'בביצוע' : 'ממתין'}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-muted-foreground">אין משימות</p>
                      </div>
                    )}
                  </>
                )}

                {/* Team Member - no specific activity */}
                {entityType === 'team_member' && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground">אין פעילות להצגה</p>
                  </div>
                )}

                {/* Supplier - no specific activity yet */}
                {entityType === 'supplier' && (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground">אין הזמנות להצגה</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}