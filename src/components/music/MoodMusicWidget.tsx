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
  const defaultCover = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80';

  return (
    <Animated.View
      style={[
        styles.widgetContainer,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      {music.isWidgetOpen ? (
        /* ── 1. EXPANDED MUSIC PLAYER WIDGET ── */
        <View style={styles.expandedCard}>
          {/* Header Drag Area & Close */}
          <View style={styles.header}>
            <View style={[styles.headerTitleRow, { flex: 1, paddingVertical: 4 }]} {...panResponder.panHandlers}>
              <Text style={{ fontSize: 10, marginRight: 4 }}>✥</Text>
              <Text style={styles.headerTitle}>Mood Radio</Text>
            </View>
            <TouchableOpacity onPress={() => music.setIsWidgetOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Album disc & Song details */}
          <View style={styles.trackCard}>
            <Animated.Image
              source={{ uri: music.currentTrack.coverUrl || defaultCover }}
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
              <Text style={styles.controlIconText}>⏮</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={music.togglePlay} style={styles.playBtn}>
              {music.isBuffering ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.playIconText}>
                  {music.isPlaying ? '⏸' : '▶'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={music.nextTrack} style={styles.controlBtn}>
              <Text style={styles.controlIconText}>⏭</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={music.toggleMute} style={styles.muteBtn}>
              <Text style={styles.muteBtnText}>
                {music.isMuted ? '🔇' : '🔊'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ── 2. COMPACT DRAGGABLE FLOATING MINI BUBBLE ── */
        <TouchableOpacity
          {...panResponder.panHandlers}
          onPress={() => music.setIsWidgetOpen(true)}
          activeOpacity={0.95}
          style={styles.bubble}
        >
          {/* Cover Art Rotating Disc */}
          <Animated.Image
            source={{ uri: music.currentTrack.coverUrl || defaultCover }}
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
            ) : (
              <Text style={styles.bubblePlayText}>
                {music.isPlaying ? '⏸' : '▶'}
              </Text>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  widgetContainer: {
    position: 'absolute',
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
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#6F405F',
    padding: 12,
    elevation: 16,
    shadowColor: '#2D1D15',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    gap: 8,
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
    gap: 8,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FAF5F7',
  },
  trackDisc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#6F405F',
  },
  trackTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2D1D15',
  },
  trackArtist: {
    fontSize: 10,
    color: '#8C8385',
    fontWeight: '600',
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
    height: 4,
    borderRadius: 2,
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
    borderRadius: 2,
  },

  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingTop: 2,
  },
  controlBtn: {
    padding: 6,
  },
  controlIconText: {
    fontSize: 16,
    color: '#2D1D15',
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6F405F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#6F405F',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  playIconText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  muteBtn: {
    padding: 6,
  },
  muteBtnText: {
    fontSize: 14,
  },
});
