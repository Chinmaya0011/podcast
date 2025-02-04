"use client"
import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const AgoraClient = ({ channelName, userRole }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [client, setClient] = useState(null);
  const [localTrack, setLocalTrack] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);

  useEffect(() => {
    const initAgora = async () => {
      const response = await fetch(`/api/get-agora-token?channel=${channelName}&role=${userRole}`);
      const { token, appId } = await response.json();

      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);

      await agoraClient.join(appId, channelName, token, null);
      agoraClient.setClientRole(userRole);

      if (userRole === 'host') {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        setLocalTrack(videoTrack);
        localVideoRef.current.srcObject = new MediaStream([videoTrack.getMediaStreamTrack()]);
        await agoraClient.publish([videoTrack]);
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
    };

    initAgora();

    return () => {
      if (client) client.leave();
      if (localTrack) localTrack.stop();
    };
  }, [channelName, userRole, client, localTrack, remoteUser]);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Agora Live Streaming - Role: {userRole}</h2>
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl">
        {userRole === 'host' && localTrack && (
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
    </div>
  );
};

export default AgoraClient;
