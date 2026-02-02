import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Edit2,
  Save,
  X,
  ExternalLink,
  Building2,
  Clock
} from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';
import { createPageUrl } from '../../utils';
import { Link } from 'react-router-dom';
import LeadJourneyTimeline from '../leads/LeadJourneyTimeline';

export default function ClientInfoCard({ project, onUpdate }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

  // Fetch full client data
  const { data: client, isLoading } = useQuery({
    queryKey: ['client', project?.client_id],
    queryFn: async () => {
      if (!project?.client_id) return null;
      const clients = await archiflow.entities.Client.filter({ id: project.client_id });
      return clients[0];
    },
    enabled: !!project?.client_id
  });

  // Fetch proposals to check if project has approved proposal (is active project)
  const { data: proposals = [] } = useQuery({
    queryKey: ['projectProposals', project?.id],
    queryFn: async () => {
      try {
        const result = await archiflow.entities.Proposal.filter(
          { project_id: project.id },
          '-created_date'
        );
        return result || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!project?.id,
  });

  // Check if this is an active project (has approved proposal or past proposal stage)
  const hasApprovedProposal = proposals.some(p => p.status === 'approved');
  const isActiveProject = hasApprovedProposal || !['first_call', 'proposal'].includes(project?.current_stage);

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data) => {
      let clientId = project?.client_id;
      
      // If no client_id exists, create a new Client
      if (!clientId) {
        const newClient = await archiflow.entities.Client.create({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          notes: data.notes,
          status: data.status || 'active'
        });
        clientId = newClient.id;
      } else {
        // Update existing client
        await archiflow.entities.Client.update(clientId, data);
      }
      
      // Sync to project (including the new client_id if created)
      if (onUpdate) {
        await onUpdate({
          client_id: clientId,
          client: data.full_name || project.client,
          client_email: data.email || project.client_email,
          client_phone: data.phone || project.client_phone,
          location: data.address || project.location
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showSuccess('פרטי הלקוח עודכנו בהצלחה!');
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating client:', error);
      showError('שגיאה בעדכון פרטי הלקוח');
    }
  });

  const handleEdit = () => {
    setEditedData({
      full_name: client?.full_name || project?.client || '',
      email: client?.email || project?.client_email || '',
      phone: client?.phone || project?.client_phone || '',
      address: client?.address || project?.location || '',
      notes: client?.notes || ''
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateClientMutation.mutate(editedData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  if (!project?.client_id && !project?.client) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 text-center">
          <User className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className="text-amber-800 font-medium">לא נוצר כרטיס לקוח לפרויקט זה</p>
          <p className="text-sm text-amber-600 mt-1">עבור לשלב "כרטיס לקוח" ליצירת כרטיס</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">פרטי הלקוח</h3>
              <p className="text-sm text-slate-500 font-normal">מידע ליצירת קשר</p>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            {project?.client_id && (
              <Link to={createPageUrl('Clients') + `?clientId=${project.client_id}`}>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4 ml-1" />
                  לכרטיס מלא
                </Button>
              </Link>
            )}
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit2 className="w-4 h-4 ml-1" />
                ערוך
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateClientMutation.isPending}>
                  <Save className="w-4 h-4 ml-1" />
                  שמור
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">שם מלא</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={editedData.full_name}
                  onChange={(e) => setEditedData({...editedData, full_name: e.target.value})}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">אימייל</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    value={editedData.email}
                    onChange={(e) => setEditedData({...editedData, email: e.target.value})}
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">טלפון</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={editedData.phone}
                    onChange={(e) => setEditedData({...editedData, phone: e.target.value})}
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">כתובת</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={editedData.address}
                  onChange={(e) => setEditedData({...editedData, address: e.target.value})}
                  className="pr-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">הערות</label>
              <Textarea
                value={editedData.notes}
                onChange={(e) => setEditedData({...editedData, notes: e.target.value})}
                className="min-h-[80px]"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <User className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">שם מלא</p>
                <p className="font-medium text-slate-900">{client?.full_name || project?.client || 'לא צוין'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Mail className="w-5 h-5 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">אימייל</p>
                  <p className="font-medium text-slate-900 truncate" dir="ltr">
                    {client?.email || project?.client_email || 'לא צוין'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Phone className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">טלפון</p>
                  <p className="font-medium text-slate-900" dir="ltr">
                    {client?.phone || project?.client_phone || 'לא צוין'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <MapPin className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">כתובת</p>
                <p className="font-medium text-slate-900">{client?.address || project?.location || 'לא צוינה'}</p>
              </div>
            </div>

            {client?.notes && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700 mb-1">הערות</p>
                <p className="text-sm text-slate-900">{client.notes}</p>
              </div>
            )}

            {client?.status && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">סטטוס:</span>
                <Badge className={
                  client.status === 'active' ? 'bg-green-100 text-green-800' :
                  client.status === 'inactive' ? 'bg-slate-100 text-slate-800' :
                  'bg-amber-100 text-amber-800'
                }>
                  {client.status === 'active' ? 'פעיל' : client.status === 'inactive' ? 'לא פעיל' : 'פוטנציאלי'}
                </Badge>
              </div>
            )}

            {/* Lead Journey Timeline - Only show for active projects */}
            {isActiveProject && project && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <LeadJourneyTimeline project={project} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}