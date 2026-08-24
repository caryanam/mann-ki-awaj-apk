import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import io from 'socket.io-client/dist/socket.io.js';
import { apiService } from '../services/apiService';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

const ChatContext = createContext(null);

const INITIAL_CONVERSATIONS = [];

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const socketRef = useRef(null);
  const moodCallbacks = useRef([]);

  const refreshConversations = async () => {
    if (currentUser) {
      const rooms = await apiService.getConversations();
      setConversations(rooms);
    }
  };

  useEffect(() => {
    async function loadRooms() {
      if (currentUser) {
        const rooms = await apiService.getConversations();
        setConversations(rooms);
      } else {
        setConversations([]);
      }
    }
    loadRooms();
  }, [currentUser, currentLanguage]);

  // Socket.IO real-time connection and message listeners
  useEffect(() => {
    if (!currentUser) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to Socket.IO server on production URL
    const socket = io('https://socketapi.awaazmanki.com', {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    const sendHeartbeat = () => {
      if (socket && socket.connected && currentUser?.username) {
        socket.emit('heartbeat', {
          username: currentUser.username,
        });
      }
    };

    socket.on('connect', () => {
      console.log('[Socket] Connected as', currentUser.username || currentUser.email);
      if (currentUser?.id) {
        socket.emit('join_user_room', String(currentUser.id));
        sendHeartbeat();
      }
    });

    socket.on('receive_message', async (msg) => {
      console.log('[Socket] Received message:', msg);
      if (msg && msg.roomId) {
        const roomIdStr = String(msg.roomId);
        try {
          const msgs = await apiService.getMessages(roomIdStr);
          const rooms = await apiService.getConversations();
          setConversations(prev => {
            return rooms.map(room => {
              if (room.id === roomIdStr) {
                return { ...room, messages: msgs };
              }
              const existingRoom = prev.find(r => r.id === room.id);
              return {
                ...room,
                messages: existingRoom ? existingRoom.messages : (room.messages || []),
              };
            });
          });
        } catch (err) {
          console.warn('[Socket] Failed to process message fetch:', err.message);
        }
      }
    });

    socket.on('room_status_change', async (updatedRoom) => {
      console.log('[Socket] Room status changed:', updatedRoom);
      try {
        const rooms = await apiService.getConversations();
        setConversations(prev => {
          return rooms.map(room => {
            const existingRoom = prev.find(r => r.id === room.id);
            return {
              ...room,
              messages: existingRoom ? existingRoom.messages : (room.messages || []),
            };
          });
        });
      } catch (err) {
        console.warn('[Socket] Failed to process room status refresh:', err.message);
      }
    });

    socket.on('user_presence_changed', (presence) => {
      console.log('[Socket] Presence changed:', presence);
      if (presence && presence.username) {
        const cleanKey = presence.username.toLowerCase().replace('@', '');
        setOnlineUsers((prev) => ({
          ...prev,
          [cleanKey]: {
            isOnline: Boolean(presence.isOnline || presence.status === 'ONLINE'),
            lastSeen: presence.lastSeen || new Date().toISOString(),
            status: presence.status || (presence.isOnline ? 'ONLINE' : 'OFFLINE'),
          },
        }));
      }
    });

    socket.on('mood_updated', () => {
      console.log('[Socket] Mood updated event received');
      moodCallbacks.current.forEach(cb => {
        try {
          cb();
        } catch (e) {
          console.warn('[Socket] Mood callback failed:', e);
        }
      });
    });

    const heartbeatInterval = setInterval(sendHeartbeat, 25000);

    return () => {
      clearInterval(heartbeatInterval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser]);

  // Join/leave room rooms via socket
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeRoomId || String(activeRoomId).startsWith('convo_') || String(activeRoomId).startsWith('mock_')) {return;}

    console.log('[Socket] Joining room:', activeRoomId);
    socket.emit('join_room', String(activeRoomId));

    return () => {
      console.log('[Socket] Leaving room:', activeRoomId);
      socket.emit('leave_room', String(activeRoomId));
    };
  }, [activeRoomId]);

  const fetchMessagesForRoom = async (roomId) => {
    if (!roomId || String(roomId).startsWith('convo_') || String(roomId).startsWith('mock_')) {return;}
    const msgs = await apiService.getMessages(roomId);
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== String(roomId)) {return c;}
        return {
          ...c,
          messages: msgs,
        };
      })
    );
  };

  const sendMessage = async (convoId, text) => {
    if (!text.trim()) {return;}

    try {
      // 1. Try real backend chat send
      if (convoId && !String(convoId).startsWith('convo_') && !String(convoId).startsWith('mock_')) {
        const apiMsg = await apiService.sendChatMessage(convoId, text);
        setConversations(prev =>
          prev.map(c => {
            if (c.id !== convoId) {return c;}
            return {
              ...c,
              lastMessage: text.trim(),
              lastMessageTime: new Date().toISOString(),
              messages: [...(c.messages || []), apiMsg],
            };
          })
        );
        return;
      }
    } catch (err) {
      console.warn('[ChatContext] Failed to send chat to backend:', err.message);
    }

    // Mock Fallback
    const newMessage = {
      id: `msg_${Date.now()}`,
      sender: 'me',
      text: text.trim(),
      time: new Date().toISOString(),
    };

    setConversations(prev =>
      prev.map(c => {
        if (c.id !== convoId) {return c;}
        return {
          ...c,
          lastMessage: text.trim(),
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          messages: [...(c.messages || []), newMessage],
        };
      })
    );

    // Simulate auto-reply after 2.5 seconds for mock conversations
    setTimeout(() => {
      setConversations(current => {
        const activeConvo = current.find(c => c.id === convoId);
        if (!activeConvo) {return current;}

        const partnerName = activeConvo.username;
        const autoReply = {
          id: `msg_${Date.now() + 1}`,
          sender: partnerName,
          text: `Thank you for your message! This is an automated thought response from ${partnerName} on Mann Ki Aawaj.`,
          time: new Date().toISOString(),
        };

        return current.map(c => {
          if (c.id !== convoId) {return c;}
          return {
            ...c,
            lastMessage: autoReply.text,
            lastMessageTime: autoReply.time,
            messages: [...(c.messages || []), autoReply],
          };
        });
      });
    }, 2500);
  };

  const startNewConversation = async (username, authorId, initials, color) => {
    if (!authorId) {
      // Fallback if ID is missing (for mock posts)
      const mockId = `mock_${Date.now()}`;
      const newMockConvo = {
        id: mockId,
        username: username,
        avatarInitials: initials || username.replace('@', '').slice(0, 2).toUpperCase(),
        avatarColor: color || '#6F405F',
        lastMessage: 'Conversation started.',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        messages: [],
      };
      setConversations(prev => [newMockConvo, ...prev]);
      return mockId;
    }

    try {
      const newRoom = await apiService.startConversation(authorId);
      setConversations(prev => {
        const existing = prev.find(c => c.id === newRoom.id);
        if (existing) {return prev;}
        return [newRoom, ...prev];
      });
      return newRoom.id;
    } catch (err) {
      console.warn('[ChatContext] Failed to start conversation on backend:', err.message);
      // Fallback mock
      const newId = `convo_${Date.now()}`;
      const newConvo = {
        id: newId,
        username: username,
        avatarInitials: initials || username.replace('@', '').slice(0, 2).toUpperCase(),
        avatarColor: color || '#6F405F',
        lastMessage: 'Conversation started.',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        messages: [],
      };
      setConversations(prev => [newConvo, ...prev]);
      return newId;
    }
  };

  const acceptChatRequest = async (roomId) => {
    try {
      if (roomId && !String(roomId).startsWith('convo_') && !String(roomId).startsWith('mock_')) {
        const updatedRoom = await apiService.acceptChatRequest(roomId);
        setConversations(prev =>
          prev.map(c => (c.id === roomId ? { ...c, requestStatus: 'ACCEPTED' } : c))
        );
        fetchMessagesForRoom(roomId);
        return updatedRoom;
      }
    } catch (err) {
      console.warn('[ChatContext] Failed to accept chat request on backend:', err.message);
    }
    // Fallback Mock
    setConversations(prev =>
      prev.map(c => (c.id === roomId ? { ...c, requestStatus: 'ACCEPTED' } : c))
    );
  };

  const declineChatRequest = async (roomId) => {
    try {
      if (roomId && !String(roomId).startsWith('convo_') && !String(roomId).startsWith('mock_')) {
        await apiService.declineChatRequest(roomId);
        setConversations(prev => prev.filter(c => c.id !== roomId));
        if (activeRoomId === roomId) {
          setActiveRoomId(null);
        }
        return;
      }
    } catch (err) {
      console.warn('[ChatContext] Failed to decline chat request on backend:', err.message);
    }
    // Fallback Mock
    setConversations(prev => prev.filter(c => c.id !== roomId));
    if (activeRoomId === roomId) {
      setActiveRoomId(null);
    }
  };

  const getUserPresence = (username) => {
    if (!username) return { isOnline: false, statusText: 'Offline' };
    const cleanU = username.trim().toLowerCase().replace('@', '');
    const entry = onlineUsers[cleanU] || onlineUsers[`@${cleanU}`];
    if (entry) {
      return {
        isOnline: entry.isOnline,
        statusText: entry.isOnline ? 'Online' : 'Offline',
      };
    }
    // Fallback: Deterministic hashing match
    const hash = cleanU.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const isOnline = hash % 2 === 0;
    return {
      isOnline,
      statusText: isOnline ? 'Online' : 'Offline',
    };
  };

  const markAsRead = (convoId) => {
    setConversations(prev =>
      prev.map(c => (c.id === convoId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const registerMoodCallback = (cb) => {
    moodCallbacks.current.push(cb);
    return () => {
      moodCallbacks.current = moodCallbacks.current.filter(c => c !== cb);
    };
  };

  const broadcastMoodUpdate = () => {
    if (socketRef.current) {
      socketRef.current.emit('mood_updated');
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        sendMessage,
        startNewConversation,
        markAsRead,
        fetchMessagesForRoom,
        activeRoomId,
        setActiveRoomId,
        refreshConversations,
        acceptChatRequest,
        declineChatRequest,
        onlineUsers,
        getUserPresence,
        registerMoodCallback,
        broadcastMoodUpdate,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
