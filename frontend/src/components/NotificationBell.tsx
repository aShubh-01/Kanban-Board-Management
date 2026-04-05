import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, UserPlus, Info } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import api from '../api/client';
import { Notification } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/notifications/user/${user.id}`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (notif: Notification) => {
    try {
      await api.post(`/boards/accept-invite/${notif.id}`);
      setNotifications(notifications.map(n => n.id === notif.id ? { ...n, processed: true, read: true } : n));
      // Optionally trigger board refresh
      window.dispatchEvent(new Event('board-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-slide-up">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Notifications</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {notifications.length} Total
            </span>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                  <Bell size={20} />
                </div>
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={clsx(
                    "p-4 border-b border-slate-50 last:border-0 transition-colors",
                    !notif.read && "bg-primary-50/30"
                  )}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <div className="flex gap-3">
                    <div className={clsx(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      notif.type === 'INVITE' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                    )}>
                      {notif.type === 'INVITE' ? <UserPlus size={16} /> : <Info size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>

                      {notif.type === 'INVITE' && !notif.processed && (
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleAccept(notif); }}
                            className="flex-1 py-1.5 bg-primary-600 text-white text-[10px] font-bold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <Check size={12} /> Accept
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDecline(notif.id); }}
                            className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                          >
                            <X size={12} /> Decline
                          </button>
                        </div>
                      )}
                      
                      {notif.processed && (
                        <div className="mt-2 text-[10px] font-bold text-green-600 flex items-center gap-1">
                          <Check size={12} /> Joined
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
