import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { InitialAvatar } from '../common/InitialAvatar';
import { usePosts } from '../../context/PostContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../styles/theme';
import { normalizeLanguageCode } from '../../services/apiTranslationService';
import { styles } from '../../styles/appStyles';

export function CommentItem({ comment: c, postId, currentUser, onNavigateToChat }: { comment: any; postId: any; currentUser: any; onNavigateToChat?: (username: any, authorId: any, initials: any, color: any) => void }) {
  const { replyToComment, updateComment, deleteComment, reactToComment } = usePosts() as any;
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(c.content);
  const [showEmojis, setShowEmojis] = useState(false);

  const handleSendReply = () => {
    if (!replyText.trim()) { return; }
    replyToComment(c.id, postId, replyText.trim(), currentUser);
    setReplyText('');
    setShowReplyInput(false);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) { return; }
    updateComment(c.id, postId, editText.trim());
    setIsEditing(false);
  };

  const { currentLanguage, translateText } = useLanguage() as any;
  const [showOriginal, setShowOriginal] = useState(false);

  const displayContent = translateText(c.originalContent || c.content, currentLanguage);

  const commentLangCode = normalizeLanguageCode(c.language) || 'EN';
  const isDifferentLanguage = commentLangCode !== currentLanguage;
  const hasTranslation = isDifferentLanguage && displayContent && displayContent !== (c.originalContent || c.content);

  const isOwner = c.username === currentUser?.username;
  const reactionCount: any = Object.values(c.reactions || {}).reduce((a: any, b: any) => a + b, 0);

  return (
    <View style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F8F5F4', paddingBottom: 12 }}>
      {/* Comment Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity
          disabled={!onNavigateToChat || c.username === currentUser?.username}
          onPress={() => {
            const cleanUsername = c.username ? c.username.replace('@', '') : '';
            const authorId = c.authorId || c.userId || c.author?.id || c.user?.id || 0;
            if (onNavigateToChat) {
              onNavigateToChat(cleanUsername, authorId, c.avatarInitials, c.avatarColor || '#3F7772');
            }
          }}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <InitialAvatar initials={c.avatarInitials} color={c.avatarColor || '#3F7772'} size={28} />
          <Text style={[styles.commentUser, { marginLeft: 8 }]}>{c.username}</Text>
        </TouchableOpacity>

        {/* Actions Menu */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => setShowEmojis(!showEmojis)}>
            <Text style={{ fontSize: 13 }}>😀</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowReplyInput(!showReplyInput)}>
            <Text style={{ fontSize: 11, color: '#8C8385', fontWeight: 'bold' }}>Reply</Text>
          </TouchableOpacity>
          {isOwner && (
            <>
              <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                <Text style={{ fontSize: 11, color: COLORS.warning, fontWeight: 'bold' }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteComment(c.id, postId)}>
                <Text style={{ fontSize: 11, color: COLORS.error, fontWeight: 'bold' }}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Emoji Picker Bar */}
      {showEmojis && (
        <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 6, paddingLeft: 36 }}>
          {['❤️', '👍', '🔥', '🤝', '💯'].map(emoji => {
            const reactionMap: Record<string, string> = { '❤️': 'relate', '👍': 'wellSaid', '🔥': 'helpful', '🤝': 'stayStrong', '💯': 'madeMeThink' };
            const reactionKey = reactionMap[emoji];
            return (
              <TouchableOpacity key={emoji} onPress={() => { reactToComment(c.id, postId, reactionKey); setShowEmojis(false); }}>
                <Text style={{ fontSize: 16 }}>{emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Comment Body */}
      <View style={{ paddingLeft: 36, marginTop: 4 }}>
        {isEditing ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              style={[styles.input, { flex: 1, marginBottom: 0, height: 36, paddingVertical: 4 }]}
            />
            <TouchableOpacity onPress={handleSaveEdit} style={[styles.commentSendButton, { height: 36 }]}>
              <Text style={styles.commentSendText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.commentContent, { fontSize: 13.5, color: '#2D1D15', marginLeft: 0 }]}>
              {showOriginal ? (c.originalContent || c.content) : displayContent}
            </Text>
            {hasTranslation && (
              <TouchableOpacity onPress={() => setShowOriginal(!showOriginal)} style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 10, color: COLORS.deepPlum, fontWeight: 'bold' }}>
                  🌐 {showOriginal ? 'Show Translation' : 'Show Original'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Render Reaction Display Count */}
      {reactionCount > 0 && (
        <View style={{ flexDirection: 'row', gap: 4, paddingLeft: 36, marginTop: 4 }}>
          {Object.entries(c.reactions || {}).map(([emojiKey, val]: any) => {
            const emojis: Record<string, string> = { relate: '❤️', wellSaid: '👍', helpful: '🔥', stayStrong: '🤝', madeMeThink: '💯' };
            if (!val) { return null; }
            return (
              <View key={emojiKey} style={{ backgroundColor: '#FAF8F8', borderWidth: 1, borderColor: '#E1DCDB', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, color: COLORS.zorba }}>{emojis[emojiKey]} {val}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Nested Replies */}
      {c.replies && c.replies.length > 0 && (
        <View style={{ paddingLeft: 36, marginTop: 8, borderLeftWidth: 1.5, borderLeftColor: '#E1DCDB', marginLeft: 14 }}>
          {c.replies.map((r: any) => {
            const isReplyOwner = r.username === currentUser?.username;
            return (
              <View key={r.id} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    disabled={!onNavigateToChat || r.username === currentUser?.username}
                    onPress={() => {
                      const cleanUsername = r.username ? r.username.replace('@', '') : '';
                      const authorId = r.authorId || r.userId || r.author?.id || r.user?.id || 0;
                      if (onNavigateToChat) {
                        onNavigateToChat(cleanUsername, authorId, r.avatarInitials, r.avatarColor || '#6F405F');
                      }
                    }}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >
                    <InitialAvatar initials={r.avatarInitials} color={r.avatarColor || '#6F405F'} size={22} />
                    <Text style={[styles.commentUser, { marginLeft: 6, fontSize: 11.5, color: '#8C8385' }]}>{r.username}</Text>
                  </TouchableOpacity>
                  {isReplyOwner && (
                    <TouchableOpacity onPress={() => deleteComment(r.id, postId)}>
                      <Text style={{ fontSize: 10, color: COLORS.error }}>âœ•</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={{ fontSize: 12.5, color: '#2D1D15', marginLeft: 28, marginTop: 2 }}>
                  {translateText(r.originalContent || r.content, currentLanguage)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Reply Input Box */}
      {showReplyInput && (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingLeft: 36, marginTop: 8 }}>
          <TextInput
            placeholder={`Reply to ${c.username}...`}
            placeholderTextColor={COLORS.zorba}
            value={replyText}
            onChangeText={setReplyText}
            style={[styles.input, { flex: 1, marginBottom: 0, height: 36, paddingVertical: 4 }]}
          />
          <TouchableOpacity onPress={handleSendReply} style={[styles.commentSendButton, { height: 36 }]}>
            <Text style={styles.commentSendText}>Reply</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
