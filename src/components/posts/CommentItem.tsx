import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { InitialAvatar } from '../common/InitialAvatar';
import { usePosts } from '../../context/PostContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../styles/theme';
import { normalizeLanguageCode, detectTextLanguage } from '../../services/apiTranslationService';
import { styles } from '../../styles/appStyles';
import { CommentComposer } from './CommentComposer';

export function CommentItem({
  comment: c,
  postId,
  currentUser,
  postAuthorUsername,
  onNavigateToChat: _onNavigateToChat,
}: {
  comment: any;
  postId: any;
  currentUser: any;
  postAuthorUsername?: string;
  onNavigateToChat?: (username: any, authorId: any, initials: any, color: any) => void;
}) {
  const { replyToComment, updateComment, deleteComment, reactToComment, blockedUsers } = usePosts() as any;
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(c.content);
  const [showEmojis, setShowEmojis] = useState(false);

  const isBlocked = blockedUsers?.some(
    (u: string) => u.replace(/^@/, '').toLowerCase().trim() === (c.username || '').replace(/^@/, '').toLowerCase().trim()
  );
  if (isBlocked) {
    return null;
  }

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

  const detectedCode = detectTextLanguage(c.originalContent || c.content);
  const commentLangCode = (detectedCode !== 'EN') ? detectedCode : (normalizeLanguageCode(c.language) || 'EN');
  const isDifferentLanguage = commentLangCode !== currentLanguage;
  const hasTranslation = isDifferentLanguage && displayContent && displayContent !== (c.originalContent || c.content);

  const isOwner = c.username === currentUser?.username;
  const reactionCount: any = Object.values(c.reactions || {}).reduce((a: any, b: any) => a + b, 0);

  // Far Right Emojis mapping
  const emojisMap: Record<string, string> = { relate: '❤️', wellSaid: '👍', helpful: '🔥', stayStrong: '🤝', madeMeThink: '💯', happy: '😀' };
  const activeEmojis = Object.entries(c.reactions || {})
    .filter(([_, val]: any) => val > 0)
    .map(([key]) => emojisMap[key])
    .filter(Boolean);

  return (
    <View style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F8F5F4', paddingBottom: 12 }}>
      {/* Comment Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          <InitialAvatar initials={c.avatarInitials} color={c.avatarColor || '#3F7772'} size={28} />
          <Text style={[styles.commentUser, { marginLeft: 8 }]} numberOfLines={1}>{c.username}</Text>
          {postAuthorUsername && c.username === postAuthorUsername && (
            <Text style={{
              fontSize: 8,
              fontWeight: 'bold',
              color: '#6F405F',
              backgroundColor: 'rgba(111, 64, 95, 0.1)',
              paddingHorizontal: 4,
              paddingVertical: 1,
              borderRadius: 3,
              marginLeft: 6,
              textTransform: 'uppercase',
            }}>
              Author
            </Text>
          )}
        </View>

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
          {['😀', '❤️', '👍', '🔥', '💯', '🤝'].map(emoji => {
            const reactionMap: Record<string, string> = { '😀': 'happy', '❤️': 'relate', '👍': 'wellSaid', '🔥': 'helpful', '🤝': 'stayStrong', '💯': 'madeMeThink' };
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
      <View style={{ paddingLeft: 36, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
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
                    🌐 {showOriginal ? 'Show Original' : 'Show Translation'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Far Right Emojis Display */}
        {activeEmojis.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center', flexShrink: 0, marginTop: 2 }}>
            {activeEmojis.map((emoji, index) => (
              <Text key={index} style={{ fontSize: 12 }}>{emoji}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Render Reaction Display Count */}
      {reactionCount > 0 && (
        <View style={{ flexDirection: 'row', gap: 4, paddingLeft: 36, marginTop: 4 }}>
          {Object.entries(c.reactions || {}).map(([emojiKey, val]: any) => {
            if (!val) { return null; }
            return (
              <View key={emojiKey} style={{ backgroundColor: '#FAF8F8', borderWidth: 1, borderColor: '#E1DCDB', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, color: COLORS.zorba }}>{emojisMap[emojiKey]} {val}</Text>
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
            const isReplyBlocked = blockedUsers?.some(
              (u: string) => u.replace(/^@/, '').toLowerCase().trim() === (r.username || '').replace(/^@/, '').toLowerCase().trim()
            );
            if (isReplyBlocked) return null;
            return (
              <View key={r.id} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <InitialAvatar initials={r.avatarInitials} color={r.avatarColor || '#6F405F'} size={22} />
                    <Text style={[styles.commentUser, { marginLeft: 6, fontSize: 11.5, color: '#8C8385' }]}>{r.username}</Text>
                  </View>
                  {isReplyOwner && (
                    <TouchableOpacity onPress={() => deleteComment(r.id, postId)}>
                      <Text style={{ fontSize: 10, color: COLORS.error }}>✕</Text>
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
        <View style={{ paddingLeft: 36, marginTop: 8 }}>
          <CommentComposer
            postId={postId}
            onSubmit={async (text) => {
              await replyToComment(c.id, postId, text, currentUser);
              setShowReplyInput(false);
            }}
            placeholder={`Reply to ${c.username}...`}
            currentUser={currentUser}
          />
        </View>
      )}
    </View>
  );
}
