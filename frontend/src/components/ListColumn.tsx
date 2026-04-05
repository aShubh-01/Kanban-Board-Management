import React, { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BoardList, Task } from '../types';
import TaskCard from './TaskCard';
import { MoreHorizontal, Plus, GripHorizontal, Layout as ListIcon, X } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  list: BoardList;
  tasks: Task[];
  boardMembers: any[];
  onAddTask: (listId: string, title: string) => void;
  onUpdateTitle: (newTitle: string) => void;
  onDelete: () => void;
  onTaskClick: (task: Task) => void;
}

const ListColumn: React.FC<Props> = ({ list, tasks, boardMembers, onAddTask, onUpdateTitle, onDelete, onTaskClick }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id, data: { type: 'List', list } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      onAddTask(list.id, taskTitle);
      setTaskTitle('');
      setIsAdding(false);
    }
  };

  const handleTitleSubmit = () => {
    if (editedTitle.trim() && editedTitle !== list.title) {
        onUpdateTitle(editedTitle);
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "flex flex-col w-[320px] h-full rounded-2xl bg-slate-100/40 border border-slate-200/50 backdrop-blur-[2px] shadow-inner shrink-0 group transition-all",
        isDragging ? "opacity-30 border-primary-300 ring-2 ring-primary-100" : ""
      )}
    >
      <div className="p-4 flex items-center justify-between cursor-default shrink-0">
        <div className="flex items-center gap-3 overflow-hidden flex-1" {...attributes} {...listeners}>
            <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
            
            {isEditingTitle ? (
                <input
                    autoFocus
                    className="font-bold text-slate-800 text-base bg-white/50 outline-none px-1 rounded flex-1 min-w-0"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleTitleSubmit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTitleSubmit();
                        if (e.key === 'Escape') {
                            setEditedTitle(list.title);
                            setIsEditingTitle(false);
                        }
                    }}
                />
            ) : (
                <h3 
                    className="font-bold text-slate-800 text-base tracking-tight truncate flex-1 cursor-pointer hover:bg-slate-200/50 px-1 rounded"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingTitle(true);
                    }}
                >
                    {list.title}
                </h3>
            )}
            
            <span className="shrink-0 text-slate-400 font-normal text-[10px] bg-white/50 px-2 py-0.5 rounded-full border border-slate-200/50 shadow-sm">
                {tasks.length}
            </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
            <button 
                onClick={() => setIsAdding(true)}
                className="p-1.5 hover:bg-primary-100 rounded-lg text-slate-400 hover:text-primary-600 transition-all shadow-sm bg-white border border-slate-100"
                title="Add task"
            >
                <Plus size={16} />
            </button>
            <button 
                onClick={onDelete}
                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all bg-white border border-slate-100 shadow-sm"
                title="Delete list"
            >
                <X size={16} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="min-h-[10px]">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} boardMembers={boardMembers} onClick={onTaskClick} />
            ))}
          </div>
        </SortableContext>

        {isAdding ? (
          <form onSubmit={handleAddSubmit} className="mt-2 animate-slide-up">
            <textarea
              autoFocus
              className="input text-sm min-h-[80px] py-2 shadow-md resize-none border-primary-300 ring-2 ring-primary-100 bg-white"
              placeholder="What needs to be done?"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddSubmit(e);
                } else if (e.key === 'Escape') {
                  setIsAdding(false);
                }
              }}
            />
            <div className="flex items-center gap-2 mt-2">
              <button type="submit" className="btn btn-primary text-xs py-1.5 px-4 rounded-lg flex-1 shadow-lg shadow-primary-500/20">
                Add Task
              </button>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                title="Cancel"
              >
                <X size={18} />
              </button>
            </div>
          </form>
        ) : tasks.length === 0 ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex flex-col items-center justify-center gap-3 py-10 mt-2 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:text-primary-600 hover:bg-primary-50/50 hover:border-primary-200 transition-all group/empty shadow-inner"
          >
            <div className="bg-slate-50 p-3 rounded-full group-hover/empty:bg-primary-100 group-hover/empty:text-primary-600 transition-colors shadow-sm ring-4 ring-white">
                <Plus size={20} />
            </div>
            <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold uppercase tracking-widest">No tasks yet</span>
                <span className="text-[10px] font-medium opacity-60">Click to add your first task</span>
            </div>
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ListColumn;
