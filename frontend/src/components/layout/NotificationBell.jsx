import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle, MoreVertical, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${import.meta.env.VITE_API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Fail to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${import.meta.env.VITE_API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Fail to mark all as read", err);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "success": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "error": return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300 ${isOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? "animate-swing" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full text-[8px] font-black text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl shadow-indigo-500/10 border border-indigo-50 overflow-hidden z-50"
          >
            <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter italic">Alert Center</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{unreadCount} Unread Notifications</p>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm"
                >
                  <Check className="w-3 h-3" /> Mark All Read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Bell className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">All caught up!</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n._id} 
                    onClick={() => !n.isRead && markAsRead(n._id)}
                    className={`p-4 border-b border-gray-50 flex gap-4 transition-all hover:bg-indigo-50/30 cursor-pointer ${!n.isRead ? "bg-white" : "opacity-60"}`}
                  >
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${!n.isRead ? "bg-white shadow-md border border-gray-100" : "bg-gray-100"}`}>
                      {getTypeIcon(n.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-black tracking-tight ${!n.isRead ? "text-gray-900" : "text-gray-500"}`}>{n.title}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <p className="text-[10px] font-medium text-gray-500 leading-relaxed uppercase tracking-tight">{n.message}</p>
                      {!n.isRead && (
                        <div className="pt-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">New Update</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-gray-50/50 text-center">
               <button className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-gray-600 transition-colors">
                  View Business History
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes swing {
          0%, 100% { transform: rotate(0); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
        }
        .animate-swing {
          animation: swing 1s ease-in-out infinite;
          transform-origin: top center;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
