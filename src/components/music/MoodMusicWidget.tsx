import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useMoodMusic } from '../../context/MoodMusicContext';
import { COLORS } from '../../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const PlayIcon = ({ color = '#FFFFFF', size = 12 }) => (
  <View style={{
    width: 0,
    height: 0,
    borderLeftWidth: size,
    borderTopWidth: size * 0.6,
    borderBottomWidth: size * 0.6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: color,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  }} />
);

const PauseIcon = ({ color = '#FFFFFF', size = 12 }) => (
  <View style={{ flexDirection: 'row', gap: 2.5 }}>
    <View style={{ width: size * 0.3, height: size, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ width: size * 0.3, height: size, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

const PrevIcon = ({ color = '#6F405F', size = 12 }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={{ width: 2, height: size, backgroundColor: color, borderRadius: 0.8 }} />
    <View style={{
      width: 0,
      height: 0,
      borderRightWidth: size * 0.8,
      borderTopWidth: size * 0.5,
      borderBottomWidth: size * 0.5,
      borderStyle: 'solid',
      backgroundColor: 'transparent',
      borderRightColor: color,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    }} />
  </View>
);

const NextIcon = ({ color = '#6F405F', size = 12 }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={{
      width: 0,
      height: 0,
      borderLeftWidth: size * 0.8,
      borderTopWidth: size * 0.5,
      borderBottomWidth: size * 0.5,
      borderStyle: 'solid',
      backgroundColor: 'transparent',
      borderLeftColor: color,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    }} />
    <View style={{ width: 2, height: size, backgroundColor: color, borderRadius: 0.8 }} />
  </View>
);

const VolumeIcon = ({ color = '#6F405F', size = 12 }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', width: size * 1.4, height: size }}>
    <View style={{
      width: size * 0.35,
      height: size * 0.4,
      backgroundColor: color,
      borderTopLeftRadius: 1,
      borderBottomLeftRadius: 1,
    }} />
    <View style={{
      width: 0,
      height: 0,
      borderRightWidth: size * 0.45,
      borderTopWidth: size * 0.45,
      borderBottomWidth: size * 0.45,
      borderStyle: 'solid',
      backgroundColor: 'transparent',
      borderRightColor: color,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      marginLeft: -1,
    }} />
    <View style={{
      width: size * 0.4,
      height: size * 0.7,
      borderRightWidth: 1.5,
      borderColor: color,
      borderTopRightRadius: size * 0.4,
      borderBottomRightRadius: size * 0.4,
      marginLeft: 2,
    }} />
  </View>
);

const MuteIcon = ({ color = '#8C8385', size = 12 }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', width: size * 1.4, height: size }}>
    <View style={{
      width: size * 0.35,
      height: size * 0.4,
      backgroundColor: color,
      borderTopLeftRadius: 1,
      borderBottomLeftRadius: 1,
    }} />
    <View style={{
      width: 0,
      height: 0,
      borderRightWidth: size * 0.45,
      borderTopWidth: size * 0.45,
      borderBottomWidth: size * 0.45,
      borderStyle: 'solid',
      backgroundColor: 'transparent',
      borderRightColor: color,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      marginLeft: -1,
    }} />
    <View style={{ width: size * 0.35, height: size * 0.35, justifyContent: 'center', alignItems: 'center', marginLeft: 3 }}>
      <View style={{ position: 'absolute', width: size * 0.35, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', width: size * 0.35, height: 1.5, backgroundColor: color, transform: [{ rotate: '-45deg' }] }} />
    </View>
  </View>
);

const SkipBackwardIcon = ({ color = '#6F405F', size = 12 }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={{
      width: 0,
      height: 0,
      borderRightWidth: size * 0.6,
      borderTopWidth: size * 0.45,
      borderBottomWidth: size * 0.45,
      borderStyle: 'solid',
      backgroundColor: 'transparent',
      borderRightColor: color,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    }} />
    <View style={{
      width: 0,
      height: 0,
      borderRightWidth: size * 0.6,
      borderTopWidth: size * 0.45,
      borderBottomWidth: size * 0.45,
      borderStyle: 'solid',
      backgroundColor: 'transparent',
      borderRightColor: color,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      marginLeft: -2.5,
    }} />
  </View>
);

const SkipForwardIcon = ({ color = '#6F405F', size = 12 }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={{
      width: 0,
      height: 0,
      borderLeftWidth: size * 0.6,
      borderTopWidth: size * 0.45,
      borderBottomWidth: size * 0.45,
      borderStyle: 'solid',
      backgroundColor: 'transparent',
      borderLeftColor: color,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    }} />
    <View style={{
      width: 0,
      height: 0,
      borderLeftWidth: size * 0.6,
      borderTopWidth: size * 0.45,
      borderBottomWidth: size * 0.45,
      borderStyle: 'solid',
      backgroundColor: 'transparent',
      borderLeftColor: color,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      marginLeft: -2.5,
    }} />
  </View>
);

export function MoodMusicWidget() {
  const music = useMoodMusic() as any;

  // Anim position values
  const pan = useRef(new Animated.ValueXY({
    x: SCREEN_WIDTH - 160,
    y: SCREEN_HEIGHT - 180
  })).current;

  // Disc Spin Animation
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef<any>(null);

  useEffect(() => {
    if (music.isPlaying) {
      spinAnim.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      );
      spinAnim.current.start();
    } else {
      if (spinAnim.current) {
        spinAnim.current.stop();
      }
      spinValue.setValue(0);
    }
  }, [music.isPlaying]);

  const discRotation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Pan Responder for Draggable Bubble
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        let currX = (pan.x as any)._value;
        let currY = (pan.y as any)._value;

        if (currX < 0) pan.x.setValue(10);
        if (currX > SCREEN_WIDTH - 60) pan.x.setValue(SCREEN_WIDTH - 80);
        if (currY < 60) pan.y.setValue(60);
        if (currY > SCREEN_HEIGHT - 120) pan.y.setValue(SCREEN_HEIGHT - 130);
      },
    })
  ).current;

  if (!music.currentTrack) return null;

  const currentSeconds = music.duration * (music.progress / 100);
  const defaultCover = require('../../assets/music-cover.jpg');

  const getCoverSource = (cover: any) => {
    if (typeof cover === 'number') return cover;
    if (cover && typeof cover === 'string' && cover.startsWith('http')) return { uri: cover };
    return defaultCover;
  };

  const seekForward = () => {
    if (!music.duration) return;
    const curr = music.duration * (music.progress / 100);
    const target = Math.min(music.duration, curr + 10);
    const newPercent = (target / music.duration) * 100;
    music.handleSeek(newPercent);
  };

  const seekBackward = () => {
    if (!music.duration) return;
    const curr = music.duration * (music.progress / 100);
    const target = Math.max(0, curr - 10);
    const newPercent = (target / music.duration) * 100;
    music.handleSeek(newPercent);
  };

  return (
    <View
      style={styles.widgetContainer}
    >
      {music.isWidgetOpen ? (
        /* ── 1. EXPANDED MUSIC PLAYER WIDGET ── */
        <View style={styles.expandedCard}>
          {/* Header Drag Area & Close */}
          <View style={styles.header}>
            <View style={[styles.headerTitleRow, { flex: 1, paddingVertical: 4 }]}>
              <Text style={styles.headerTitle}>Mood Radio</Text>
            </View>
            <TouchableOpacity onPress={() => music.setIsWidgetOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Album disc & Song details */}
          <View style={styles.trackCard}>
            <Animated.Image
              source={getCoverSource(music.currentTrack.coverUrl)}
              style={[
                styles.trackDisc,
                {
                  transform: [{ rotate: discRotation }]
                }
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {music.currentTrack.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {music.currentTrack.artist || 'Unknown artist'}
              </Text>
            </View>
          </View>

          {/* Error notice if playback failed */}
          {music.playbackError ? (
            <Text style={styles.errorText} numberOfLines={2}>
              ⚠️ {music.playbackError}
            </Text>
          ) : null}

          {/* Time and Progress Track bar */}
          <View style={styles.seekRow}>
            <Text style={styles.timeText}>{formatTime(currentSeconds)}</Text>
            <View style={styles.progressTrackContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${music.progress || 0}%` }]} />
              </View>
            </View>
            <Text style={styles.timeText}>{formatTime(music.duration)}</Text>
          </View>

          {/* Minimal playback controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={music.prevTrack} style={styles.controlBtn}>
              <PrevIcon size={12} color="#6F405F" />
            </TouchableOpacity>

            <TouchableOpacity onPress={seekBackward} style={styles.controlBtn}>
              <SkipBackwardIcon size={12} color="#6F405F" />
            </TouchableOpacity>

            <TouchableOpacity onPress={music.togglePlay} style={styles.playBtn}>
              {music.isBuffering ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : music.isPlaying ? (
                <PauseIcon size={10} color="#FFFFFF" />
              ) : (
                <PlayIcon size={10} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={seekForward} style={styles.controlBtn}>
              <SkipForwardIcon size={12} color="#6F405F" />
            </TouchableOpacity>

            <TouchableOpacity onPress={music.nextTrack} style={styles.controlBtn}>
              <NextIcon size={12} color="#6F405F" />
            </TouchableOpacity>

            <TouchableOpacity onPress={music.toggleMute} style={styles.muteBtn}>
              {music.isMuted ? (
                <MuteIcon size={14} color="#8C8385" />
              ) : (
                <VolumeIcon size={14} color="#6F405F" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ── 2. COMPACT FIXED MINI BUBBLE ── */
        <TouchableOpacity
          onPress={() => music.setIsWidgetOpen(true)}
          activeOpacity={0.95}
          style={styles.bubble}
        >
          {/* Cover Art Rotating Disc */}
          <Animated.Image
            source={getCoverSource(music.currentTrack.coverUrl)}
            style={[
              styles.bubbleDisc,
              {
                transform: [{ rotate: discRotation }]
              }
            ]}
          />

          <Text style={styles.bubbleText} numberOfLines={1}>
            {music.currentTrack.title}
          </Text>

          {/* Quick Play/Pause toggle */}
          <TouchableOpacity
            onPress={music.togglePlay}
            style={styles.bubblePlayBtn}
          >
            {music.isBuffering ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ transform: [{ scale: 0.6 }] }} />
            ) : music.isPlaying ? (
              <PauseIcon size={7} color="#FFFFFF" />
            ) : (
              <PlayIcon size={7} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  widgetContainer: {
    position: 'absolute',
    bottom: 75,
    right: 16,
    zIndex: 9999,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    paddingRight: 10,
    borderRadius: 24,
    backgroundColor: '#6F405F',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#2D1D15',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    maxWidth: 160,
  },
  bubbleDisc: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  bubbleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 6,
    marginRight: 6,
    flex: 1,
  },
  bubblePlayBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubblePlayText: {
    fontSize: 8,
    color: '#FFFFFF',
  },

  expandedCard: {
    width: 290,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8DDD5',
    padding: 12,
    elevation: 20,
    shadowColor: '#2D1D15',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    gap: 8,
  },
  dragHandleIndicator: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#A09695',
    marginRight: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2F0',
    paddingBottom: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#6F405F',
  },
  closeBtn: {
    padding: 2,
  },
  closeBtnText: {
    fontSize: 13,
    color: '#8C8385',
    fontWeight: 'bold',
  },

  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#FAF5F7',
  },
  trackDisc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#6F405F',
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1D15',
  },
  trackArtist: {
    fontSize: 11,
    color: '#8C8385',
    fontWeight: '600',
    marginTop: 2,
  },

  errorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D9534F',
    textAlign: 'center',
    marginVertical: 2,
  },

  seekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: 2,
  },
  timeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8C8385',
  },
  progressTrackContainer: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F3EFEF',
    overflow: 'hidden',
  },
  progressTrack: {
    height: '100%',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6F405F',
    borderRadius: 2.5,
  },

  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  controlBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6F405F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#6F405F',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  muteBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
