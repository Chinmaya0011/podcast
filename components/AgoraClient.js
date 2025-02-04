"use client";
import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const AgoraClient = ({ channelName, userRole }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const [client, setClient] = useState(null);
  const [localTrack, setLocalTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [token, setToken] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [uid, setUid] = useState(null);

  const title = "Test Live Stream";
  const username = "user123";
  const eventTime = "2025-02-10T12:00:00Z";

  const apiUrl = "http://localhost:3001/api/generate-token";
  const agoraAppId = "b29d0c64188a4498ae36dedad6737555";

  const fetchToken = async () => {
    try {
      const userUid = userRole === "host" ? 0 : Math.floor(Math.random() * 10000); // Generate random uid for audience
      setUid(userUid);
  
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelName,
          uid: userUid,
          role: userRole,
          title,
          username,
          eventTime,
        }),
      });
  
      const data = await response.json();
  
      if (data.token) {
        setToken(data.token);
      } else {
        console.error("Failed to fetch token:", data.error);
      }
    } catch (error) {
      console.error("Error fetching token:", error);
    }
  };

  const initAgora = async (token) => {
    if (typeof window !== "undefined" && agoraAppId) {
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(agoraClient);
  
      try {
        await agoraClient.join(agoraAppId, channelName, token, uid);
  
        if (userRole === "host") {
          const videoTrack = await AgoraRTC.createCameraVideoTrack();
          setLocalTrack(videoTrack);
          await agoraClient.publish(videoTrack);
        }

        // Audience should only subscribe to the host's stream
        if (userRole === "audience") {
          agoraClient.on("user-published", async (user, mediaType) => {
            await agoraClient.subscribe(user, mediaType);

            // Only display video for the audience (non-host)
            if (mediaType === "video" && user.uid !== uid) {
              if (remoteVideoRefs.current[user.uid]) {
                remoteVideoRefs.current[user.uid].srcObject = new MediaStream([user.videoTrack.getMediaStreamTrack()]);
              }
              setRemoteUsers((prevUsers) => [...prevUsers, user]);
            }
          });
        }

        agoraClient.on("user-unpublished", (user) => {
          setRemoteUsers((prevUsers) =>
            prevUsers.filter((u) => u.uid !== user.uid)
          );
        });

        agoraClient.on("user-left", (user) => {
          setRemoteUsers((prevUsers) =>
            prevUsers.filter((u) => u.uid !== user.uid)
          );
        });
      } catch (error) {
        console.error("Error joining Agora channel:", error);
      }
    } else {
      console.error("Agora App ID is not available.");
    }
  };

  useEffect(() => {
    if (localTrack && localVideoRef.current) {
      localVideoRef.current.srcObject = new MediaStream([localTrack.getMediaStreamTrack()]);
    }
  }, [localTrack]);

  const startStream = () => {
    setIsStreaming(true);
    fetchToken();
  };

  const joinStream = () => {
    fetchToken();  // For audience, just fetch token and join the stream
  };

  const stopStream = async () => {
    if (client && localTrack) {
      await client.leave();
      localTrack.stop();
      localTrack.close();
      setLocalTrack(null);
      setIsStreaming(false);
    }
  };

  const toggleMute = () => {
    if (localTrack) {
      isMuted ? localTrack.setMuted(false) : localTrack.setMuted(true);
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    if (token) {
      initAgora(token);
    }
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Agora Live Streaming - Role: {userRole}
      </h2>
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl">
        {userRole === "host" && localTrack && isStreaming && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            className="w-full md:w-1/2 bg-black rounded-lg shadow-md"
          ></video>
        )}
        {userRole === "audience" && remoteUsers.length > 0 &&
          remoteUsers.map((user) => (
            <video
              key={user.uid}
              autoPlay
              playsInline
              ref={(el) => {
                remoteVideoRefs.current[user.uid] = el;
              }}
              className="w-full md:w-1/2 bg-black rounded-lg shadow-md"
            />
          ))}
      </div>
      {userRole === "host" && !isStreaming && (
        <button
          onClick={startStream}
          className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-600"
        >
          Start Stream
        </button>
      )}
      {userRole === "host" && isStreaming && (
        <>
          <button
            onClick={toggleMute}
            className="mt-4 bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-yellow-600"
          >
            {isMuted ? "Unmute Video" : "Mute Video"}
          </button>
          <button
            onClick={stopStream}
            className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-red-600"
          >
            Stop Stream
          </button>
        </>
      )}
      {userRole === "audience" && !isStreaming && (
        <button
          onClick={joinStream}
          className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-green-600"
        >
          Join Stream
        </button>
      )}
    </div>
  );
};

export default AgoraClient;
