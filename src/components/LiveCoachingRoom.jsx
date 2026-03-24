import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LiveKitRoom,
  VideoTrack,
  AudioTrack,
  useRemoteParticipants,
  useLocalParticipant,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RoomEvent } from 'livekit-client';

/**
 * LiveCoachingRoom — connects to a BeyondPresence avatar session via LiveKit WebRTC.
 *
 * Props:
 *  - livekitUrl:   wss://... LiveKit server URL
 *  - livekitToken: JWT token for the user participant
 *  - roomName:     LiveKit room name (for display)
 *  - onDisconnect: callback when session ends
 *  - onError:      callback on connection error
 */
export default function LiveCoachingRoom({ livekitUrl, livekitToken, roomName, onDisconnect, onError }) {
  const [connected, setConnected] = useState(false);
  const [avatarConnected, setAvatarConnected] = useState(false);

  const handleConnected = useCallback(() => {
    setConnected(true);
  }, []);

  const handleDisconnected = useCallback(() => {
    setConnected(false);
    onDisconnect?.();
  }, [onDisconnect]);

  const handleError = useCallback((err) => {
    console.error('[LiveCoaching] Connection error:', err);
    onError?.(err.message || 'Connection failed');
  }, [onError]);

  if (!livekitUrl || !livekitToken) {
    return (
      <div className="live-coaching__placeholder">
        <p>Configuration LiveKit manquante</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={livekitUrl}
      token={livekitToken}
      connect={true}
      audio={true}
      video={true}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
      onError={handleError}
      style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <RoomContent connected={connected} onAvatarStatus={setAvatarConnected} />
      <div className="live-coaching__status">
        {!connected && <span className="live-coaching__dot live-coaching__dot--connecting" />}
        {connected && !avatarConnected && <span className="live-coaching__dot live-coaching__dot--waiting" />}
        {connected && avatarConnected && <span className="live-coaching__dot live-coaching__dot--active" />}
        <span className="live-coaching__label">
          {!connected ? 'Connexion...' :
           !avatarConnected ? 'En attente du coach...' :
           'Session live active'}
        </span>
      </div>
    </LiveKitRoom>
  );
}

function RoomContent({ connected, onAvatarStatus }) {
  const remoteParticipants = useRemoteParticipants();
  const localParticipant = useLocalParticipant();
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true }
  );

  useEffect(() => {
    onAvatarStatus(remoteParticipants.length > 0);
  }, [remoteParticipants.length, onAvatarStatus]);

  // Debug: log all participants and tracks so we can see what BeyondPresence sends
  useEffect(() => {
    if (remoteParticipants.length > 0) {
      console.log('[LiveCoaching] Remote participants:', remoteParticipants.map(p => ({
        identity: p.identity,
        sid: p.sid,
        trackCount: p.trackPublications?.size,
        tracks: Array.from(p.trackPublications?.values() || []).map(t => ({
          source: t.source,
          kind: t.kind,
          subscribed: t.isSubscribed,
          enabled: t.isEnabled,
        })),
      })));
    }
    console.log('[LiveCoaching] All tracks:', tracks.map(t => ({
      participantIdentity: t.participant?.identity,
      source: t.source,
      kind: t.publication?.kind,
    })));
  }, [remoteParticipants, tracks]);

  const localIdentity = localParticipant?.localParticipant?.identity;

  // Find avatar tracks: any remote participant (not local user)
  const avatarVideoTrack = tracks.find(
    t => t.participant?.identity !== localIdentity &&
      (t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare)
  );
  const avatarAudioTrack = tracks.find(
    t => t.participant?.identity !== localIdentity &&
      t.source === Track.Source.Microphone
  );

  return (
    <div className="live-coaching__content">
      {avatarVideoTrack ? (
        <div className="live-coaching__avatar-video">
          <VideoTrack trackRef={avatarVideoTrack} />
        </div>
      ) : (
        <div className="live-coaching__avatar-placeholder">
          <div className="coaching__avatar-circle" style={{ width: 100, height: 100 }}>
            <span style={{ fontSize: 48 }}>🧑‍💼</span>
          </div>
          {connected && remoteParticipants.length === 0 && (
            <p style={{ color: 'var(--jb-muted)', fontSize: 'var(--jb-text-sm)', marginTop: 12 }}>
              L'avatar se connecte...
            </p>
          )}
          {connected && remoteParticipants.length > 0 && (
            <p style={{ color: 'var(--jb-muted)', fontSize: 'var(--jb-text-sm)', marginTop: 12 }}>
              Avatar connecté, chargement vidéo...
            </p>
          )}
        </div>
      )}
      {avatarAudioTrack && <AudioTrack trackRef={avatarAudioTrack} />}
    </div>
  );
}
