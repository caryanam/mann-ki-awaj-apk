import { toBackendTopic, toBackendPostType } from './enumMappers';
import { mapPost, mapComment } from './apiMappers';
import { localStorage } from './localStorage';

const API_BASE_URL = 'https://api.awaazmanki.com';

// Helper to make fetch requests with auth headers from mocked localStorage
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  // Try to parse JSON data
  let data = null;
  try {
    data = await response.json();
  } catch (e) {}

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP Error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export const apiService = {
  setToken(token) {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('user_profile');
    }
  },

  // Auth Operations
  async login(email, password) {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res && res.success && res.data?.token) {
      localStorage.setItem('auth_token', res.data.token);
      localStorage.setItem('auth_user', JSON.stringify(res.data));

      const user = {
        id: res.data.id,
        fullName: res.data.fullName,
        email: res.data.email,
        role: res.data.role || 'ROLE_USER',
        username: `@${email.split('@')[0]}`,
        avatarInitials: (res.data.fullName || res.data.username || email.split('@')[0] || 'AN').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        avatarColor: '#6F405F',
        token: res.data.token,
      };
      return { success: true, data: user, token: res.data.token };
    }
    throw new Error(res?.message || 'Login failed');
  },

  async register(fullName, email, mobileNumber, password) {
    const payload = {
      fullName,
      email,
      mobileNumber,
      password,
    };
    return await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async verifyEmail(email, otp) {
    return await request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  async verifyMobile(mobileNumber, otp) {
    return await request('/api/auth/verify-mobile', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber, otp }),
    });
  },

  async resendEmailOtp(email) {
    return await request('/api/auth/resend-email-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resendMobileOtp(mobileNumber) {
    return await request('/api/auth/resend-mobile-otp', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber }),
    });
  },

  async forgotPassword(identifier) {
    return await request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
  },

  async verifyForgotPasswordOtp(identifier, otp) {
    return await request('/api/auth/verify-forgot-password-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp }),
    });
  },

  async resetPassword(identifier, otp, newPassword) {
    return await request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp, newPassword }),
    });
  },

  async getMyProfile() {
    const res = await request('/api/profile/me');
    return res?.data || res;
  },

  async createProfile(profileData) {
    const cleanData = {
      ...profileData,
      username: profileData?.username ? (profileData.username.startsWith('@') ? profileData.username.slice(1) : profileData.username) : profileData?.username,
    };
    const res = await request('/api/profile', {
      method: 'POST',
      body: JSON.stringify(cleanData),
    });
    return res?.data || res;
  },

  async updateProfile(profileData) {
    const cleanData = {
      ...profileData,
      username: profileData?.username ? (profileData.username.startsWith('@') ? profileData.username.slice(1) : profileData.username) : profileData?.username,
    };
    const res = await request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(cleanData),
    });
    return res?.data || res;
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_profile');
  },
  async getPosts() {
    try {
      const res = await request('/api/posts?page=0&size=20&sortBy=createdAt&direction=desc');
      const rawContent = res?.data?.content || res?.content || res?.data || [];
      if (Array.isArray(rawContent)) {
        return rawContent.map(mapPost);
      }
      return [];
    } catch (err) {
      console.warn('[apiService] Failed to fetch posts from backend:', err.message);
      return null;
    }
  },

  async createPost(postData) {
    const payload = {
      title: postData.title || '',
      content: postData.content,
      topic: toBackendTopic(postData.topic),
      type: toBackendPostType(postData.postType || 'Thought', !!postData.imageUrl),
      originalLanguage: 'EN',
      imageUrl: postData.imageUrl || null,
      allowComments: postData.allowComments !== undefined ? postData.allowComments : true,
    };
    const res = await request('/api/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.success ? mapPost(res.data || res) : null;
  },

  async reactToPost(postId, reactionType) {
    // Spring Boot supports react
    return await request(`/api/posts/${postId}/react`, {
      method: 'POST',
      body: JSON.stringify({ reactionType: reactionType.toUpperCase() }),
    });
  },

  async removePostReaction(postId) {
    return await request(`/api/posts/${postId}/react`, {
      method: 'DELETE',
    });
  },

  // Comment Operations
  async getComments(postId) {
    try {
      const res = await request(`/api/posts/${postId}/comments?page=0&size=20`);
      const rawContent = res?.data?.content || res?.content || res?.data || [];
      if (Array.isArray(rawContent)) {
        return rawContent.map(mapComment);
      }
      return [];
    } catch (err) {
      console.warn('[apiService] Failed to fetch comments:', err.message);
      return null;
    }
  },

  async addComment(postId, content) {
    const res = await request(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, originalLanguage: 'EN' }),
    });
    return res?.success ? mapComment(res.data || res) : null;
  },

  // Admin / Moderation Operations
  async getReports() {
    try {
      const res = await request('/api/admin/reports?page=0&size=20');
      const rawContent = res?.data?.content || res?.content || res?.data || [];
      if (Array.isArray(rawContent)) {
        return rawContent.map(r => ({
          id: String(r.id),
          postId: String(r.postId),
          contentType: r.contentType || 'POST',
          reportedContent: r.reportedContent || '',
          authorUsername: r.authorUsername || '@anonymous',
          reason: r.reason || 'Flagged Content',
          reporterNotes: r.reporterNotes || '',
          status: r.status || 'PENDING',
          actionTaken: r.actionTaken || null,
          adminNotes: r.adminNotes || '',
        }));
      }
      return [];
    } catch (err) {
      console.warn('[apiService] Failed to fetch admin reports:', err.message);
      return null;
    }
  },

  async resolveReport(reportId) {
    return await request(`/api/admin/reports/${reportId}/resolve`, {
      method: 'PUT',
    });
  },

  async rejectReport(reportId) {
    return await request(`/api/admin/reports/${reportId}/reject`, {
      method: 'PUT',
    });
  },

  async updatePostStatus(postId, status) {
    return await request(`/api/admin/posts/${postId}/status?status=${status}`, {
      method: 'PUT',
    });
  },

  // Chat Operations
  async getConversations() {
    try {
      const res = await request('/api/chat/rooms');
      const apiRooms = res?.data || res || [];
      return apiRooms.map(room => {
        const otherUsername = room.otherParticipantUsername ?
          (room.otherParticipantUsername.startsWith('@') ? room.otherParticipantUsername : `@${room.otherParticipantUsername}`) :
          '@user';

        const requestSender = room.requestSenderId === room.participant1Id
          ? room.participant1Username
          : (room.requestSenderId === room.participant2Id ? room.participant2Username : null);

        return {
          id: String(room.id),
          username: otherUsername,
          avatarInitials: otherUsername.replace('@', '').slice(0, 2).toUpperCase(),
          avatarColor: '#6F405F',
          lastMessage: room.lastMessage?.content || 'Chat room active',
          lastMessageTime: room.updatedAt || new Date().toISOString(),
          unreadCount: room.requestStatus === 'PENDING' ? 1 : 0,
          requestStatus: room.requestStatus || 'ACCEPTED',
          requestSenderId: room.requestSenderId,
          requestSender: requestSender,
          otherParticipantId: room.otherParticipantId,
          messages: [],
        };
      });
    } catch (err) {
      console.warn('[apiService] Failed to fetch conversations:', err.message);
      return [];
    }
  },

  async getMessages(roomId) {
    try {
      const res = await request(`/api/chat/messages/${roomId}`);
      const pageData = res?.data || res;
      const list = Array.isArray(pageData?.content) ? pageData.content : (Array.isArray(pageData) ? pageData : []);

      const stored = localStorage.getItem('auth_user');
      let myId = null;
      if (stored) {
        try { myId = JSON.parse(stored).id; } catch (e) {}
      }

      // Sort oldest to newest for UI
      return [...list].reverse().map(msg => ({
        id: String(msg.id),
        sender: (myId && Number(msg.senderId) === Number(myId)) ? 'me' : (msg.senderUsername || 'them'),
        text: msg.content,
        time: msg.createdAt || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn(`[apiService] Failed to fetch messages for room ${roomId}:`, err.message);
      return [];
    }
  },

  async startConversation(targetUserId) {
    const res = await request(`/api/chat/rooms/private/${targetUserId}`, {
      method: 'POST',
    });
    const room = res?.data || res;
    const otherUsername = room.otherParticipantUsername ?
      (room.otherParticipantUsername.startsWith('@') ? room.otherParticipantUsername : `@${room.otherParticipantUsername}`) :
      '@user';

    const requestSender = room.requestSenderId === room.participant1Id
      ? room.participant1Username
      : (room.requestSenderId === room.participant2Id ? room.participant2Username : null);

    return {
      id: String(room.id),
      username: otherUsername,
      avatarInitials: otherUsername.replace('@', '').slice(0, 2).toUpperCase(),
      avatarColor: '#6F405F',
      lastMessage: room.lastMessage?.content || 'Chat room active',
      lastMessageTime: room.updatedAt || new Date().toISOString(),
      unreadCount: 0,
      requestStatus: room.requestStatus || 'ACCEPTED',
      requestSenderId: room.requestSenderId,
      requestSender: requestSender,
      otherParticipantId: room.otherParticipantId,
      messages: [],
    };
  },

  async sendChatMessage(roomId, content) {
    const res = await request('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ roomId: Number(roomId), content }),
    });
    const msg = res?.data || res;
    return {
      id: String(msg.id),
      sender: 'me',
      text: msg.content,
      time: msg.createdAt || new Date().toISOString(),
    };
  },

  async acceptChatRequest(roomId) {
    try {
      const res = await request(`/api/chat/rooms/${roomId}/accept`, {
        method: 'PUT',
      });
      const room = res?.data || res;
      const otherUsername = room.otherParticipantUsername ?
        (room.otherParticipantUsername.startsWith('@') ? room.otherParticipantUsername : `@${room.otherParticipantUsername}`) :
        '@user';
      return {
        id: String(room.id),
        username: otherUsername,
        avatarInitials: otherUsername.replace('@', '').slice(0, 2).toUpperCase(),
        avatarColor: '#6F405F',
        lastMessage: room.lastMessage?.content || 'Chat request accepted',
        lastMessageTime: room.updatedAt || new Date().toISOString(),
        unreadCount: 0,
        requestStatus: room.requestStatus || 'ACCEPTED',
        requestSenderId: room.requestSenderId,
        requestSender: null,
        otherParticipantId: room.otherParticipantId,
        messages: [],
      };
    } catch (err) {
      console.warn(`[apiService] acceptChatRequest failed for room ${roomId}:`, err.message);
      return { success: true };
    }
  },

  async declineChatRequest(roomId) {
    try {
      return await request(`/api/chat/rooms/${roomId}/reject`, {
        method: 'PUT',
      });
    } catch (err) {
      console.warn(`[apiService] declineChatRequest failed for room ${roomId}:`, err.message);
      return { success: true };
    }
  },

  // ── NEW EXTENDED ENDPOINTS: COMMENTS ACTIONS ──
  async likeComment(commentId) {
    return await request(`/api/comments/${commentId}/like`, {
      method: 'POST',
    });
  },

  async unlikeComment(commentId) {
    return await request(`/api/comments/${commentId}/like`, {
      method: 'DELETE',
    });
  },

  async reactToComment(commentId, reactionType) {
    return await request(`/api/comments/${commentId}/react`, {
      method: 'POST',
      body: JSON.stringify({ reactionType: reactionType.toUpperCase() }),
    });
  },

  async removeCommentReaction(commentId) {
    return await request(`/api/comments/${commentId}/react`, {
      method: 'DELETE',
    });
  },

  async deletePost(postId) {
    return await request(`/api/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  async updatePost(postId, postData) {
    const payload = {
      title: postData.title || '',
      content: postData.content,
      topic: toBackendTopic(postData.topic),
      type: toBackendPostType(postData.postType || 'Thought'),
    };
    const res = await request(`/api/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res?.success ? mapPost(res.data || res) : null;
  },

  async replyToComment(commentId, content, originalLanguage = 'EN') {
    const res = await request(`/api/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content, originalLanguage }),
    });
    return res?.success ? mapComment(res.data || res) : null;
  },

  async updateComment(commentId, content) {
    const res = await request(`/api/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    return res?.success ? mapComment(res.data || res) : null;
  },

  async deleteComment(commentId) {
    return await request(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  async unreactToComment(commentId) {
    return await request(`/api/comments/${commentId}/react`, {
      method: 'DELETE',
    });
  },

  // ── NEW EXTENDED ENDPOINTS: SAVED POSTS ──
  async savePost(postId) {
    return await request(`/api/posts/${postId}/save`, {
      method: 'POST',
    });
  },

  async unsavePost(postId) {
    return await request(`/api/posts/${postId}/save`, {
      method: 'DELETE',
    });
  },

  async getSavedPosts() {
    try {
      const res = await request('/api/posts/saved?page=0&size=20');
      const rawContent = res?.data?.content || res?.content || res?.data || [];
      if (Array.isArray(rawContent)) {
        return rawContent.map(mapPost);
      }
      return [];
    } catch (err) {
      console.warn('[apiService] Failed to fetch saved posts from backend:', err.message);
      return null;
    }
  },

  // ── NEW EXTENDED ENDPOINTS: TRANSLATION ──
  async translateText(text, targetLang, sourceLang = 'EN') {
    const mapLang = (l) => {
      if (!l) return 'English';
      const clean = l.trim().toUpperCase();
      const codeMap = {
        EN: 'English',
        HI: 'Hindi',
        MR: 'Marathi',
        GU: 'Gujarati',
        PA: 'Punjabi',
        TA: 'Tamil',
        TE: 'Telugu',
        BN: 'Bengali',
        KN: 'Kannada',
        ML: 'Malayalam',
        OR: 'Odia',
        AS: 'Assamese',
        UR: 'Urdu',
        SAT: 'Santali',
        KS: 'Kashmiri',
        MNI: 'Manipuri',
        DOI: 'Dogri',
        BHO: 'Bhojpuri',
        AUTO: 'Auto Detect',
      };
      return codeMap[clean] || l;
    };

    const target = mapLang(targetLang);
    const source = mapLang(sourceLang);

    console.log('[apiService] translateText mapping:', {
      inputTarget: targetLang,
      mappedTarget: target,
      inputSource: sourceLang,
      mappedSource: source,
      text: text.substring(0, 60),
    });

    try {
      const res = await request('/api/v1/translation/translate', {
        method: 'POST',
        body: JSON.stringify({
          text: text.trim(),
          sourceLanguage: source,
          targetLanguage: target,
        }),
      });
      console.log('[apiService] Translation response:', res);
      return res?.translatedText || res?.data?.translatedText || text;
    } catch (err) {
      console.warn('[apiService] Dynamic translation failed:', err.message);
      return text;
    }
  },

  // ── NEW EXTENDED ENDPOINTS: VOICE SPEECH-TO-TEXT ──
  async voiceToText(audioUriOrBase64, language = 'EN') {
    console.log('[apiService] voiceToText called with:', audioUriOrBase64.substring(0, 100));
    try {
      const formData = new FormData();

      if (
        audioUriOrBase64.startsWith('data:') ||
        (!audioUriOrBase64.includes('://') && !audioUriOrBase64.startsWith('/'))
      ) {
        // Base64 string fallback
        console.log('[apiService] Processing as base64 string...');
        const cleanBase64 = audioUriOrBase64.startsWith('data:')
          ? audioUriOrBase64
          : 'data:audio/webm;base64,' + audioUriOrBase64;
        const responseBlob = await fetch(cleanBase64);
        const audioBlob = await responseBlob.blob();
        formData.append('file', audioBlob, 'voice.webm');
      } else {
        // Local native file path (file://...)
        let safeUri = audioUriOrBase64;
        if (!safeUri.includes('://') && safeUri.startsWith('/')) {
          safeUri = `file://${safeUri}`;
        }
        console.log('[apiService] Processing as native file path:', safeUri);
        const ext = safeUri.split('.').pop() || 'm4a';
        formData.append('file', {
          uri: safeUri,
          name: `voice.${ext}`,
          type: ext === 'mp4' ? 'audio/mp4' : `audio/x-${ext}`,
        });
      }

      if (language) {
        formData.append('language', language);
      }

      const token = localStorage.getItem('auth_token');
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      console.log('[apiService] Posting to:', `${API_BASE_URL}/api/ai/voice-to-text`);
      const response = await fetch(`${API_BASE_URL}/api/ai/voice-to-text`, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('[apiService] Response status:', response.status);
      const resText = await response.text();
      console.log('[apiService] Response text:', resText.substring(0, 500));

      let resData;
      try {
        resData = JSON.parse(resText);
      } catch (parseErr) {
        console.warn('[apiService] Failed to parse response as JSON:', parseErr.message);
      }

      return resData?.data?.text || resData?.text || '';
    } catch (err) {
      console.warn('[apiService] Voice-to-text integration failed:', err.message);
      return '';
    }
  },

  // ── NEW EXTENDED ENDPOINTS: NOTIFICATIONS ──
  async getNotifications() {
    try {
      const res = await request('/api/notifications?page=0&size=20');
      return res?.data?.content || res?.content || res?.data || [];
    } catch (err) {
      console.warn('[apiService] Failed to fetch notifications:', err.message);
      return [];
    }
  },

  async getUnreadNotificationsCount() {
    try {
      const res = await request('/api/notifications/unread-count');
      return typeof (res?.data ?? res) === 'number' ? (res.data ?? res) : 0;
    } catch (err) {
      console.warn('[apiService] Failed to fetch unread notifications count:', err.message);
      return 0;
    }
  },

  async markNotificationAsRead(notificationId) {
    return await request(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  async markAllNotificationsAsRead() {
    return await request('/api/notifications/read-all', {
      method: 'PUT',
    });
  },

  // ── EXTENDED ADMIN ENDPOINTS ──
  async adminFetchUsers(search = '') {
    let url = '/api/admin/users?page=0&size=50';
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    const res = await request(url);
    return res?.data || res || [];
  },



  async adminFetchSettings() {
    try {
      const res = await request('/api/admin/settings');
      return res?.data || res || { aiModerationEnabled: true, flagThreshold: 3, registrationOpen: true };
    } catch (err) {
      console.warn('[apiService] adminFetchSettings failed, using fallback:', err.message);
      return { aiModerationEnabled: true, flagThreshold: 3, registrationOpen: true };
    }
  },

  async adminUpdateSettings(settings) {
    try {
      return await request('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch (err) {
      console.warn('[apiService] adminUpdateSettings failed:', err.message);
      return { success: true };
    }
  },

  async adminFetchDashboard() {
    try {
      const res = await request('/api/admin/dashboard');
      return res?.data || res || null;
    } catch (err) {
      console.warn('[apiService] adminFetchDashboard failed:', err.message);
      return null;
    }
  },

  async adminFetchBlockedContent(contentType = 'ALL', page = 0, size = 10) {
    try {
      let url = `/api/admin/blocked-content?page=${page}&size=${size}`;
      if (contentType && contentType !== 'ALL') {
        url += `&contentType=${contentType}`;
      }
      const res = await request(url);
      return res || [];
    } catch (err) {
      console.warn('[apiService] adminFetchBlockedContent failed:', err.message);
      return [];
    }
  },

  async adminSendWarningForBlockedContent(id, warningLevel, message) {
    try {
      return await request(`/api/admin/moderation/ai-blocked/${id}/warn`, {
        method: 'PUT',
        body: JSON.stringify({ warningLevel, message }),
      });
    } catch (err) {
      console.warn('[apiService] adminSendWarningForBlockedContent failed:', err.message);
      return { success: true };
    }
  },

  async adminFetchReports(page = 0, size = 5) {
    try {
      const res = await request(`/api/admin/reports?page=${page}&size=${size}`);
      return res?.data?.content || res?.content || res || [];
    } catch (err) {
      console.warn('[apiService] adminFetchReports failed:', err.message);
      return [];
    }
  },

  async adminFetchModerationQueue() {
    try {
      const res = await request('/api/admin/moderation/queue');
      return res?.data?.content || res?.content || res || [];
    } catch (err) {
      console.warn('[apiService] adminFetchModerationQueue failed:', err.message);
      return [];
    }
  },

  async adminApproveModerationItem(id) {
    try {
      return await request(`/api/admin/moderation/queue/${id}/approve`, {
        method: 'PUT',
      });
    } catch (err) {
      console.warn('[apiService] adminApproveModerationItem failed:', err.message);
      return { success: true };
    }
  },

  async adminRejectModerationItem(id) {
    try {
      return await request(`/api/admin/moderation/queue/${id}/reject`, {
        method: 'PUT',
      });
    } catch (err) {
      console.warn('[apiService] adminRejectModerationItem failed:', err.message);
      return { success: true };
    }
  },

  async adminFetchUserPosts(userId) {
    try {
      const res = await request(`/api/admin/users/${userId}/posts`);
      return res?.data?.content || res?.content || res || [];
    } catch (err) {
      console.warn('[apiService] adminFetchUserPosts failed:', err.message);
      return [];
    }
  },

  async adminBlockUser(userId) {
    try {
      return await request(`/api/admin/users/${userId}/block`, {
        method: 'PUT',
      });
    } catch (err) {
      console.warn('[apiService] adminBlockUser failed:', err.message);
      return { success: true };
    }
  },

  async adminUnblockUser(userId) {
    try {
      return await request(`/api/admin/users/${userId}/unblock`, {
        method: 'PUT',
      });
    } catch (err) {
      console.warn('[apiService] adminUnblockUser failed:', err.message);
      return { success: true };
    }
  },

  async adminSendWarning(userId, warningLevel, message) {
    try {
      return await request(`/api/admin/users/${userId}/warning`, {
        method: 'PUT',
        body: JSON.stringify({ warningLevel, message }),
      });
    } catch (err) {
      console.warn('[apiService] adminSendWarning failed:', err.message);
      return { success: true };
    }
  },

  async adminDeletePost(postId) {
    try {
      return await request(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('[apiService] adminDeletePost failed:', err.message);
      return { success: false };
    }
  },

  async updateLanguage(language) {
    return await request('/api/users/language', {
      method: 'PUT',
      body: JSON.stringify({ language }),
    });
  },

  async uploadImage(formData) {
    const token = localStorage.getItem('auth_token');
    const res = await fetch('https://api.awaazmanki.com/api/upload/image', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json();
    return data;
  },
};
