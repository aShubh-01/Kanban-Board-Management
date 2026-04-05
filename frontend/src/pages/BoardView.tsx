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
    if (!newListTitle.trim()) return;
    try {
      const response = await api.post('/lists', { 
        boardId: id, 
        title: newListTitle, 
        position: lists.length 
      });
      dispatch(addList({ ...response.data, tasks: [] }));
      setNewListTitle('');
      setShowAddList(false);
    } catch (err) {}
  };

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
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{currentBoard.title}</h1>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1"><Calendar size={12} /> Last edited 2h ago</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-widest text-[9px]">Private Board</span>
                </p>
            </div>
        </div>

        <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
                <Search size={16} className="text-slate-400" />
                <input type="text" placeholder="Filter tasks..." className="bg-transparent text-sm focus:outline-none w-32 md:w-48" />
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
            <SortableContext items={lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
              {lists.map(list => (
                <ListColumn 
                  key={list.id} 
                  list={list} 
                  tasks={list.tasks || []} 
                  boardMembers={boardMembers}
                  onAddTask={handleAddTask}
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
    return activeId && lists.some(l => l.id === activeId);
  }
};

export default BoardView;
