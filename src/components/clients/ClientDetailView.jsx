import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building2,
  ChevronLeft,
  Calendar,
  FileText,
  Mic,
  DollarSign,
  Sparkles,
  FolderKanban,
  Clock,
  TrendingUp,
  Heart,
  Plus,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ListTodo,
  Edit2,
  Save,
  X,
  Users,
  Ruler,
  Home,
  Accessibility,
  Dog,
  Gamepad2,
  Briefcase
} from 'lucide-react';
import { createPageUrl } from '../../utils';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import ClientTimeline from './ClientTimeline';
import { showSuccess, showError } from '../utils/notifications';

const statusLabels = {
  lead: { label: 'ליד', color: 'bg-blue-100 text-blue-800' },
  active: { label: 'פעיל', color: 'bg-green-100 text-green-800' },
  completed: { label: 'הושלם', color: 'bg-slate-100 text-slate-800' },
  inactive: { label: 'לא פעיל', color: 'bg-red-100 text-red-800' },
};

export default function ClientDetailView({ client, onBack }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState(client);

  // Fetch projects for this client
  const { data: projects = [] } = useQuery({
    queryKey: ['clientProjects', client?.id],
    queryFn: () => archiflow.entities.Project.filter({ client_id: client?.id }),
    enabled: !!client?.id,
  });

  // Fetch recordings for this client
  const { data: recordings = [] } = useQuery({
    queryKey: ['clientRecordings', client?.id],
    queryFn: async () => {
      const projectIds = projects.map(p => p.id);
      if (projectIds.length === 0) return [];
      const allRecordings = await archiflow.entities.Recording.list('-created_date');
      return allRecordings.filter(r => projectIds.includes(r.project_id));
    },
    enabled: projects.length > 0,
  });

  // Fetch proposals
  const { data: proposals = [] } = useQuery({
    queryKey: ['clientProposals', client?.id],
    queryFn: () => archiflow.entities.Proposal.filter({ client_id: client?.id }, '-created_date'),
    enabled: !!client?.id,
  });

  // Fetch tasks for client's projects
  const { data: tasks = [] } = useQuery({
    queryKey: ['clientTasks', client?.id],
    queryFn: async () => {
      if (projects.length === 0) return [];
      const projectIds = projects.map(p => p.id);
      const allTasks = await archiflow.entities.Task.list('-created_date');
      return allTasks.filter(t => projectIds.includes(t.project_id));
    },
    enabled: projects.length > 0,
  });

  const openTasks = tasks.filter(t => t.status !== 'completed');

  if (!client) return null;

  // Quick Actions
  const handleCreateProject = () => {
    navigate(createPageUrl('Projects') + `?newProject=true&clientId=${client.id}`);
  };

  const handleSendEmail = () => {
    if (client.email) {
      window.location.href = `mailto:${client.email}`;
    }
  };

  const handleCallClient = () => {
    if (client.phone) {
      window.location.href = `tel:${client.phone}`;
    }
  };

  const totalRevenue = proposals
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.total_amount || 0), 0);

  // Update client mutation with project sync
  const updateClientMutation = useMutation({
    mutationFn: async (data) => {
      await archiflow.entities.Client.update(client.id, data);
      
      // Sync to all client's projects
      const clientProjects = await archiflow.entities.Project.filter({ client_id: client.id });
      for (const project of clientProjects) {
        await archiflow.entities.Project.update(project.id, {
          client: data.full_name || project.client,
          client_email: data.email || project.client_email,
          client_phone: data.phone || project.client_phone,
          location: data.address || project.location
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['clientProjects'] });
      showSuccess('פרטי הלקוח עודכנו בכל הפרויקטים!');
      setIsEditing(false);
    }
  });

  const handleSaveEdit = () => {
    updateClientMutation.mutate(editedClient);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-indigo-600"
      >
        <ChevronLeft className="w-5 h-5" />
        חזרה לרשימת לקוחות
      </button>

      {/* Client Header */}
      <Card className="border-slate-200">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center flex-shrink-0">
              {client.avatar_url ? (
                <img src={client.avatar_url} alt={client.full_name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <User className="w-12 h-12 text-indigo-600" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <Input
                      value={editedClient.full_name}
                      onChange={(e) => setEditedClient({...editedClient, full_name: e.target.value})}
                      className="text-2xl font-bold w-80"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-slate-900">{client.full_name}</h1>
                  )}
                  <Badge className={statusLabels[client.status]?.color}>
                    {statusLabels[client.status]?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditedClient(client);
                      setIsEditing(true);
                    }}>
                      <Edit2 className="w-4 h-4 ml-1" />
                      ערוך
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit} disabled={updateClientMutation.isPending}>
                        <Save className="w-4 h-4 ml-1" />
                        שמור
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">טלפון</label>
                    <Input
                      value={editedClient.phone}
                      onChange={(e) => setEditedClient({...editedClient, phone: e.target.value})}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">אימייל</label>
                    <Input
                      value={editedClient.email}
                      onChange={(e) => setEditedClient({...editedClient, email: e.target.value})}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">כתובת</label>
                    <Input
                      value={editedClient.address}
                      onChange={(e) => setEditedClient({...editedClient, address: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4" />
                      <span dir="ltr">{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex gap-6 mt-6 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{projects.length}</p>
                  <p className="text-xs text-slate-500">פרויקטים</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">₪{totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">הכנסות</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{recordings.length}</p>
                  <p className="text-xs text-slate-500">הקלטות</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{proposals.length}</p>
                  <p className="text-xs text-slate-500">הצעות</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{openTasks.length}</p>
                  <p className="text-xs text-slate-500">משימות פתוחות</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100">
            <Button 
              onClick={handleCreateProject}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 ml-2" />
              פרויקט חדש
            </Button>
            {client.email && (
              <Button variant="outline" onClick={handleSendEmail}>
                <Send className="w-4 h-4 ml-2" />
                שלח מייל
              </Button>
            )}
            {client.phone && (
              <Button variant="outline" onClick={handleCallClient}>
                <Phone className="w-4 h-4 ml-2" />
                התקשר
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview">סקירה</TabsTrigger>
          <TabsTrigger value="projects">פרויקטים</TabsTrigger>
          <TabsTrigger value="recordings">הקלטות</TabsTrigger>
          <TabsTrigger value="proposals">הצעות</TabsTrigger>
          <TabsTrigger value="timeline">היסטוריה</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preferences */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="w-5 h-5 text-pink-600" />
                  העדפות עיצוביות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.preferences?.styles?.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">סגנונות מועדפים</p>
                    <div className="flex flex-wrap gap-2">
                      {client.preferences.styles.map((style, idx) => (
                        <Badge key={idx} variant="outline" className="bg-pink-50">{style}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {client.preferences?.colors?.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">צבעים</p>
                    <div className="flex flex-wrap gap-2">
                      {client.preferences.colors.map((color, idx) => (
                        <Badge key={idx} variant="outline">{color}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {client.preferences?.materials?.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">חומרים</p>
                    <div className="flex flex-wrap gap-2">
                      {client.preferences.materials.map((material, idx) => (
                        <Badge key={idx} variant="outline">{material}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {client.preferences?.budget_range && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">טווח תקציב</p>
                    <p className="font-medium">{client.preferences.budget_range}</p>
                  </div>
                )}
                {(!client.preferences || Object.keys(client.preferences).length === 0) && (
                  <p className="text-slate-500 text-center py-4">אין העדפות עדיין</p>
                )}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  תובנות AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.ai_insights?.communication_style && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">סגנון תקשורת</p>
                    <p className="text-slate-700">{client.ai_insights.communication_style}</p>
                  </div>
                )}
                {client.ai_insights?.decision_making && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">קבלת החלטות</p>
                    <p className="text-slate-700">{client.ai_insights.decision_making}</p>
                  </div>
                )}
                {client.ai_insights?.personality_traits?.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">תכונות אישיות</p>
                    <div className="flex flex-wrap gap-2">
                      {client.ai_insights.personality_traits.map((trait, idx) => (
                        <Badge key={idx} variant="outline" className="bg-purple-50">{trait}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {client.ai_insights?.key_concerns?.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">חששות עיקריים</p>
                    <div className="flex flex-wrap gap-2">
                      {client.ai_insights.key_concerns.map((concern, idx) => (
                        <Badge key={idx} variant="outline" className="bg-amber-50">{concern}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(!client.ai_insights || Object.keys(client.ai_insights).length === 0) && (
                  <p className="text-slate-500 text-center py-4">אין תובנות עדיין</p>
                )}
              </CardContent>
            </Card>

            {/* Personal Preferences - NEW */}
            <Card className="border-slate-200 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                  התאמות אישיות לפרויקט
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.personal_preferences ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Household Members */}
                    {client.personal_preferences.household_members?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          בני הבית
                        </p>
                        <div className="space-y-2">
                          {client.personal_preferences.household_members.map((member, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-lg">
                              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-indigo-600" />
                              </div>
                              <div>
                                <span className="font-medium">{member.name}</span>
                                {member.height_cm && (
                                  <span className="text-slate-500 mr-2">
                                    <Ruler className="w-3 h-3 inline ml-1" />
                                    {member.height_cm} ס"מ
                                  </span>
                                )}
                                {member.notes && (
                                  <span className="text-slate-400 mr-1">({member.notes})</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lifestyle */}
                    {client.personal_preferences.lifestyle && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          אורח חיים
                        </p>
                        <div className="space-y-2">
                          {client.personal_preferences.lifestyle.religious_level && (
                            <Badge variant="outline" className="bg-purple-50">
                              {client.personal_preferences.lifestyle.religious_level === 'secular' && 'חילוני'}
                              {client.personal_preferences.lifestyle.religious_level === 'traditional' && 'מסורתי'}
                              {client.personal_preferences.lifestyle.religious_level === 'religious' && 'דתי'}
                              {client.personal_preferences.lifestyle.religious_level === 'ultra_orthodox' && 'חרדי'}
                            </Badge>
                          )}
                          {client.personal_preferences.lifestyle.kosher_kitchen && (
                            <Badge variant="outline" className="bg-green-50">מטבח כשר</Badge>
                          )}
                          {client.personal_preferences.lifestyle.shabbat_considerations && (
                            <Badge variant="outline" className="bg-blue-50">התאמות שבת</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional */}
                    {client.personal_preferences.additional && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          העדפות נוספות
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {client.personal_preferences.additional.work_from_home && (
                            <Badge variant="outline" className="bg-cyan-50">
                              <Briefcase className="w-3 h-3 ml-1" />
                              עבודה מהבית
                            </Badge>
                          )}
                          {client.personal_preferences.additional.entertaining_frequency && (
                            <Badge variant="outline" className="bg-orange-50">
                              אירוח: {
                                client.personal_preferences.additional.entertaining_frequency === 'rarely' ? 'נדיר' :
                                client.personal_preferences.additional.entertaining_frequency === 'occasionally' ? 'מדי פעם' :
                                'תכוף'
                              }
                            </Badge>
                          )}
                          {client.personal_preferences.additional.storage_needs && (
                            <Badge variant="outline" className="bg-slate-100">
                              אחסון: {
                                client.personal_preferences.additional.storage_needs === 'minimal' ? 'מינימלי' :
                                client.personal_preferences.additional.storage_needs === 'average' ? 'ממוצע' :
                                'נרחב'
                              }
                            </Badge>
                          )}
                          {client.personal_preferences.additional.pets?.map((pet, idx) => (
                            <Badge key={idx} variant="outline" className="bg-amber-50">
                              <Dog className="w-3 h-3 ml-1" />
                              {pet}
                            </Badge>
                          ))}
                          {client.personal_preferences.additional.hobbies?.map((hobby, idx) => (
                            <Badge key={idx} variant="outline" className="bg-pink-50">
                              <Gamepad2 className="w-3 h-3 ml-1" />
                              {hobby}
                            </Badge>
                          ))}
                          {client.personal_preferences.additional.accessibility_needs?.map((need, idx) => (
                            <Badge key={idx} variant="outline" className="bg-red-50">
                              <Accessibility className="w-3 h-3 ml-1" />
                              {need}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">אין התאמות אישיות עדיין</p>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {client.notes && (
              <Card className="border-slate-200 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">הערות</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap">{client.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Projects Tab - Enhanced */}
        <TabsContent value="projects">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FolderKanban className="w-5 h-5 text-indigo-600" />
                פרויקטים ({projects.length})
              </CardTitle>
              <Button 
                size="sm" 
                onClick={handleCreateProject}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 ml-1" />
                פרויקט חדש
              </Button>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project) => {
                    // Get project tasks
                    const projectTasks = tasks.filter(t => t.project_id === project.id);
                    const projectOpenTasks = projectTasks.filter(t => t.status !== 'completed');
                    
                    // Status configuration
                    const statusLabels = {
                      first_call: { label: 'שיחה ראשונה', color: 'bg-blue-100 text-blue-800' },
                      proposal: { label: 'הצעת מחיר', color: 'bg-cyan-100 text-cyan-800' },
                      gantt: { label: 'תכנון', color: 'bg-indigo-100 text-indigo-800' },
                      sketches: { label: 'סקיצות', color: 'bg-yellow-100 text-yellow-800' },
                      rendering: { label: 'הדמיות', color: 'bg-purple-100 text-purple-800' },
                      technical: { label: 'תוכניות', color: 'bg-orange-100 text-orange-800' },
                      execution: { label: 'ביצוע', color: 'bg-red-100 text-red-800' },
                      completion: { label: 'הושלם', color: 'bg-green-100 text-green-800' },
                    };
                    const status = statusLabels[project.status] || { label: project.status, color: 'bg-slate-100 text-slate-800' };

                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-4">
                          {project.image && (
                            <img 
                              src={project.image} 
                              alt={project.name} 
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0" 
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-slate-900">{project.name}</h4>
                                <p className="text-sm text-slate-500">{project.location}</p>
                              </div>
                              <Badge className={status.color}>{status.label}</Badge>
                            </div>
                            
                            {/* Project Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                              {project.budget && (
                                <div className="flex items-center gap-1.5 text-sm">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="font-medium text-green-700">{project.budget}</span>
                                </div>
                              )}
                              {project.end_date && (
                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                  <Calendar className="w-4 h-4" />
                                  <span>{format(new Date(project.end_date), 'd/M/yy')}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 text-sm">
                                {projectOpenTasks.length > 0 ? (
                                  <>
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                    <span className="text-orange-600">{projectOpenTasks.length} משימות פתוחות</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span className="text-green-600">אין משימות פתוחות</span>
                                  </>
                                )}
                              </div>
                              {project.sub_stage && (
                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                  <ListTodo className="w-4 h-4" />
                                  <span>{project.sub_stage}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(createPageUrl('Projects') + `?id=${project.id}`)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FolderKanban className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="mb-4">אין פרויקטים עדיין</p>
                  <Button onClick={handleCreateProject} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 ml-2" />
                    צור פרויקט ראשון
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recordings Tab */}
        <TabsContent value="recordings">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mic className="w-5 h-5 text-violet-600" />
                הקלטות ({recordings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recordings.length > 0 ? (
                <div className="space-y-3">
                  {recordings.map((recording) => (
                    <div
                      key={recording.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{recording.title}</p>
                          {recording.analysis?.summary && (
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {recording.analysis.summary}
                            </p>
                          )}
                        </div>
                        <div className="text-left">
                          <Badge variant="outline">{recording.status}</Badge>
                          {recording.created_date && (
                            <p className="text-xs text-slate-500 mt-1">
                              {format(new Date(recording.created_date), 'd/M/yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Mic className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>אין הקלטות עדיין</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-cyan-600" />
                הצעות מחיר ({proposals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proposals.length > 0 ? (
                <div className="space-y-3">
                  {proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{proposal.title}</p>
                          <p className="text-sm text-slate-500">{proposal.project_name}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-bold text-indigo-600">
                            ₪{(proposal.total_amount || 0).toLocaleString()}
                          </p>
                          <Badge className={
                            proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                            proposal.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          }>
                            {proposal.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>אין הצעות מחיר עדיין</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <ClientTimeline timeline={client.timeline} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}