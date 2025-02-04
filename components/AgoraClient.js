"use client"
import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const AgoraClient = ({ channelName, userRole }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [client, setClient] = useState(null);
  const [localTrack, setLocalTrack] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [token, setToken] = useState('');
  const [isStreaming, setIsStreaming] = useState(false); // Track streaming state
  const [isMuted, setIsMuted] = useState(false); // Track if video is muted

  const [uid, setUid] = useState(null); // Dynamically assigned UID
  const title = "Test Live Stream";   // Hardcoded stream title
  const username = "user123";         // Hardcoded username
  const eventTime = "2025-02-10T12:00:00Z";  // Hardcoded event time

  const apiUrl = 'http://localhost:3001/api/generate-token'; // Hardcoded API URL for local development

  const agoraAppId = 'b29d0c64188a4498ae36dedad6737555';  // Hardcoded Agora App ID

  const fetchToken = async () => {
    try {
      // Dynamically assign UID (host gets 0, others get unique IDs)
      const userUid = userRole === 'host' ? 0 : Date.now(); // Example UID for audience
      setUid(userUid); // Set UID dynamically based on role

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelName,
          uid: userUid, // Use dynamically assigned UID
          role: userRole,
          title,
          username,
          eventTime,
        }),
      });

      const data = await response.json();

      if (data.token) {
        setToken(data.token); // Store the generated token
      } else {
        console.error("Failed to fetch token:", data.error);
      }
    } catch (error) {
      console.error("Error fetching token:", error);
    }
  };

  const initAgora = async (token) => {
    if (typeof window !== 'undefined' && agoraAppId) {
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);

      try {
        // Join the Agora channel with the role
        await agoraClient.join(agoraAppId, channelName, token, uid);

        if (userRole === 'host') {
          const videoTrack = await AgoraRTC.createCameraVideoTrack();
          setLocalTrack(videoTrack); // Set the local track
          await agoraClient.publish(videoTrack); // Publish the track
        }

        agoraClient.on('user-published', async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);
          if (mediaType === 'video') {
            setRemoteUser(user);
            remoteVideoRef.current.srcObject = new MediaStream([user.videoTrack.getMediaStreamTrack()]);
          }
        });

        agoraClient.on('user-unpublished', (user) => {
          if (user === remoteUser) {
            setRemoteUser(null);
          }
        });
      } catch (error) {
        console.error("Error joining Agora channel:", error);
      }
    } else {
      console.error("Agora App ID is not available.");
    }
  };

  // Use useEffect to set the srcObject of the local video element
  useEffect(() => {
    if (localTrack && localVideoRef.current) {
      localVideoRef.current.srcObject = new MediaStream([localTrack.getMediaStreamTrack()]);
    }
  }, [localTrack]);

  const startStream = () => {
    setIsStreaming(true);
    fetchToken(); // Fetch token when "Start" is clicked
  };

  const stopStream = async () => {
    if (client && localTrack) {
      await client.leave(); // Leave the Agora channel
      localTrack.stop(); // Stop the local video track
      setLocalTrack(null); // Clear the local track
      setIsStreaming(false); // Set streaming state to false
    }
  };

  const toggleMute = () => {
    if (localTrack) {
      isMuted ? localTrack.setMuted(false) : localTrack.setMuted(true);
      setIsMuted(!isMuted); // Toggle mute state
    }
  };

  useEffect(() => {
    if (token) {
      initAgora(token); // Initialize Agora once token is fetched
    }
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Agora Live Streaming - Role: {userRole}</h2>
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl">
        {userRole === 'host' && localTrack && isStreaming && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            className="w-full md:w-1/2 bg-black rounded-lg shadow-md"
          ></video>
        )}
        {remoteUser && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full md:w-1/2 bg-black rounded-lg shadow-md"
          ></video>
        )}
      </div>
      {userRole === 'host' && !isStreaming && (
        <button
          onClick={startStream}
          className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-600"
        >
          Start Stream
        </button>
      )}
      {userRole === 'host' && isStreaming && (
        <>
          <button
            onClick={toggleMute}
            className="mt-4 bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-yellow-600"
          >
            {isMuted ? 'Unmute Video' : 'Mute Video'}
          </button>
          <button
            onClick={stopStream}
            className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-red-600"
          >
            Stop Stream
          </button>
        </>
      )}
    </div>
  );
};

export default AgoraClient;
