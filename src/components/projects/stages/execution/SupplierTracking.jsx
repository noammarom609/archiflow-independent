import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Truck, Phone, Box } from 'lucide-react';
import ContractorCard from '@/components/contractors/ContractorCard';
import TaskFormDialog from '@/components/projects/tasks/TaskFormDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';
import { showSuccess, showError } from '@/components/utils/notifications';

export default function SupplierTracking({ project, suppliers = [], tasks = [], onAddSupplier }) {
  const queryClient = useQueryClient();
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Filter tasks that act as "Orders" (assigned to suppliers)
  // We identify orders as tasks assigned to a contractor that is in our suppliers list
  const supplierIds = suppliers.map(s => s.id);
  const orderTasks = tasks.filter(t => supplierIds.includes(t.contractor_id));

  const createOrderMutation = useMutation({
    mutationFn: (data) => archiflow.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
      showSuccess('הזמנה נוצרה בהצלחה');
      setShowOrderDialog(false);
      setSelectedSupplier(null);
    },
    onError: () => showError('שגיאה ביצירת הזמנה')
  });

  const handleCreateOrder = (taskData) => {
    createOrderMutation.mutate({
      ...taskData,
      project_id: project.id,
      project_name: project.name,
      contractor_id: selectedSupplier?.id,
      contractor_name: selectedSupplier?.name,
      title: `הזמנה: ${taskData.title}`, // Prefix with Order
      status: 'pending' // Default status
    });
  };

  const openOrderDialog = (supplier) => {
    setSelectedSupplier(supplier);
    setShowOrderDialog(true);
  };

  return (
    <div className="space-y-8">
      
      {/* Active Orders Section */}
      {orderTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            הזמנות פעילות
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orderTasks.map(order => (
              <Card key={order.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      {order.contractor_name}
                    </Badge>
                    <Badge className={
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-800'
                    }>
                      {order.status === 'completed' ? 'סופק' :
                       order.status === 'in_progress' ? 'בדרך' : 'הוזמן'}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-slate-900">{order.title.replace('הזמנה: ', '')}</h4>
                  {order.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{order.description}</p>}
                  {order.due_date && (
                    <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      צפי אספקה: {order.due_date}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Suppliers List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            ספקים רשומים
          </h3>
          <Button onClick={onAddSupplier} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 ml-2" />
            הוסף ספק למערכת
          </Button>
        </div>

        {suppliers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map((supplier, index) => (
              <div key={supplier.id} className="relative group">
                <ContractorCard 
                  contractor={supplier} 
                  index={index}
                  onClick={() => {}} 
                />
                {/* Overlay Action Button */}
                <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" onClick={(e) => {
                    e.stopPropagation();
                    openOrderDialog(supplier);
                  }} className="bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 shadow-sm">
                    <Plus className="w-4 h-4 ml-2" />
                    צור הזמנה
                  </Button>
                </div>
                {/* Mobile visible button if hover not available */}
                <div className="md:hidden mt-2">
                   <Button size="sm" variant="outline" className="w-full" onClick={() => openOrderDialog(supplier)}>
                    <Plus className="w-4 h-4 ml-2" />
                    צור הזמנה
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-slate-200 border-dashed">
            <CardContent className="p-12 text-center">
              <Box className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="font-semibold text-slate-700 mb-2">אין ספקים במערכת</h3>
              <p className="text-sm text-slate-500 mb-4">הוסף ספקים כדי לנהל הזמנות רכש וציוד לפרויקט</p>
              <Button variant="outline" onClick={onAddSupplier}>
                <Plus className="w-4 h-4 ml-2" />
                הוסף ספק ראשון
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <TaskFormDialog
        isOpen={showOrderDialog}
        onClose={() => {
          setShowOrderDialog(false);
          setSelectedSupplier(null);
        }}
        task={null} // New task
        project={project}
        onSave={handleCreateOrder}
        isLoading={createOrderMutation.isPending}
      />
    </div>
  );
}