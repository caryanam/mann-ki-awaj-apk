import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { mapNotification } from '../services/apiMappers';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const { currentUser } = useAuth();

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    try {
      const response = await apiService.getNotifications();
      // Safe mapping handling array format directly
      const rawContent = Array.isArray(response?.content) ? response.content : (Array.isArray(response) ? response : []);
      setNotifications(rawContent.map(mapNotification));
    } catch (err) {
      console.warn('[NotificationContext] Failed to load notifications:', err.message);
      setNotifications([]);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshNotifications();
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const timer = setInterval(() => {
      refreshNotifications();
    }, 6000);
    return () => clearInterval(timer);
  }, [refreshNotifications]);

  const markAsRead = async (id) => {
    try {
      await apiService.markNotificationAsRead(id);
      await refreshNotifications();
    } catch (err) {
      console.warn('[NotificationContext] Failed to mark as read:', err.message);
      // Local fallback
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    try {
      await apiService.markAllNotificationsAsRead();
      await refreshNotifications();
    } catch (err) {
      console.warn('[NotificationContext] Failed to mark all as read:', err.message);
      // Local fallback
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    }
  };

  const deleteNotification = async (id) => {
    try {
      await apiService.deleteNotification(id);
      await refreshNotifications();
    } catch (err) {
      console.warn('[NotificationContext] Failed to delete notification:', err.message);
      // Local fallback
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
