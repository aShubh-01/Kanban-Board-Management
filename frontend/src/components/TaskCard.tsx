import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Priority } from '../types';
import { Clock, CheckSquare, MessageSquare, GripVertical, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface Props {
  task: Task;
  boardMembers: any[];
  onClick: (task: Task) => void;
}

const TaskCard: React.FC<Props> = ({ task, boardMembers, onClick }) => {
  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-blue-600', 'bg-indigo-600', 'bg-violet-600', 
      'bg-purple-600', 'bg-fuchsia-600', 'bg-pink-600', 
      'bg-rose-600', 'bg-orange-600', 'bg-amber-500', 
      'bg-emerald-600', 'bg-teal-600', 'bg-cyan-600'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getMemberName = (id: string) => {
    return boardMembers.find(m => m.id === id)?.name || 'Unknown';
  };

  const safeFormatDate = (dateStr: string | undefined, formatStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, formatStr);
    } catch (err) {
      return 'Invalid date';
    }
  };
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const priorityColors = {
    [Priority.LOW]: 'bg-blue-50 text-blue-600 border-blue-100',
    [Priority.MEDIUM]: 'bg-amber-50 text-amber-600 border-amber-100',
    [Priority.HIGH]: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const completedChecklist = task.checklist.filter(item => item.completed).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-100 transition-all cursor-pointer relative mb-3 last:mb-0"
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={clsx(
          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
          priorityColors[task.priority]
        )}>
          {task.priority}
        </span>
      </div>

      <h4 className="text-sm font-semibold text-slate-800 leading-snug mb-2 group-hover:text-primary-700 transition-colors">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-normal">
          {task.description}
        </p>
      )}

      {(task.dueDate || task.checklist.length > 0 || task.assigneeIds.length > 0) && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-50">
          {task.dueDate && (
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
              <Clock size={12} />
              {safeFormatDate(task.dueDate, 'MMM d')}
            </div>
          )}
          
          {task.checklist.length > 0 && (
            <div className={clsx(
              "flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-md",
              completedChecklist === task.checklist.length 
                ? "bg-green-50 text-green-600" 
                : "bg-slate-50 text-slate-400"
            )}>
              <CheckSquare size={12} />
              {completedChecklist}/{task.checklist.length}
            </div>
          )}

          <div className="ml-auto flex -space-x-1.5">
            {task.assigneeIds.slice(0, 3).map((id) => (
              <div key={id} className={clsx("w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-slate-100", getAvatarColor(id))} title={getMemberName(id)}>
                {getMemberName(id).charAt(0).toUpperCase()}
              </div>
            ))}
            {task.assigneeIds.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-100">
                +{task.assigneeIds.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
