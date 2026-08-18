import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

const PostContext = createContext(null);

const INITIAL_POSTS = [];
const INITIAL_REPORTS = [];

export function PostProvider({ children }) {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();

  const refreshPosts = async () => {
    try {
      const [backendPosts, savedPosts] = await Promise.all([
        apiService.getPosts(),
        currentUser ? apiService.getSavedPosts() : Promise.resolve([])
      ]);

      const merged = mergeSavedPosts(backendPosts || [], savedPosts || []);
      if (merged.length > 0) {
        setPosts(merged);
      }
    } catch (err) {
      console.warn('[PostContext] Failed to refresh posts:', err.message);
    }
  };

  const mergeSavedPosts = (feedPosts, savedPosts) => {
    const postMap = new Map();
    feedPosts.forEach(p => {
      postMap.set(String(p.id), { ...p, isSaved: false });
    });

    savedPosts.forEach(sp => {
      const spId = String(sp.id);
      if (postMap.has(spId)) {
        postMap.get(spId).isSaved = true;
      } else {
        postMap.set(spId, { ...sp, isSaved: true });
      }
    });

    return Array.from(postMap.values());
  };

  // Fetch posts from backend on mount or user change
  useEffect(() => {
    async function loadData() {
      try {
        const [backendPosts, savedPosts] = await Promise.all([
          apiService.getPosts(),
          currentUser ? apiService.getSavedPosts() : Promise.resolve([])
        ]);

        const merged = mergeSavedPosts(backendPosts || [], savedPosts || []);
        if (merged.length > 0) {
          setPosts(merged);
        }

        if (currentUser && (currentUser.role === 'ROLE_ADMIN' || currentUser.role === 'ADMIN')) {
          const backendReports = await apiService.getReports();
          if (backendReports && backendReports.length > 0) {
            setReports(backendReports);
          }
        } else {
          setReports([]);
        }
      } catch (err) {
        console.warn('[PostContext] Failed to load initial post data:', err.message);
        try {
          const backendPosts = await apiService.getPosts();
          if (backendPosts && backendPosts.length > 0) {
            setPosts(backendPosts.map(p => ({ ...p, isSaved: false })));
          }
        } catch (e) {}
      }
    }
    loadData();
  }, [currentUser, currentLanguage]);

  const createPost = async (postData, currentUser) => {
    const apiResult = await apiService.createPost(postData);

    const localPost = {
      id: apiResult?.id ? String(apiResult.id) : `post_${Date.now()}`,
      username: currentUser?.username || '@anonymous',
      avatarInitials: currentUser?.avatarInitials || 'AN',
      avatarColor: currentUser?.avatarColor || '#6F405F',
      postType: postData.postType || 'Thought',
      topic: postData.topic || 'General',
      title: postData.title || '',
      content: postData.content || '',
      createdAt: new Date().toISOString(),
      reactions: { relate: 0, wellSaid: 0, helpful: 0, stayStrong: 0, madeMeThink: 0 },
      userReaction: null,
      commentCount: 0,
      comments: [],
      isSaved: false,
      hidden: false,
    };

    setPosts(prev => [localPost, ...prev]);
    return localPost;
  };

  const deletePost = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const hidePost = async (postId) => {
    await apiService.updatePostStatus(postId, 'HIDDEN');
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, hidden: true } : p))
    );
  };

  const blockUser = (username) => {
    setBlockedUsers(prev => [...prev, username]);
    setPosts(prev =>
      prev.map(p => (p.username === username ? { ...p, hidden: true } : p))
    );
  };

  const unblockUser = (username) => {
    setBlockedUsers(prev => prev.filter(u => u !== username));
    setPosts(prev =>
      prev.map(p => (p.username === username ? { ...p, hidden: false } : p))
    );
  };

  const toggleSavePost = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const nextSavedState = !post.isSaved;
    try {
      if (nextSavedState) {
        await apiService.savePost(postId);
      } else {
        await apiService.unsavePost(postId);
      }
    } catch (err) {
      console.warn('[PostContext] Saved post action failed, toggling state locally:', err.message);
    }

    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, isSaved: nextSavedState } : p))
    );
  };

  const reactToPost = async (postId, reactionKey) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isRemoving = post.userReaction === reactionKey;

    // Optimistically update UI state immediately
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;

        const reactions = { ...p.reactions };
        let userReaction = p.userReaction;

        if (userReaction === reactionKey) {
          reactions[reactionKey] = Math.max(0, reactions[reactionKey] - 1);
          userReaction = null;
        } else {
          if (userReaction) {
            reactions[userReaction] = Math.max(0, reactions[userReaction] - 1);
          }
          reactions[reactionKey] = (reactions[reactionKey] || 0) + 1;
          userReaction = reactionKey;
        }

        return { ...p, reactions, userReaction };
      })
    );

    try {
      if (isRemoving) {
        await apiService.removePostReaction(postId);
      } else {
        const uiToBackendMap = {
          relate: 'LOVE',
          wellSaid: 'LIKE',
          helpful: 'WOW',
          stayStrong: 'SAD',
          madeMeThink: 'HAHA'
        };
        const backendType = uiToBackendMap[reactionKey] || 'LIKE';
        await apiService.reactToPost(postId, backendType);
      }
    } catch (err) {
      console.warn('[PostContext] Reaction API failed:', err.message);
    }
  };

  // Load comments dynamically from backend
  const loadComments = async (postId) => {
    const backendComments = await apiService.getComments(postId);
    if (backendComments) {
      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, comments: backendComments } : p))
      );
      return backendComments;
    }
    return [];
  };

  const addComment = async (postId, content, currentUser) => {
    const apiResult = await apiService.addComment(postId, content);

    const localComment = {
      id: apiResult?.id ? String(apiResult.id) : `comment_${Date.now()}`,
      username: currentUser?.username || '@anonymous',
      avatarInitials: currentUser?.avatarInitials || 'AN',
      avatarColor: currentUser?.avatarColor || '#6F405F',
      content: content,
      reactions: apiResult?.reactions || { relate: 0 },
      userReaction: apiResult?.userReaction || null,
      replies: [],
      createdAt: new Date().toISOString(),
    };

    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          commentCount: p.commentCount + 1,
          comments: [...(p.comments || []), localComment],
        };
      })
    );
  };

  const replyToComment = async (commentId, postId, content, currentUser) => {
    const apiResult = await apiService.replyToComment(commentId, content);

    const localReply = {
      id: apiResult?.id ? String(apiResult.id) : `reply_${Date.now()}`,
      username: currentUser?.username || '@anonymous',
      avatarInitials: currentUser?.avatarInitials || 'AN',
      avatarColor: currentUser?.avatarColor || '#6F405F',
      content: content,
      reactions: apiResult?.reactions || { relate: 0 },
      userReaction: apiResult?.userReaction || null,
      createdAt: new Date().toISOString(),
    };

    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: (p.comments || []).map(c => {
            if (c.id !== commentId) return c;
            return {
              ...c,
              replies: [...(c.replies || []), localReply],
            };
          }),
        };
      })
    );
  };

  const updateComment = async (commentId, postId, content) => {
    await apiService.updateComment(commentId, content);
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: (p.comments || []).map(c => {
            if (c.id === commentId) {
              return { ...c, content };
            }
            return {
              ...c,
              replies: (c.replies || []).map(r => (r.id === commentId ? { ...r, content } : r)),
            };
          }),
        };
      })
    );
  };

  const deleteComment = async (commentId, postId) => {
    await apiService.deleteComment(commentId);
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;

        let removedCount = 0;
        const updatedComments = (p.comments || []).filter(c => {
          if (c.id === commentId) {
            removedCount += 1 + (c.replies || []).length;
            return false;
          }
          c.replies = (c.replies || []).filter(r => {
            if (r.id === commentId) {
              removedCount += 1;
              return false;
            }
            return true;
          });
          return true;
        });

        return {
          ...p,
          commentCount: Math.max(0, p.commentCount - removedCount),
          comments: updatedComments,
        };
      })
    );
  };

  const reactToComment = async (commentId, postId, reactionKey) => {
    const key = reactionKey.toLowerCase();
    
    try {
      if (key === 'relate') {
        await apiService.likeComment(commentId);
      } else {
        await apiService.reactToComment(commentId, reactionKey);
      }
    } catch (err) {
      console.warn('[PostContext] Failed to react to comment on backend:', err.message);
    }

    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: (p.comments || []).map(c => {
            const updateReactionState = (item) => {
              if (item.id !== commentId) return item;
              const reactions = { ...item.reactions };
              let userReaction = item.userReaction;

              if (userReaction === reactionKey) {
                reactions[reactionKey] = Math.max(0, reactions[reactionKey] - 1);
                userReaction = null;
              } else {
                if (userReaction) {
                  reactions[userReaction] = Math.max(0, reactions[userReaction] - 1);
                }
                reactions[reactionKey] = (reactions[reactionKey] || 0) + 1;
                userReaction = reactionKey;
              }
              return { ...item, reactions, userReaction };
            };

            const updatedC = updateReactionState(c);
            if (updatedC.replies) {
              updatedC.replies = updatedC.replies.map(updateReactionState);
            }
            return updatedC;
          }),
        };
      })
    );
  };

  const translatePost = async (postId, targetLang) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;

        if (targetLang === 'English') {
          return { ...p, content: p.originalContent || p.content, displayLanguage: 'EN' };
        }

        apiService.translateText(p.originalContent || p.content, targetLang).then(translated => {
          setPosts(current =>
            current.map(item => (item.id === postId ? { ...item, content: translated, displayLanguage: targetLang } : item))
          );
        });

        return p;
      })
    );
  };

  const translateComment = async (commentId, postId, targetLang) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: (p.comments || []).map(c => {
            const translateNode = (node) => {
              if (node.id !== commentId) return node;
              if (targetLang === 'English') {
                return { ...node, content: node.originalContent || node.content };
              }
              apiService.translateText(node.originalContent || node.content, targetLang).then(translated => {
                setPosts(current =>
                  current.map(currentPost => {
                    if (currentPost.id !== postId) return currentPost;
                    return {
                      ...currentPost,
                      comments: (currentPost.comments || []).map(currentComment => {
                        const updateCommentNode = (n) => {
                          if (n.id === commentId) return { ...n, content: translated };
                          return n;
                        };
                        const updatedCC = updateCommentNode(currentComment);
                        if (updatedCC.replies) {
                          updatedCC.replies = updatedCC.replies.map(updateCommentNode);
                        }
                        return updatedCC;
                      })
                    };
                  })
                );
              });
              return node;
            };

            const updatedC = translateNode(c);
            if (updatedC.replies) {
              updatedC.replies = updatedC.replies.map(translateNode);
            }
            return updatedC;
          })
        };
      })
    );
  };

  const fileReport = (postId, contentType, content, authorUsername, reason, notes) => {
    const newReport = {
      id: `report_${Date.now()}`,
      postId: postId,
      contentType: contentType || 'POST',
      reportedContent: content,
      authorUsername: authorUsername,
      reason: reason || 'Inappropriate Content',
      reporterNotes: notes || '',
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };
    setReports(prev => [newReport, ...prev]);
  };

  const resolveReport = async (reportId, actionTaken, adminNotes) => {
    if (actionTaken === 'KEEP') {
      await apiService.rejectReport(reportId);
    } else {
      await apiService.resolveReport(reportId);
    }

    setReports(prev =>
      prev.map(r => {
        if (r.id !== reportId) return r;
        return {
          ...r,
          status: 'RESOLVED',
          actionTaken: actionTaken,
          adminNotes: adminNotes || '',
        };
      })
    );
  };

  return (
    <PostContext.Provider
      value={{
        posts: posts.filter(p => !p.hidden && !blockedUsers.includes(p.username)),
        allRawPosts: posts,
        reports,
        blockedUsers,
        createPost,
        deletePost,
        hidePost,
        blockUser,
        unblockUser,
        toggleSavePost,
        reactToPost,
        loadComments,
        addComment,
        replyToComment,
        updateComment,
        deleteComment,
        reactToComment,
        translatePost,
        translateComment,
        fileReport,
        resolveReport,
        refreshPosts,
      }}
    >
      {children}
    </PostContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
}
