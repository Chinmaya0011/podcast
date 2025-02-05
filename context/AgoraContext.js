// AgoraContext.js
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const AgoraContext = createContext();

export const useAgora = () => {
  return useContext(AgoraContext);
};

export const AgoraProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [localTracks, setLocalTracks] = useState({ audioTrack: null, videoTrack: null });
  const [token, setToken] = useState('');
  const [uid, setUid] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [role, setRole] = useState('host'); // You can use this from the main app component

  const apiUrl = 'http://localhost:3001/api/generate-token'; // Your backend token generator
  const agoraAppId = 'b29d0c64188a4498ae36dedad6737555'; // Replace with your Agora App ID

  // Fetch token from backend
  const fetchToken = async (channelName, userRole) => {
    try {
      const userUid = userRole === 'host' ? 0 : Math.floor(Math.random() * 10000);
      setUid(userUid);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName,
          uid: userUid,
          role: userRole,
          title: 'Live Session',
          username: 'User123',
          eventTime: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (data.token) {
        setToken(data.token);
      } else {
        console.error('Failed to fetch token:', data.error);
      }
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  // Initialize Agora
  const initAgora = async (channelName, token, userRole) => {
    if (!agoraAppId || !channelName || !token) {
      console.error('Missing required Agora credentials.');
      return;
    }

    const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    setClient(agoraClient);

    try {
      await agoraClient.join(agoraAppId, channelName, token, uid);
      if (userRole === 'host') {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalTracks({ audioTrack, videoTrack });
        await agoraClient.publish([audioTrack, videoTrack]);
        setIsStreaming(true);
      }

      if (userRole === 'audience') {
        agoraClient.on('user-published', async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);
        });
        agoraClient.on('user-unpublished', (user) => {
          console.log('User unpublished:', user);
        });
        agoraClient.on('user-left', (user) => {
          console.log('User left:', user);
        });
      }
    } catch (error) {
      console.error('Error joining Agora channel:', error);
    }
  };

  // Toggle video visibility
  const toggleVideo = () => {
    if (localTracks.videoTrack) {
      localTracks.videoTrack.setEnabled(!isVideoVisible);
      setIsVideoVisible(!isVideoVisible);
    }
  };

  // Toggle audio mute
  const toggleAudio = () => {
    if (localTracks.audioTrack) {
      localTracks.audioTrack.setEnabled(!isAudioMuted);
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Stop streaming
  const stopStreaming = async () => {
    if (client && localTracks.audioTrack && localTracks.videoTrack) {
      await client.unpublish([localTracks.audioTrack, localTracks.videoTrack]);
      localTracks.audioTrack.close();
      localTracks.videoTrack.close();
      setLocalTracks({ audioTrack: null, videoTrack: null });
      setIsStreaming(false);
    }
  };

  return (
    <AgoraContext.Provider
      value={{
        client,
        localTracks,
        token,
        uid,
        isStreaming,
        isVideoVisible,
        isAudioMuted,
        role,
        setRole,
        fetchToken,
        initAgora,
        toggleVideo,
        toggleAudio,
        stopStreaming,
      }}
    >
      {children}
    </AgoraContext.Provider>
  );
};
