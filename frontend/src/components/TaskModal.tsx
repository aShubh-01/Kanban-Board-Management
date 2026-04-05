import React, { useState, useEffect } from 'react';
import { Task, Priority, ChecklistItem, Attachment } from '../types';
import { 
  X, AlignLeft, CheckSquare, Clock, Users, Tag, Plus, Trash2, 
  ChevronRight, Calendar, MessageSquare, Send, UserCircle2, Layout,
  Paperclip, FileText, Image as ImageIcon, Download, Maximize2, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import api from '../api/client';

interface Props {
  task: Task;
  boardMembers: any[];
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskModal: React.FC<Props> = ({ task, boardMembers, onClose, onUpdate, onDelete }) => {
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Attachment States
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
    fetchAttachments();
  }, [task.id]);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/task/${task.id}`);
      setComments(response.data);
    } catch (err) {}
  };

  const fetchAttachments = async () => {
    try {
      const response = await api.get(`/tasks/${task.id}/attachments`);
      setAttachments(response.data);
    } catch (err) {
      console.error('Failed to fetch attachments');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploading(true);
    try {
      const response = await api.post(`/tasks/${task.id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachments(prev => [response.data, ...prev]);
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!confirm('Remove this attachment?')) return;
    try {
      await api.delete(`/tasks/${task.id}/attachments/${id}`);
      setAttachments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  const isImage = (contentType: string) => {
    return contentType.startsWith('image/');
  };

  const handleUpdate = async (updates: Partial<Task>) => {
    const updated = { ...editedTask, ...updates };
    setEditedTask(updated);
    setIsUpdating(true);
    try {
      const response = await api.put(`/tasks/${task.id}`, updated);
      onUpdate(response.data);
    } catch (err) {
      alert('Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddChecklist = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        title: newChecklistItem,
        completed: false,
      };
      handleUpdate({ checklist: [...editedTask.checklist, newItem] });
      setNewChecklistItem('');
    }
  };

  const toggleChecklist = (id: string) => {
    const updated = editedTask.checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    handleUpdate({ checklist: updated });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const response = await api.post('/comments', { taskId: task.id, content: newComment });
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (err) {}
  };

  const handleToggleAssignee = (memberId: string) => {
    const currentAssignees = editedTask.assigneeIds || [];
    const updated = currentAssignees.includes(memberId)
      ? currentAssignees.filter(id => id !== memberId)
      : [...currentAssignees, memberId];
    handleUpdate({ assigneeIds: updated });
  };

  const getMemberName = (id: string) => {
    return boardMembers.find(m => m.id === id)?.name || 'Unknown User';
  };

  const getAvatarColor = (id: string | undefined | null) => {
    if (!id) return 'bg-slate-400';
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const priorityColors = {
    [Priority.LOW]: 'bg-blue-100 text-blue-700',
    [Priority.MEDIUM]: 'bg-amber-100 text-amber-700',
    [Priority.HIGH]: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-scale-in border border-white/20">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 relative bg-white shrink-0">
          <div className="flex items-start gap-6 pr-24">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0 shadow-inner">
               <Layout size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <input
                className="w-full text-2xl font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0 mb-3"
                value={editedTask.title}
                onBlur={(e) => handleUpdate({ title: e.target.value })}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              />
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative group/priority">
                  <select
                    className={clsx(
                      "appearance-none bg-slate-50 border-none text-[11px] font-bold uppercase tracking-wider rounded-lg pl-3 pr-8 py-1.5 cursor-pointer focus:ring-2 focus:ring-primary-500/10 transition-all",
                      priorityColors[editedTask.priority]
                    )}
                    value={editedTask.priority}
                    onChange={(e) => handleUpdate({ priority: e.target.value as Priority })}
                  >
                    <option value={Priority.LOW}>Low Priority</option>
                    <option value={Priority.MEDIUM}>Medium Priority</option>
                    <option value={Priority.HIGH}>High Priority</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all relative">
                  <Clock size={13} className="text-slate-400" />
                  <span className="whitespace-nowrap">{editedTask.dueDate ? safeFormatDate(editedTask.dueDate, 'MMM d, yyyy') : 'No Due Date'}</span>
                  <input 
                    type="date"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    value={(() => {
                        if (!editedTask.dueDate) return '';
                        const d = new Date(editedTask.dueDate);
                        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
                    })()}
                    onChange={(e) => handleUpdate({ dueDate: e.target.value })}
                    onClick={(e) => (e.target as any).showPicker?.()}
                />
                </div>

                {/* Members Row */}
                <div className="flex items-center ml-2 border-l border-slate-200 pl-4 gap-3">
                  <div className="flex -space-x-1.5 min-w-0">
                    {editedTask.assigneeIds.map(id => (
                      <div 
                        key={id} 
                        className={clsx("w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-slate-100 cursor-pointer transition-transform hover:-translate-y-1 hover:z-10 group/avatar relative", getAvatarColor(id))}
                        onClick={() => handleToggleAssignee(id)}
                      >
                        {getMemberName(id).charAt(0).toUpperCase()}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded-md opacity-0 group-hover/avatar:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                            {getMemberName(id)}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                      className="w-8 h-8 rounded-full bg-slate-50 hover:bg-primary-100 text-slate-400 hover:text-primary-600 flex items-center justify-center transition-all border border-dashed border-slate-300"
                    >
                      <Plus size={16} />
                    </button>
                    {showAssignDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 z-[300] overflow-hidden animate-slide-up">
                        <div className="p-3 border-b border-slate-50 bg-slate-50/20">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign Member</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1.5">
                          {boardMembers.map(member => (
                            <button 
                              key={member.id}
                              onClick={() => { handleToggleAssignee(member.id); setShowAssignDropdown(false); }}
                              className={clsx(
                                "w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg transition-colors text-left group/item",
                                editedTask.assigneeIds.includes(member.id) && "bg-primary-50/50 text-primary-700"
                              )}
                            >
                              <div className={clsx("w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm", getAvatarColor(member.id))}>
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-semibold truncate flex-1">{member.name}</span>
                              {editedTask.assigneeIds.includes(member.id) && <div className="w-2 h-2 rounded-full bg-primary-500 shadow-sm shadow-primary-500/50" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 absolute right-8 top-8">
            <button 
              onClick={() => { if(confirm('Delete task?')) onDelete(task.id); }}
              className="p-2.5 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-xl transition-all shadow-sm bg-white border border-slate-100"
            >
              <Trash2 size={20} />
            </button>
            <button onClick={onClose} className="p-2.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all shadow-sm bg-white border border-slate-100">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
            {/* Left Content */}
            <div className="p-10 space-y-12 overflow-y-auto custom-scrollbar border-r border-slate-100">
              {/* Description */}
              <section>
                <div className="flex items-center gap-3 mb-6 text-slate-900">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <AlignLeft size={18} />
                  </div>
                  <h3 className="font-bold text-lg tracking-tight">Description</h3>
                </div>
                <div className="relative group overflow-hidden">
                    <textarea
                      className="w-full text-slate-600 leading-relaxed p-4 rounded-xl bg-slate-50/30 hover:bg-slate-50/80 border-2 border-transparent focus:border-primary-500/20 focus:bg-white focus:ring-0 transition-all resize-none text-[13px] font-medium min-h-[40px] focus:min-h-[120px]"
                      placeholder="Add a detailed description..."
                      rows={1}
                      value={editedTask.description}
                      onBlur={(e) => handleUpdate({ description: e.target.value })}
                      onChange={(e) => {
                          setEditedTask({ ...editedTask, description: e.target.value });
                          e.target.style.height = 'auto';
                          e.target.style.height = (e.target.scrollHeight) + 'px';
                      }}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.ctrlKey) {
                              e.preventDefault();
                              (e.target as HTMLTextAreaElement).blur();
                          }
                      }}
                    ></textarea>
                </div>
              </section>

              {/* Checklist */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3 text-slate-900">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <CheckSquare size={18} />
                    </div>
                    <h3 className="font-bold text-lg tracking-tight">Checklist</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 transition-all duration-500" style={{ width: `${editedTask.checklist.length ? (editedTask.checklist.filter(i => i.completed).length / editedTask.checklist.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                      {Math.round(editedTask.checklist.length ? (editedTask.checklist.filter(i => i.completed).length / editedTask.checklist.length) * 100 : 0)}%
                    </span>
                  </div>
                </div>
                
                <div className="max-h-[220px] overflow-y-auto custom-scrollbar pr-2 mb-6 transition-all">
                  <div className="space-y-1">
                    {editedTask.checklist.map(item => (
                      <div key={item.id} className="flex items-center gap-4 group p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all">
                        <button onClick={() => toggleChecklist(item.id)} className={clsx("w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shadow-sm", item.completed ? "bg-primary-500 border-primary-500 text-white" : "bg-white border-slate-200 hover:border-primary-400")}>
                          {item.completed && <ChevronRight size={12} className="rotate-90 stroke-[3px]" />}
                        </button>
                        <span className={clsx("flex-1 text-[13px] font-semibold truncate", item.completed ? "text-slate-300 line-through" : "text-slate-600")}>{item.title}</span>
                        <button onClick={() => handleUpdate({ checklist: editedTask.checklist.filter(i => i.id !== item.id) })} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {editedTask.checklist.length === 0 && (
                      <p className="text-center py-4 text-xs font-bold text-slate-300 uppercase tracking-widest bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No items yet</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input type="text" className="flex-1 h-11 px-4 text-xs font-semibold bg-slate-50/50 border-none rounded-xl focus:ring-0 focus:bg-white focus:border-slate-100 transition-all" placeholder="Add an item..." value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()} />
                  <button onClick={handleAddChecklist} className="h-11 px-6 bg-slate-900 text-white text-[11px] font-bold rounded-xl hover:bg-slate-800 transition-all">Add</button>
                </div>
              </section>

              {/* Attachments Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3 text-slate-900">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Paperclip size={18} />
                    </div>
                    <h3 className="font-bold text-lg tracking-tight">Attachments</h3>
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl cursor-pointer transition-all border border-slate-100 group">
                    {isUploading ? <Loader2 size={14} className="animate-spin text-primary-500" /> : <Plus size={14} className="group-hover:rotate-90 transition-transform" />}
                    <span className="text-[11px] font-bold">Upload</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   {attachments.map(att => (
                     <div key={att.id} className="group/att flex items-center gap-3 p-2 pr-3 border border-slate-100 rounded-xl hover:border-primary-200 transition-all bg-white shadow-sm hover:shadow-md">
                        <div 
                          className="w-12 h-12 bg-slate-50 rounded-lg relative overflow-hidden flex items-center justify-center shrink-0 border border-slate-50 cursor-pointer"
                          onClick={() => {
                            if (isImage(att.contentType)) setPreviewImage(att.url);
                            else handleDownloadFile(att.url, att.fileName);
                          }}
                        >
                           {isImage(att.contentType) ? (
                              <img src={att.url} alt="" className="w-full h-full object-cover" />
                           ) : (
                              <FileText size={20} className="text-slate-400" />
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[11px] font-bold text-slate-700 truncate">{att.fileName}</p>
                           <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{formatFileSize(att.size)}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/att:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDownloadFile(att.url, att.fileName); }}
                              className="p-1.5 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-lg transition-all"
                            >
                                <Download size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteAttachment(att.id)} 
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                     </div>
                   ))}
                   {attachments.length === 0 && !isUploading && (
                     <div className="col-span-2 py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-300">
                        <Paperclip size={24} className="mb-2 opacity-50" />
                        <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-50">No Attachments</p>
                     </div>
                   )}
                </div>
              </section>
            </div>

            {/* Right Content (Activity) */}
            <div className="bg-slate-50/50 flex flex-col h-full overflow-hidden">
               <div className="p-8 pb-4 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-900">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-500 border border-slate-100">
                      <MessageSquare size={18} />
                    </div>
                    <h4 className="text-lg font-bold tracking-tight">Activity Stream</h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-slate-100">
                    {comments.length} Updates
                  </span>
               </div>
               <div className="flex-1 overflow-y-auto px-8 space-y-6 custom-scrollbar py-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-4 group">
                        <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm", getAvatarColor(comment.authorId))}>
                            {(comment.authorName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-4 mb-1">
                                <span className="text-[13px] font-bold text-slate-800">{comment.authorName || 'Unknown User'}</span>
                                <span className="text-[10px] font-medium text-slate-400">{safeFormatDate(comment.createdAt, 'MMM d, h:mm a')}</span>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-slate-100 text-[13px] text-slate-600 leading-relaxed shadow-sm group-hover:shadow-md transition-all">
                                {comment.content}
                            </div>
                        </div>
                    </div>
                  ))}
               </div>
               <div className="p-8 bg-white border-t border-slate-100">
                  <form onSubmit={handleAddComment} className="relative group">
                    <textarea className="w-full bg-slate-50 border-none rounded-2xl p-4 pr-16 text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:ring-0 focus:bg-white focus:shadow-inner transition-all min-h-[60px] max-h-32 resize-none" placeholder="Write a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddComment(e))} />
                    <button type="submit" className="absolute right-3 bottom-3 p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                       <Send size={16} />
                    </button>
                  </form>
               </div>
            </div>
          </div>
        </div>

        {/* Lightbox (Images Only) */}
        {previewImage && (
          <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-12" onClick={() => setPreviewImage(null)}>
             <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-all"><X size={32} /></button>
             <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskModal;
