import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  User,
  FileText,
  MoreVertical,
  Trash2,
  Pencil,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isPast, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { useLanguage } from '@/components/providers/LanguageProvider';

const columns = [
  { id: 'pending', title: 'ממתין', color: 'bg-slate-100', borderColor: 'border-slate-300' },
  { id: 'in_progress', title: 'בתהליך', color: 'bg-blue-50', borderColor: 'border-blue-300' },
  { id: 'review', title: 'לבדיקה', color: 'bg-purple-50', borderColor: 'border-purple-300' },
  { id: 'completed', title: 'הושלם', color: 'bg-green-50', borderColor: 'border-green-300' },
];

const priorityConfig = {
  low: { label: 'נמוכה', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'בינונית', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'גבוהה', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'דחוף', color: 'bg-red-100 text-red-700' },
};

export default function TaskKanbanView({ tasks, onStatusChange, onEditTask, onDeleteTask }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    
    onStatusChange(draggableId, newStatus);
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-72">
            <div className={`rounded-xl ${column.color} border-2 ${column.borderColor} p-3`}>
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">{column.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {getTasksByStatus(column.id).length}
                </Badge>
              </div>

              {/* Tasks */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] space-y-2 transition-colors rounded-lg p-1 ${
                      snapshot.isDraggingOver ? 'bg-white/50' : ''
                    }`}
                  >
                    {getTasksByStatus(column.id).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-amber-300' : ''
                            }`}
                          >
                            {/* Task Header */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-medium text-slate-900 text-sm line-clamp-2">
                                {task.title}
                              </h4>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" aria-label={t('a11y.openMenu')} title={t('a11y.openMenu')}>
                                    <MoreVertical className="w-3.5 h-3.5" aria-hidden />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onEditTask(task)}>
                                    <Pencil className="w-4 h-4 ml-2" />
                                    ערוך
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onDeleteTask(task.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    מחק
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Description */}
                            {task.description && (
                              <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Priority */}
                            {task.priority && (
                              <Badge className={`${priorityConfig[task.priority]?.color} text-xs mb-2`}>
                                {priorityConfig[task.priority]?.label}
                              </Badge>
                            )}

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              {task.due_date && (
                                <span className={`flex items-center gap-1 ${
                                  isOverdue(task.due_date) ? 'text-red-600 font-medium' : ''
                                }`}>
                                  {isOverdue(task.due_date) && <AlertTriangle className="w-3 h-3" />}
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(task.due_date), 'd MMM', { locale: he })}
                                </span>
                              )}
                              {task.contractor_name && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {task.contractor_name}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}