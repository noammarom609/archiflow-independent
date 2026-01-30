import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Users,
  Briefcase,
  Star,
  TrendingUp,
  ArrowRight,
  FileText
} from 'lucide-react';
import ContractorCard from '../components/contractors/ContractorCard';
import TaskCard from '../components/contractors/TaskCard';
import DocumentCard from '../components/contractors/DocumentCard';
import AddContractorDialog from '../components/contractors/AddContractorDialog';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import UserAccessStatus from '../components/users/UserAccessStatus';


export default function Contractors() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedContractorId, setSelectedContractorId] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Check URL for contractor ID
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contractorId = urlParams.get('id');
    if (contractorId) {
      setSelectedContractorId(contractorId);
    }
  }, []);

  // Fetch contractors
  const { data: contractors = [], isLoading: loadingContractors } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => archiflow.entities.Contractor.list('-created_date'),
  });

  // Fetch all tasks for stats
  const { data: allTasks = [] } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => archiflow.entities.Task.list(),
  });

  // Calculate stats
  const stats = [
    { label: 'סה״כ קבלנים', value: contractors.length.toString(), icon: Users },
    { label: 'קבלנים פעילים', value: contractors.filter(c => c && c.status === 'active').length.toString(), icon: TrendingUp },
    { label: 'משימות פתוחות', value: allTasks.filter(t => t && t.status !== 'completed').length.toString(), icon: Briefcase },
    { label: 'דירוג ממוצע', value: contractors.length > 0 ? (contractors.reduce((sum, c) => sum + (c?.rating || 0), 0) / contractors.length).toFixed(1) : '0', icon: Star },
  ];

  // Fetch tasks for selected contractor
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', selectedContractorId],
    queryFn: () => 
      selectedContractorId 
        ? archiflow.entities.Task.filter({ contractor_id: selectedContractorId }, '-created_date')
        : Promise.resolve([]),
    enabled: !!selectedContractorId,
  });

  // Fetch documents for selected contractor
  const { data: documents = [] } = useQuery({
    queryKey: ['documents', selectedContractorId],
    queryFn: () => 
      selectedContractorId
        ? archiflow.entities.Document.filter({ contractor_id: selectedContractorId }, '-created_date')
        : Promise.resolve([]),
    enabled: !!selectedContractorId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => archiflow.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const selectedContractor = contractors.find(c => c.id === selectedContractorId);

  const filteredContractors = contractors.filter(contractor => {
    const matchesSearch = 
      contractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contractor.company && contractor.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = 
      activeFilter === 'all' ||
      (activeFilter === 'active' && contractor.status === 'active') ||
      (activeFilter === 'contractor' && contractor.type === 'contractor') ||
      (activeFilter === 'partner' && contractor.type === 'partner') ||
      (activeFilter === 'supplier' && contractor.type === 'supplier');
    
    return matchesSearch && matchesFilter;
  });

  const handleContractorClick = (contractorId) => {
    setSelectedContractorId(contractorId);
    navigate(createPageUrl('Contractors') + `?id=${contractorId}`);
  };

  const handleBackToList = () => {
    setSelectedContractorId(null);
    navigate(createPageUrl('Contractors'));
  };

  const handleStatusChange = (task) => {
    const statusFlow = {
      pending: 'in_progress',
      in_progress: 'review',
      review: 'completed',
      blocked: 'in_progress',
    };
    const newStatus = statusFlow[task.status] || 'pending';
    updateTaskMutation.mutate({ id: task.id, data: { status: newStatus } });
  };

  const handleApprove = (task) => {
    updateTaskMutation.mutate({ 
      id: task.id, 
      data: { 
        status: 'completed',
        approved_by: 'אדריכל דן',
        completed_date: new Date().toISOString().split('T')[0],
      } 
    });
  };

  // Contractors List View
  if (!selectedContractorId) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">קבלנים ושותפים</h1>
              <p className="text-lg text-slate-600">ניהול מרכזי של כל הקבלנים והשותפים</p>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>הוסף קבלן</span>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                          <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <Icon className="w-6 h-6 text-indigo-600" strokeWidth={1.5} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="חפש קבלן..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 py-6 border-slate-200 bg-white"
              />
            </div>
            
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-auto">
              <TabsList className="bg-white border border-slate-200 p-1">
                <TabsTrigger value="all">הכל</TabsTrigger>
                <TabsTrigger value="active">פעילים</TabsTrigger>
                <TabsTrigger value="contractor">קבלנים</TabsTrigger>
                <TabsTrigger value="partner">שותפים</TabsTrigger>
                <TabsTrigger value="supplier">ספקים</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Contractors Grid */}
          <AnimatePresence mode="wait">
            {loadingContractors ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SkeletonCard count={6} />
              </div>
            ) : filteredContractors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContractors.map((contractor, index) => (
                  <ContractorCard
                    key={contractor.id}
                    contractor={contractor}
                    onClick={() => handleContractorClick(contractor.id)}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">לא נמצאו קבלנים</h3>
                <p className="text-slate-600">נסה לשנות את מסנני החיפוש</p>
              </div>
            )}
            </AnimatePresence>

            {/* Add Contractor Dialog */}
            <AddContractorDialog
            isOpen={showAddDialog}
            onClose={() => setShowAddDialog(false)}
            />
            </motion.div>
            </div>
            );
            }

  // Contractor Detail View
  if (!selectedContractor) {
    return <div className="p-8">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button 
              variant="ghost" 
              onClick={handleBackToList}
              className="mb-4 -mr-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowRight className="w-4 h-4 ml-1 rotate-180" />
              חזרה לרשימת קבלנים
            </Button>
            <div className="flex items-center gap-3 text-sm text-slate-600 mb-4">
              <span 
                className="hover:text-indigo-600 cursor-pointer"
                onClick={handleBackToList}
              >
                קבלנים ושותפים
              </span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-slate-900 font-medium">{selectedContractor.name}</span>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0">
                  {selectedContractor.avatar_url ? (
                    <img
                      src={selectedContractor.avatar_url}
                      alt={selectedContractor.name}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-indigo-700">
                      {selectedContractor.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">
                    {selectedContractor.name}
                  </h1>
                  {selectedContractor.company && (
                    <p className="text-lg text-slate-600 mb-3">{selectedContractor.company}</p>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-lg font-semibold text-slate-900">
                        {selectedContractor.rating ? selectedContractor.rating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                    <div className="text-slate-400">•</div>
                    <div className="text-slate-600">
                      {selectedContractor.projects_completed || 0} פרויקטים
                    </div>
                    {selectedContractor.hourly_rate && (
                      <>
                        <div className="text-slate-400">•</div>
                        <div className="text-slate-900 font-semibold">
                          ₪{selectedContractor.hourly_rate}/שעה
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                הקצה משימה
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-slate-200 p-1 mb-8">
            <TabsTrigger
              value="tasks"
              className="flex-1 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
            >
              משימות ({tasks.length})
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="flex-1 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
            >
              מסמכים ({documents.length})
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="flex-1 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
            >
              פרטים
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {tasks.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {tasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onApprove={handleApprove}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-slate-200 p-12 text-center">
                  <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">אין משימות</h3>
                  <p className="text-slate-600 mb-4">הקצה משימה ראשונה לקבלן זה</p>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 ml-2" />
                    הקצה משימה
                  </Button>
                </Card>
              )}
            </motion.div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.map((doc, index) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-slate-200 p-12 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">אין מסמכים</h3>
                  <p className="text-slate-600">שתף מסמכים עם קבלן זה</p>
                </Card>
              )}
            </motion.div>
          )}

          {/* Info Tab */}
          {activeTab === 'info' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-slate-200">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">פרטי קשר</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">טלפון</p>
                      <p className="text-lg font-medium text-slate-900" dir="ltr">
                        {selectedContractor.phone}
                      </p>
                    </div>
                    {selectedContractor.email && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1">אימייל</p>
                        <p className="text-lg font-medium text-slate-900">
                          {selectedContractor.email}
                        </p>
                      </div>
                    )}
                    {selectedContractor.notes && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1">הערות</p>
                        <p className="text-slate-900">{selectedContractor.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </Tabs>
      </div>
    </div>
  );
}