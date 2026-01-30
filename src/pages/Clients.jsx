import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Search, 
  Plus,
  Phone,
  Mail,
  MapPin,
  Building2,
  TrendingUp,
  Star,
  Calendar,
  Loader2,
  User,
  ChevronLeft,
  FolderKanban
} from 'lucide-react';
import { createPageUrl } from '../utils';
import { useNavigate } from 'react-router-dom';
import ClientDetailView from '../components/clients/ClientDetailView';
import UserAccessStatus from '../components/users/UserAccessStatus';
import NewClientModal from '../components/clients/NewClientModal';
import { SkeletonCard } from '../components/ui/SkeletonCard';

const statusLabels = {
  lead: { label: 'ליד', color: 'bg-blue-100 text-blue-800' },
  active: { label: 'פעיל', color: 'bg-green-100 text-green-800' },
  completed: { label: 'הושלם', color: 'bg-slate-100 text-slate-800' },
  inactive: { label: 'לא פעיל', color: 'bg-red-100 text-red-800' },
};

const sourceLabels = {
  referral: 'המלצה',
  website: 'אתר',
  social_media: 'רשתות חברתיות',
  advertisement: 'פרסום',
  returning: 'לקוח חוזר',
  other: 'אחר',
};

export default function Clients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  // Check URL for client ID
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('clientId') || urlParams.get('id');
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, []);

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  // Fetch projects for stats
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  // Get project count per client
  const getClientProjectCount = (clientId) => {
    return projects.filter(p => p.client_id === clientId).length;
  };

  const filteredClients = clients.filter(client =>
    client.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Stats
  const stats = [
    { label: 'סה״כ לקוחות', value: clients.length, icon: Users },
    { label: 'לקוחות פעילים', value: clients.filter(c => c.status === 'active').length, icon: TrendingUp },
    { label: 'לידים חדשים', value: clients.filter(c => c.status === 'lead').length, icon: Star },
  ];

  if (selectedClient) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <ClientDetailView 
          client={selectedClient} 
          onBack={() => {
            setSelectedClientId(null);
            navigate(createPageUrl('Clients'), { replace: true });
          }} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <NewClientModal
          isOpen={showNewClientModal}
          onClose={() => setShowNewClientModal(false)}
        />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">כרטיסי לקוח</h1>
            <p className="text-lg text-slate-600">ניהול לקוחות ומעקב אחר פרויקטים</p>
          </div>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setShowNewClientModal(true)}
          >
            <Plus className="w-5 h-5 ml-2" />
            לקוח חדש
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                      </div>
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="חפש לקוח..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-12 py-6 bg-white border-slate-200"
          />
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard count={6} />
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedClientId(client.id)}
              >
                <Card className="border-slate-200 hover:shadow-xl transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        {client.avatar_url ? (
                          <img src={client.avatar_url} alt={client.full_name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <User className="w-7 h-7 text-indigo-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">{client.full_name}</h3>
                          <Badge className={`${statusLabels[client.status]?.color} text-xs`}>
                            {statusLabels[client.status]?.label}
                          </Badge>
                        </div>

                        {client.phone && (
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span dir="ltr">{client.phone}</span>
                          </p>
                        )}

                        {client.email && (
                          <div className="flex flex-col gap-1">
                            <p className="text-sm text-slate-500 truncate">{client.email}</p>
                            <div className="mt-1">
                              <UserAccessStatus email={client.email} name={client.full_name} type="client" entityId={client.id} />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          {client.source && (
                            <Badge variant="outline" className="text-xs">
                              {sourceLabels[client.source]}
                            </Badge>
                          )}
                          {getClientProjectCount(client.id) > 0 && (
                            <Badge variant="outline" className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700">
                              <FolderKanban className="w-3 h-3 ml-1" />
                              {getClientProjectCount(client.id)} פרויקטים
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">אין לקוחות</h3>
            <p className="text-slate-600">לקוחות ייווצרו אוטומטית מפגישות ראשונות</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}