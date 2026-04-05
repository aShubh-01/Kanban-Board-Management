import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Board, BoardList, Task, User } from '../types';
import api from '../api/client';
import ListColumn from '../components/ListColumn';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { 
  Users, Settings, Search, Plus, Loader2, ArrowLeft, 
  MoreHorizontal, Activity, Star, Calendar, Filter
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
    setCurrentBoard, 
    setLists, 
    addList, 
    updateList, 
    deleteList, 
    addTask, 
    updateTask, 
    deleteTask,
    moveTask,
    reorderLists
} from '../store/slices/boardSlice';
import _ from 'lodash';

const BoardView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentBoard, lists } = useSelector((state: RootState) => state.board);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeList, setActiveList] = useState<BoardList | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [showAddList, setShowAddList] = useState(false);
  const [addingList, setAddingList] = useState(false);
  const [isEditingBoard, setIsEditingBoard] = useState(false);
  const [editedBoardTitle, setEditedBoardTitle] = useState('');
  
  // Filters
  const [filterText, setFilterText] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NONE' | 'PRIORITY' | 'DATE'>('NONE');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [boardRes, listsRes, membersRes] = await Promise.all([
        api.get(`/boards/${id}`),
        api.get(`/lists/board/${id}`),
        api.get(`/boards/${id}/members`)
      ]);
      
      const listsWithTasks = await Promise.all(
        listsRes.data.map(async (list: BoardList) => {
          const tasksRes = await api.get(`/tasks/list/${list.id}`);
          return { ...list, tasks: tasksRes.data };
        })
      );

      dispatch(setCurrentBoard(boardRes.data));
      dispatch(setLists(listsWithTasks));
      setBoardMembers(membersRes.data);
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, dispatch, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    if (active.data.current?.type === 'Task') {
      setActiveTask(active.data.current.task);
    } else {
      setActiveList(active.data.current?.list);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';

    if (!isActiveATask) return;

    // Dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      const activeTask = active.data.current?.task;
      const overTask = over.data.current?.task;
      
      if (activeTask.listId !== overTask.listId) {
          // Logic for optimistic UI handled by dnd-kit usually, 
          // but we'll update state if we want real-time feel.
          // For now, let's focus on DragEnd.
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);
    setActiveList(null);

    if (!over) return;

    if (active.id === over.id) return;

    const isActiveAList = active.data.current?.type === 'List';

    if (isActiveAList) {
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === over.id);
      const newLists = arrayMove(lists, oldIndex, newIndex);
      dispatch(setLists(newLists));
      
      try {
        await api.post('/lists/reorder', newLists.map(l => l.id));
      } catch (err) {
        console.error('Failed to persist list order', err);
      }
      return;
    }

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAList = over.data.current?.type === 'List';

    if (isActiveATask && (isOverATask || isOverAList)) {
        const activeTask = active.data.current!.task;
        const targetListId = isOverATask ? (over.data.current!.task.listId) : (over.id as string);
        
        // Find destinations
        const sourceList = lists.find(l => l.id === activeTask.listId);
        const destList = lists.find(l => l.id === targetListId);
        
        if (sourceList && destList) {
            const oldIndex = sourceList.tasks!.findIndex(t => t.id === active.id);
            const newIndex = isOverATask ? destList.tasks!.findIndex(t => t.id === over.id) : destList.tasks!.length;
            
            dispatch(moveTask({ 
                taskId: active.id as string, 
                sourceListId: sourceList.id, 
                destListId: destList.id, 
                destIndex: newIndex 
            }));

            // Persist task move
            try {
                await api.put(`/tasks/${active.id}`, { ...activeTask, listId: destList.id, position: newIndex });
            } catch (err) {
                // Rollback if failure (simplified for now)
            }
        }
    }
  };

  const handleAddTask = async (listId: string, title: string) => {
    try {
      const response = await api.post('/tasks', { 
        listId, 
        title, 
        priority: 'LOW',
        position: lists.find(l => l.id === listId)?.tasks?.length || 0 
      });
      dispatch(addTask(response.data));
    } catch (err) {}
  };

  const handleUpdateTask = (task: Task) => {
    dispatch(updateTask(task));
    // Don't close modal here to allow continuous editing
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const task = lists.flatMap(l => l.tasks || []).find(t => t.id === taskId);
      if (!task) return;
      await api.delete(`/tasks/${taskId}`);
      dispatch(deleteTask({ taskId, listId: task.listId }));
      setSelectedTask(null);
    } catch (err) {}
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setInviting(true);
      await api.post(`/boards/${id}/invite`, { 
        email: inviteEmail, 
        senderName: currentUser?.name || 'Someone' 
      });
      setInviteEmail('');
      setShowInviteInput(false);
      alert('Invitation sent!');
    } catch (err) {
      alert('Failed to send invitation. Make sure the user exists.');
    } finally {
      setInviting(false);
    }
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || addingList) return;
    try {
      setAddingList(true);
      const response = await api.post('/lists', { 
        boardId: id, 
        title: newListTitle, 
        position: lists.length 
      });
      dispatch(addList({ ...response.data, tasks: [] }));
      setNewListTitle('');
      setShowAddList(false);
    } catch (err) {
      console.error('Failed to add list', err);
    } finally {
      setAddingList(false);
    }
  };

  const handleUpdateBoardTitle = async () => {
    if (!editedBoardTitle.trim() || editedBoardTitle === currentBoard.title) {
        setIsEditingBoard(false);
        return;
    }
    try {
        const response = await api.put(`/boards/${id}`, { ...currentBoard, title: editedBoardTitle });
        dispatch(setCurrentBoard(response.data));
        setIsEditingBoard(false);
    } catch (err) {
        console.error('Failed to update board title', err);
    }
  };

  const handleDeleteBoard = async () => {
    if (!window.confirm('Are you sure you want to delete this entire board? This action cannot be undone.')) return;
    try {
        await api.delete(`/boards/${id}`);
        navigate('/');
    } catch (err) {
        console.error('Failed to delete board', err);
    }
  };

  const handleUpdateListTitle = async (listId: string, newTitle: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list || list.title === newTitle) return;
    try {
        const response = await api.put(`/lists/${listId}`, { ...list, title: newTitle });
        dispatch(updateList(response.data));
    } catch (err) {
        console.error('Failed to update list title', err);
    }
  };

  const handleDeleteListImpl = async (listId: string) => {
    if (!window.confirm('Delete this list and all its tasks?')) return;
    try {
        await api.delete(`/lists/${listId}`);
        dispatch(deleteList(listId));
    } catch (err) {
        console.error('Failed to delete list', err);
    }
  };

  const filteredLists = lists.map(list => {
    let tasks = (list.tasks || []).filter(task => {
        const query = filterText.toLowerCase();
        const matchesText = 
            task.title.toLowerCase().includes(query) || 
            (task.description && task.description.toLowerCase().includes(query));
        
        const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
        const matchesAssignee = assigneeFilter === 'ALL' || task.assigneeIds.includes(assigneeFilter);
        return matchesText && matchesPriority && matchesAssignee;
    });

    if (sortBy === 'PRIORITY') {
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        tasks = [...tasks].sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);
    } else if (sortBy === 'DATE') {
        tasks = [...tasks].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }

    return { ...list, tasks };
  });

  if (loading || !currentBoard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="animate-spin text-primary-600" size={64} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      
      {/* Board Header */}
      <header className="px-6 py-4 glass border-b border-slate-200/50 flex items-center justify-between z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all">
                <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
                <div className="flex items-center gap-3">
                    {isEditingBoard ? (
                        <input
                            autoFocus
                            type="text"
                            className="text-xl font-extrabold text-slate-900 bg-slate-50 border-b-2 border-primary-500 focus:outline-none px-1 h-8 animate-fade-in"
                            value={editedBoardTitle}
                            onChange={(e) => setEditedBoardTitle(e.target.value)}
                            onBlur={handleUpdateBoardTitle}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateBoardTitle();
                                if (e.key === 'Escape') setIsEditingBoard(false);
                            }}
                        />
                    ) : (
                        <h1 
                            className="text-xl font-extrabold text-slate-900 tracking-tight hover:bg-slate-100 px-1 rounded cursor-pointer transition-colors"
                            onClick={() => {
                                if (currentBoard) {
                                    setEditedBoardTitle(currentBoard.title);
                                    setIsEditingBoard(true);
                                }
                            }}
                        >
                            {currentBoard?.title}
                        </h1>
                    )}
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1"><Calendar size={12} /> Last edited recently</span>
                    <span>•</span>
                    <button 
                        onClick={handleDeleteBoard}
                        className="text-red-400 hover:text-red-600 transition-colors"
                    >
                        Delete Board
                    </button>
                </p>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/80 border border-slate-200/50 shadow-inner group focus-within:bg-white focus-within:ring-2 ring-primary-100 transition-all">
                <Search size={18} className="text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search tasks, descriptions..." 
                    className="bg-transparent text-sm font-medium focus:outline-none w-48 md:w-64 placeholder:text-slate-400" 
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-1 overflow-hidden rounded-full border border-slate-200 shadow-sm h-9">
                <select 
                    className="text-[11px] font-bold bg-white text-slate-600 outline-none px-2 h-full border-r border-slate-100 hover:bg-slate-50 transition-colors"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                >
                    <option value="ALL">ALL PRIORITY</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                </select>
                <select 
                    className="text-[11px] font-bold bg-white text-slate-600 outline-none px-2 h-full border-r border-slate-100 hover:bg-slate-50 transition-colors max-w-[120px]"
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                >
                    <option value="ALL">ALL MEMBERS</option>
                    {boardMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
                    ))}
                </select>
                <select 
                    className="text-[11px] font-bold bg-white text-slate-600 outline-none px-2 h-full hover:bg-slate-50 transition-colors"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                >
                    <option value="NONE">NO SORT</option>
                    <option value="PRIORITY">BY PRIORITY</option>
                    <option value="DATE">BY DATE</option>
                </select>
            </div>

            <div className="flex items-center -space-x-2">
                {boardMembers.map((member) => (
                    <div key={member.id} className={clsx("w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-md transition-transform hover:scale-110 hover:z-10", getAvatarColor(member.id))} title={member.name}>
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                ))}
                <div className="relative">
                  <button 
                    onClick={() => setShowInviteInput(!showInviteInput)}
                    className="w-9 h-9 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all shadow-sm"
                  >
                      <Plus size={18} />
                  </button>
                  
                  {showInviteInput && (
                    <div className="absolute right-0 mt-2 w-64 bg-white p-4 rounded-xl shadow-xl border border-slate-100 z-50 animate-slide-up">
                      <h4 className="text-sm font-bold text-slate-800 mb-2">Invite Member</h4>
                      <form onSubmit={handleInvite}>
                        <input 
                          type="email" 
                          required
                          placeholder="user@example.com" 
                          className="input h-9 text-xs mb-2"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <button 
                          type="submit" 
                          disabled={inviting}
                          className="btn btn-primary w-full h-8 text-[10px] font-bold"
                        >
                          {inviting ? 'Sending...' : 'Send Invite'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 mx-1" />

            <div className="flex items-center gap-2">
            </div>
        </div>
      </header>

      {/* Board Content */}
      <div className="flex-1 overflow-x-auto p-6 md:p-8 bg-slate-50/50">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-start gap-6 h-full min-w-max pb-4">
            <SortableContext items={filteredLists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
              {filteredLists.map(list => (
                <ListColumn 
                  key={list.id} 
                  list={list} 
                  tasks={list.tasks || []} 
                  boardMembers={boardMembers}
                  onAddTask={handleAddTask}
                  onUpdateTitle={(newTitle) => handleUpdateListTitle(list.id, newTitle)}
                  onDelete={() => handleDeleteListImpl(list.id)}
                  onTaskClick={(task) => setSelectedTask(task)}
                />
              ))}
            </SortableContext>

            {/* Add List Placeholder */}
            {showAddList ? (
              <div className="w-[320px] shrink-0 bg-white p-4 rounded-2xl shadow-xl border border-primary-100 animate-slide-up h-fit">
                <form onSubmit={handleAddList}>
                  <input
                    autoFocus
                    type="text"
                    className="input h-10 text-sm mb-3"
                    placeholder="List title..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary text-xs py-1.5 flex-1">Add List</button>
                    <button onClick={() => setShowAddList(false)} className="btn btn-secondary text-xs py-1.5 px-3 uppercase font-bold tracking-wider">Cancel</button>
                  </div>
                </form>
              </div>
            ) : (
              <button 
                onClick={() => setShowAddList(true)}
                className="w-[320px] shrink-0 h-14 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50/30 hover:border-primary-200 transition-all duration-300 font-bold group"
              >
                <div className="bg-slate-50 p-1.5 rounded-lg group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                    <Plus size={20} />
                </div>
                <span>Create New Column</span>
              </button>
            )}
            
            {/* Horizontal Spacer */}
            <div className="w-12 h-1 shrink-0" />
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
                styles: {
                    active: {
                        opacity: '0.5',
                    },
                },
            }),
          }}>
            {activeId ? (
              isActiveList() ? (
                <ListColumn 
                  list={activeList!} 
                  tasks={activeList!.tasks || []} 
                  boardMembers={boardMembers}
                  onAddTask={() => {}} 
                  onUpdateTitle={() => {}}
                  onDelete={() => {}}
                  onTaskClick={() => {}} 
                />
              ) : (
                <TaskCard task={activeTask!} boardMembers={boardMembers} onClick={() => {}} />
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedTask && (
        <TaskModal 
          task={selectedTask} 
          boardMembers={boardMembers}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );

  function isActiveList() {
    return activeId && filteredLists.some(l => l.id === activeId);
  }
};

export default BoardView;
