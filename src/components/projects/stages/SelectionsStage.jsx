import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShoppingBag, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Truck,
  MoreVertical,
  Trash2,
  DollarSign,
  Pencil
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/components/utils/notifications';

export default function SelectionsStage({ project, onUpdate }) {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
      category: 'tile',
      room: '',
      item_name: '',
      supplier_id: '',
      status: 'proposed',
      quantity: 1,
      cost_per_unit: '',
      link: '',
      notes: ''
  });

  // Fetch Selections
  const { data: selections = [], isLoading } = useQuery({
      queryKey: ['projectSelections', project.id],
      queryFn: () => archiflow.entities.ProjectSelection.filter({ project_id: project.id }),
  });

  // Fetch Suppliers
  const { data: suppliers = [] } = useQuery({
      queryKey: ['suppliers'],
      queryFn: () => archiflow.entities.Contractor.filter({ type: 'supplier' }),
  });

  const createSelectionMutation = useMutation({
      mutationFn: (data) => archiflow.entities.ProjectSelection.create({ ...data, project_id: project.id }),
      onSuccess: () => {
          queryClient.invalidateQueries(['projectSelections']);
          setIsAddModalOpen(false);
          setNewItem({ category: 'tile', room: '', item_name: '', supplier_id: '', status: 'proposed', quantity: 1, cost_per_unit: '', link: '', notes: '' });
          showSuccess('פריט נוסף בהצלחה');
      },
      onError: () => showError('שגיאה בהוספת פריט')
  });

  const deleteSelectionMutation = useMutation({
      mutationFn: (id) => archiflow.entities.ProjectSelection.delete(id),
      onSuccess: () => {
          queryClient.invalidateQueries(['projectSelections']);
          showSuccess('פריט נמחק');
      }
  });

  const updateStatusMutation = useMutation({
      mutationFn: ({ id, status }) => archiflow.entities.ProjectSelection.update(id, { status }),
      onSuccess: () => queryClient.invalidateQueries(['projectSelections'])
  });

  const updateSelectionMutation = useMutation({
      mutationFn: ({ id, data }) => archiflow.entities.ProjectSelection.update(id, data),
      onSuccess: () => {
          queryClient.invalidateQueries(['projectSelections']);
          setIsEditModalOpen(false);
          setEditingItem(null);
          showSuccess('פריט עודכן בהצלחה');
      },
      onError: () => showError('שגיאה בעדכון פריט')
  });

  const openEditModal = (item) => {
      setEditingItem({ ...item });
      setIsEditModalOpen(true);
  };

  const handleCreate = () => {
      // Validation
      if (!newItem.item_name?.trim()) {
          showError('יש להזין שם פריט');
          return;
      }
      if (!newItem.cost_per_unit || newItem.cost_per_unit <= 0) {
          showError('יש להזין מחיר ליחידה');
          return;
      }
      createSelectionMutation.mutate(newItem);
  };

  const handleUpdate = () => {
      if (!editingItem) return;
      // Validation
      if (!editingItem.item_name?.trim()) {
          showError('יש להזין שם פריט');
          return;
      }
      if (!editingItem.cost_per_unit || editingItem.cost_per_unit <= 0) {
          showError('יש להזין מחיר ליחידה');
          return;
      }
      const { id, ...data } = editingItem;
      updateSelectionMutation.mutate({ id, data });
  };

  const getStatusBadge = (status) => {
      const styles = {
          proposed: 'bg-slate-100 text-slate-700',
          approved: 'bg-blue-100 text-blue-700',
          ordered: 'bg-orange-100 text-orange-700',
          delivered: 'bg-green-100 text-green-700',
          installed: 'bg-indigo-100 text-indigo-700'
      };
      const labels = {
          proposed: 'הוצע',
          approved: 'אושר',
          ordered: 'הוזמן',
          delivered: 'סופק',
          installed: 'הותקן'
      };
      return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
  };

  const calculateTotal = () => {
      return selections.reduce((sum, item) => sum + ((item.quantity || 0) * (item.cost_per_unit || 0)), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <div>
              <h2 className="text-xl font-bold text-slate-900">בחירות וכתב כמויות</h2>
              <p className="text-slate-500">ניהול בחירות חומרים, ספקים והזמנות</p>
          </div>
          <div className="flex items-center gap-4">
              <div className="text-left">
                  <span className="text-xs text-slate-500 block">סה"כ אומדן</span>
                  <span className="text-lg font-bold text-indigo-600">₪{calculateTotal().toLocaleString()}</span>
              </div>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                  <DialogTrigger asChild>
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                          <Plus className="w-4 h-4 ml-2" />
                          הוסף פריט
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>הוספת פריט לבחירות</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <Label>קטגוריה</Label>
                                  <Select 
                                    value={newItem.category} 
                                    onValueChange={(val) => setNewItem({...newItem, category: val})}
                                  >
                                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="tile">ריצוף וחיפוי</SelectItem>
                                          <SelectItem value="sanitary">סניטרי</SelectItem>
                                          <SelectItem value="lighting">תאורה</SelectItem>
                                          <SelectItem value="carpentry">נגרות</SelectItem>
                                          <SelectItem value="aluminum">אלומיניום</SelectItem>
                                          <SelectItem value="furniture">ריהוט</SelectItem>
                                          <SelectItem value="appliances">מוצרי חשמל</SelectItem>
                                          <SelectItem value="other">אחר</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div>
                                  <Label>חדר / אזור</Label>
                                  <Input 
                                    value={newItem.room} 
                                    onChange={(e) => setNewItem({...newItem, room: e.target.value})} 
                                    placeholder="לדוגמה: מטבח"
                                    className="mt-1"
                                  />
                              </div>
                          </div>
                          <div>
                              <Label>שם הפריט / דגם</Label>
                              <Input 
                                value={newItem.item_name} 
                                onChange={(e) => setNewItem({...newItem, item_name: e.target.value})} 
                                className="mt-1"
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <Label>ספק</Label>
                                  <Select 
                                    value={newItem.supplier_id} 
                                    onValueChange={(val) => setNewItem({...newItem, supplier_id: val})}
                                  >
                                      <SelectTrigger className="mt-1"><SelectValue placeholder="בחר ספק" /></SelectTrigger>
                                      <SelectContent>
                                          {suppliers.map(s => (
                                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div>
                                  <Label>סטטוס</Label>
                                  <Select 
                                    value={newItem.status} 
                                    onValueChange={(val) => setNewItem({...newItem, status: val})}
                                  >
                                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="proposed">הוצע</SelectItem>
                                          <SelectItem value="approved">אושר</SelectItem>
                                          <SelectItem value="ordered">הוזמן</SelectItem>
                                          <SelectItem value="delivered">סופק</SelectItem>
                                          <SelectItem value="installed">הותקן</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <Label>כמות</Label>
                                  <Input 
                                    type="number" 
                                    value={newItem.quantity} 
                                    onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} 
                                    className="mt-1"
                                  />
                              </div>
                              <div>
                                  <Label>מחיר ליחידה (₪)</Label>
                                  <Input 
                                    type="number" 
                                    value={newItem.cost_per_unit} 
                                    onChange={(e) => setNewItem({...newItem, cost_per_unit: parseFloat(e.target.value)})} 
                                    className="mt-1"
                                  />
                              </div>
                          </div>
                          <Button onClick={handleCreate} className="mt-4 bg-indigo-600">
                              שמור פריט
                          </Button>
                      </div>
                  </DialogContent>
              </Dialog>
          </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>עריכת פריט</DialogTitle>
              </DialogHeader>
              {editingItem && (
                  <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <Label>קטגוריה</Label>
                              <Select 
                                value={editingItem.category} 
                                onValueChange={(val) => setEditingItem({...editingItem, category: val})}
                              >
                                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="tile">ריצוף וחיפוי</SelectItem>
                                      <SelectItem value="sanitary">סניטרי</SelectItem>
                                      <SelectItem value="lighting">תאורה</SelectItem>
                                      <SelectItem value="carpentry">נגרות</SelectItem>
                                      <SelectItem value="aluminum">אלומיניום</SelectItem>
                                      <SelectItem value="furniture">ריהוט</SelectItem>
                                      <SelectItem value="appliances">מוצרי חשמל</SelectItem>
                                      <SelectItem value="other">אחר</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div>
                              <Label>חדר / אזור</Label>
                              <Input 
                                value={editingItem.room || ''} 
                                onChange={(e) => setEditingItem({...editingItem, room: e.target.value})} 
                                placeholder="לדוגמה: מטבח"
                                className="mt-1"
                              />
                          </div>
                      </div>
                      <div>
                          <Label>שם הפריט / דגם</Label>
                          <Input 
                            value={editingItem.item_name || ''} 
                            onChange={(e) => setEditingItem({...editingItem, item_name: e.target.value})} 
                            className="mt-1"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <Label>ספק</Label>
                              <Select 
                                value={editingItem.supplier_id || ''} 
                                onValueChange={(val) => setEditingItem({...editingItem, supplier_id: val})}
                              >
                                  <SelectTrigger className="mt-1"><SelectValue placeholder="בחר ספק" /></SelectTrigger>
                                  <SelectContent>
                                      {suppliers.map(s => (
                                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div>
                              <Label>סטטוס</Label>
                              <Select 
                                value={editingItem.status} 
                                onValueChange={(val) => setEditingItem({...editingItem, status: val})}
                              >
                                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="proposed">הוצע</SelectItem>
                                      <SelectItem value="approved">אושר</SelectItem>
                                      <SelectItem value="ordered">הוזמן</SelectItem>
                                      <SelectItem value="delivered">סופק</SelectItem>
                                      <SelectItem value="installed">הותקן</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <Label>כמות</Label>
                              <Input 
                                type="number" 
                                value={editingItem.quantity || 1} 
                                onChange={(e) => setEditingItem({...editingItem, quantity: parseFloat(e.target.value)})} 
                                className="mt-1"
                              />
                          </div>
                          <div>
                              <Label>מחיר ליחידה (₪)</Label>
                              <Input 
                                type="number" 
                                value={editingItem.cost_per_unit || ''} 
                                onChange={(e) => setEditingItem({...editingItem, cost_per_unit: parseFloat(e.target.value)})} 
                                className="mt-1"
                              />
                          </div>
                      </div>
                      <Button onClick={handleUpdate} className="mt-4 bg-indigo-600">
                          עדכן פריט
                      </Button>
                  </div>
              )}
          </DialogContent>
      </Dialog>

      <Card className="overflow-hidden border-slate-200">
          <Table>
              <TableHeader className="bg-slate-50">
                  <TableRow>
                      <TableHead className="text-right">פריט</TableHead>
                      <TableHead className="text-right">חדר</TableHead>
                      <TableHead className="text-right">ספק</TableHead>
                      <TableHead className="text-right">כמות</TableHead>
                      <TableHead className="text-right">מחיר יח'</TableHead>
                      <TableHead className="text-right">סה"כ</TableHead>
                      <TableHead className="text-right">סטטוס</TableHead>
                      <TableHead></TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {selections.map((item) => {
                      const supplier = suppliers.find(s => s.id === item.supplier_id);
                      return (
                          <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                  <div>{item.item_name}</div>
                                  <div className="text-xs text-slate-500">{item.category}</div>
                              </TableCell>
                              <TableCell>{item.room}</TableCell>
                              <TableCell>{supplier?.name || '-'}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>₪{item.cost_per_unit?.toLocaleString()}</TableCell>
                              <TableCell className="font-bold">₪{(item.quantity * item.cost_per_unit)?.toLocaleString()}</TableCell>
                              <TableCell>
                                  <div className="cursor-pointer" onClick={() => {
                                      const nextStatus = {
                                          proposed: 'approved',
                                          approved: 'ordered',
                                          ordered: 'delivered',
                                          delivered: 'installed',
                                          installed: 'proposed'
                                      }[item.status];
                                      updateStatusMutation.mutate({ id: item.id, status: nextStatus });
                                  }}>
                                      {getStatusBadge(item.status)}
                                  </div>
                              </TableCell>
                              <TableCell>
                                  <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-slate-400 hover:text-blue-500"
                                        onClick={() => openEditModal(item)}
                                      >
                                          <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-slate-400 hover:text-red-500"
                                        onClick={() => deleteSelectionMutation.mutate(item.id)}
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </Button>
                                  </div>
                              </TableCell>
                          </TableRow>
                      );
                  })}
                  {selections.length === 0 && (
                      <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                              טרם נוספו פריטים לבחירה
                          </TableCell>
                      </TableRow>
                  )}
              </TableBody>
          </Table>
      </Card>

      <div className="flex justify-end pt-4">
          <Button onClick={() => onUpdate({ status: 'execution' })} className="bg-indigo-600 hover:bg-indigo-700">
              <CheckCircle2 className="w-4 h-4 ml-2" />
              סיום בחירות ומעבר לביצוע
          </Button>
      </div>
    </div>
  );
}