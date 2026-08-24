import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { apiMusicService } from '../services/apiMusicService';
import { localStorage } from '../services/localStorage';
import { Alert } from 'react-native';

const MoodMusicContext = createContext(null);

export function MoodMusicProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [trackIndex, setTrackIndex] = useState(-1);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackError, setPlaybackError] = useState('');

  const audioPlayerRef = useRef(new AudioRecorderPlayer());
  const queueRef = useRef([]);
  const trackIndexRef = useRef(-1);

  // Load public catalog on startup
  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
      try {
        const response = await apiMusicService.getPublicTracks({ page: 0, size: 20 });
        const tracks = response?.content || [];
        if (active && Array.isArray(tracks) && tracks.length > 0) {
          const playable = tracks.filter((t) => t?.audioUrl);
          if (playable.length > 0) {
            queueRef.current = playable;
            trackIndexRef.current = 0;
            setQueue(playable);
            setTrackIndex(0);
            setCurrentTrack(playable[0]);
          }
        }
      } catch (e) {
        console.warn('[MoodMusicContext] Catalog load failed:', e.message);
      }
    };
    loadCatalog();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    return () => {
      try {
        audioPlayerRef.current.stopPlayer();
        audioPlayerRef.current.removePlayBackListener();
      } catch (e) {}
    };
  }, []);

  const playAt = useCallback(async (index, nextQueue = queueRef.current) => {
    const tracks = Array.isArray(nextQueue)
      ? nextQueue.map((track) => ({
          ...track,
          audioUrl: track?.audioUrl || track?.privateAudioUrl || track?.publicAudioUrl,
          coverUrl: track?.coverUrl || track?.privateCoverUrl || track?.publicCoverUrl || track?.cover,
        })).filter((track) => track?.audioUrl)
      : [];
    if (!tracks.length) {
      setPlaybackError('This track has no playable audio source.');
      return;
    }

    const safeIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    const track = tracks[safeIndex];

    try {
      await audioPlayerRef.current.stopPlayer();
      await audioPlayerRef.current.removePlayBackListener();

      queueRef.current = tracks;
      trackIndexRef.current = safeIndex;
      setQueue(tracks);
      setTrackIndex(safeIndex);
      setCurrentTrack(track);
      setPlaybackError('');
      setProgress(0);
      setDuration(track.durationSeconds || 0);
      setIsBuffering(true);
      setIsPlaying(true);
      setIsWidgetOpen(true);

      const token = localStorage.getItem('auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      let playUrl = track.audioUrl;
      if (token && playUrl && (playUrl.includes('/api/admin/') || playUrl.includes('/api/music/'))) {
        const separator = playUrl.includes('?') ? '&' : '?';
        playUrl = `${playUrl}${separator}token=${token}&access_token=${token}`;
      }

      await audioPlayerRef.current.startPlayer(playUrl, headers);
      setIsBuffering(false);
      audioPlayerRef.current.setVolume(isMuted ? 0.0 : volume);

      audioPlayerRef.current.addPlayBackListener((e) => {
        if (e.duration > 0) {
          setProgress((e.currentPosition / e.duration) * 100);
          setDuration(e.duration / 1000); // ms to seconds
        }
        if (e.duration > 0 && e.currentPosition >= e.duration - 400) {
          audioPlayerRef.current.removePlayBackListener();
          nextTrack();
        }
      });
    } catch (err) {
      console.warn('[MoodMusicContext] Playback error:', err);
      setIsPlaying(false);
      setIsBuffering(false);
      setPlaybackError('Unable to play this track. Please try another track.');
      Alert.alert(
        'Playback Error Diagnosis',
        `Track Title: ${track?.title || 'N/A'}\nPlay URL: ${track?.audioUrl || 'N/A'}\nError: ${err?.message || err}`
      );
    }
  }, [volume, isMuted]);

  const nextTrack = useCallback(() => {
    const tracks = queueRef.current;
    if (!tracks.length) return;
    playAt(trackIndexRef.current + 1, tracks);
  }, [playAt]);

  const prevTrack = useCallback(() => {
    const tracks = queueRef.current;
    if (!tracks.length) return;
    playAt(trackIndexRef.current - 1, tracks);
  }, [playAt]);

  const playTrack = useCallback((track, visibleQueue = []) => {
    const tracks = visibleQueue.some((item) => item.id === track.id) ? visibleQueue : [track, ...visibleQueue];
    const index = tracks.findIndex((item) => item.id === track.id);
    return playAt(index < 0 ? 0 : index, tracks);
  }, [playAt]);

  const togglePlay = useCallback(async () => {
    if (!currentTrack) return;
    try {
      if (isPlaying) {
        await audioPlayerRef.current.pausePlayer();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        setIsBuffering(true);
        try {
          await audioPlayerRef.current.resumePlayer();
        } catch (e) {
          const token = localStorage.getItem('auth_token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          let playUrl = currentTrack.audioUrl;
          if (token && playUrl && (playUrl.includes('/api/admin/') || playUrl.includes('/api/music/'))) {
            const separator = playUrl.includes('?') ? '&' : '?';
            playUrl = `${playUrl}${separator}token=${token}&access_token=${token}`;
          }
          await audioPlayerRef.current.startPlayer(playUrl, headers);
        }
        setIsBuffering(false);
        audioPlayerRef.current.setVolume(isMuted ? 0.0 : volume);

        audioPlayerRef.current.addPlayBackListener((e) => {
          if (e.duration > 0) {
            setProgress((e.currentPosition / e.duration) * 100);
            setDuration(e.duration / 1000);
          }
          if (e.duration > 0 && e.currentPosition >= e.duration - 400) {
            audioPlayerRef.current.removePlayBackListener();
            nextTrack();
          }
        });
      }
    } catch (err) {
      console.warn('[MoodMusicContext] togglePlay error:', err);
      setIsPlaying(false);
      setIsBuffering(false);
    }
  }, [currentTrack, isPlaying, volume, isMuted, nextTrack]);

  const handleSeek = useCallback(async (newPercent) => {
    try {
      const seekPos = Math.floor((newPercent / 100) * duration * 1000);
      await audioPlayerRef.current.seekToPlayer(seekPos);
      setProgress(newPercent);
    } catch (e) {
      console.warn('[MoodMusicContext] Seek error:', e);
    }
  }, [duration]);

  const setVolume = useCallback((newVolume) => {
    const safeVolume = Math.min(1, Math.max(0, Number(newVolume)));
    try {
      audioPlayerRef.current.setVolume(isMuted ? 0.0 : safeVolume);
    } catch (e) {}
    setVolumeState(safeVolume);
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const nextMute = !isMuted;
    try {
      audioPlayerRef.current.setVolume(nextMute ? 0.0 : volume);
    } catch (e) {}
    setIsMuted(nextMute);
  }, [isMuted, volume]);

  return (
    <MoodMusicContext.Provider value={{
      queue,
      trackIndex,
      currentTrack,
      isPlaying,
      isWidgetOpen,
      progress,
      duration,
      volume,
      isMuted,
      isBuffering,
      playbackError,
      setIsWidgetOpen,
      playTrack,
      togglePlay,
      nextTrack,
      prevTrack,
      handleSeek,
      setVolume,
      toggleMute,
    }}>
      {children}
    </MoodMusicContext.Provider>
  );
}

export function useMoodMusic() {
  const context = useContext(MoodMusicContext);
  if (!context) throw new Error('useMoodMusic must be used within MoodMusicProvider');
  return context;
}
