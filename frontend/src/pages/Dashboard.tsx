import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Board as BoardType } from '../types';
import { Plus, Layout, Users, Clock, ArrowRight, Loader2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { clsx } from 'clsx';

const Dashboard: React.FC = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [boards, setBoards] = useState<BoardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await api.get('/boards');
      setBoards(response.data);
    } catch (err) {
      setError('Failed to load boards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoard.title.trim()) return;

    try {
      const response = await api.post('/boards', newBoard);
      setBoards([...boards, response.data]);
      setShowCreateModal(false);
      setNewBoard({ title: '', description: '' });
    } catch (err) {
      alert('Failed to create board');
    }
  };

  const filteredBoards = boards.filter((b) =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myBoards = filteredBoards.filter(b => b.ownerId === currentUser?.id);
  const collabBoards = filteredBoards.filter(b => b.ownerId !== currentUser?.id);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-primary-600" size={48} />
        <p className="text-slate-500 font-medium">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Your Boards</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage and track your team's progress</p>
        </div>

        <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search boards..."
              className="input pl-10 w-64 md:w-80 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2 h-11"
          >
            <Plus size={20} />
            <span>New Board</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-600" />
          {error}
        </div>
      )}

      {filteredBoards.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 animate-fade-in shadow-inner">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Layout size={40} className="text-slate-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">No boards found</h2>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            {searchTerm ? "Try searching for something else or create a new board to get started." : "Create your first board to start managing your team's tasks effectively."}
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary mt-8 inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Create Board
          </button>
        </div>
      ) : (
        <div className="space-y-16">
          {/* My Boards */}
          {myBoards.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
                  <Layout size={18} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">My Boards</h2>
                <div className="flex-1 h-[1px] bg-slate-100 ml-4" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {myBoards.map((board, idx) => (
                  <BoardCard key={board.id} board={board} idx={idx} getAvatarColor={getAvatarColor}/>
                ))}
              </div>
            </section>
          )}

          {/* Collaborative Boards */}
          {collabBoards.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Users size={18} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Shared with Me</h2>
                <div className="flex-1 h-[1px] bg-slate-100 ml-4" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {collabBoards.map((board, idx) => (
                  <BoardCard key={board.id} board={board} idx={idx} getAvatarColor={getAvatarColor}/>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Create Board Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-slide-up relative">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
               <div className="bg-primary-100 p-2 rounded-lg text-primary-600"><Plus size={24} /></div>
               Create New Board
            </h2>
            <form onSubmit={handleCreateBoard} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Board Title</label>
                <input 
                  autoFocus
                  type="text" 
                  className="input h-12 text-lg font-medium"
                  placeholder="e.g., Marketing Campaign" 
                  value={newBoard.title}
                  onChange={(e) => setNewBoard({...newBoard, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description <span className="text-slate-400 font-normal italic">(optional)</span></label>
                <textarea 
                  className="input min-h-[120px] py-3 resize-none"
                  placeholder="What is this board about?"
                  value={newBoard.description}
                  onChange={(e) => setNewBoard({...newBoard, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary flex-1 h-12"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1 h-12"
                >
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const BoardCard = ({ board, idx, getAvatarColor }: { board: BoardType, idx: number, getAvatarColor: (id: string) => string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.05 }}
  >
    <Link to={`/board/${board.id}`} className="group block h-full">
      <article className="card p-6 h-full hover:shadow-xl hover:border-primary-200 transition-all duration-300 transform group-hover:-translate-y-1 relative overflow-hidden flex flex-col">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500 opacity-50" />
        
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="bg-primary-100 p-2.5 rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
            <Layout size={24} />
          </div>
          <div className="flex -space-x-2">
              {[board.ownerId, ...board.memberIds].slice(0, 3).map((id) => (
                <div key={id} className={clsx("w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-slate-100", getAvatarColor(id))}>
                  {id.charAt(0).toUpperCase()}
                </div>
              ))}
              {board.memberIds.length + 1 > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                  +{board.memberIds.length + 1 - 3}
                </div>
              )}
          </div>
        </div>

        <div className="relative z-10 flex-1">
          <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary-700 transition-colors leading-tight">{board.title}</h3>
          <p className="text-slate-500 mt-2 text-sm line-clamp-2 leading-relaxed">
            {board.description || "No description provided. Click to add details and manage tasks."}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Users size={14} /> {board.memberIds.length + 1} Members</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> Recently active</span>
          </div>
          <div className="text-primary-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <ArrowRight size={20} />
          </div>
        </div>
      </article>
    </Link>
  </motion.div>
);

export default Dashboard;
