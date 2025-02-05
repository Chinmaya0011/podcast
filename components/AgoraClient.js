import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const AgoraClient = ({ channelName, userRole }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const [client, setClient] = useState(null);
  const [localTracks, setLocalTracks] = useState({ audioTrack: null, videoTrack: null });
  const [token, setToken] = useState("");
  const [uid, setUid] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const apiUrl = "http://localhost:3001/api/generate-token"; // Your backend token generator
  const agoraAppId = "b29d0c64188a4498ae36dedad6737555"; // Replace with your Agora App ID

  const fetchToken = async () => {
    try {
      const userUid = userRole === "host" ? 0 : Math.floor(Math.random() * 10000);
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
          title: "Live Session",
          username: "User123",
          eventTime: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      console.log("Token API Response:", data); // Debugging

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
    if (!agoraAppId || !channelName || !token) {
      console.error("Missing required Agora credentials.");
      return;
    }

    const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    setClient(agoraClient);

    try {
      await agoraClient.join(agoraAppId, channelName, token, uid);
      console.log("Agora joined successfully");

      if (userRole === "host") {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalTracks({ audioTrack, videoTrack });

        await agoraClient.publish([audioTrack, videoTrack]);
        setIsStreaming(true);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = new MediaStream([videoTrack.getMediaStreamTrack()]);
        }
      }

      if (userRole === "audience") {
        agoraClient.on("user-published", async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);
          console.log("User published:", user, mediaType);

          if (mediaType === "video") {
            if (!remoteVideoRefs.current[user.uid]) {
              remoteVideoRefs.current[user.uid] = document.createElement("video");
              remoteVideoRefs.current[user.uid].autoplay = true;
              remoteVideoRefs.current[user.uid].playsInline = true;
              remoteVideoRefs.current[user.uid].className = "audience-video"; // Add the class for fixed size
              document.body.appendChild(remoteVideoRefs.current[user.uid]);
            }
            remoteVideoRefs.current[user.uid].srcObject = new MediaStream([user.videoTrack.getMediaStreamTrack()]);
          }

          if (mediaType === "audio") {
            user.audioTrack.play();
          }
        });

        agoraClient.on("user-unpublished", (user) => {
          console.log("User unpublished:", user);
        });

        agoraClient.on("user-left", (user) => {
          console.log("User left:", user);
          if (remoteVideoRefs.current[user.uid]) {
            remoteVideoRefs.current[user.uid].remove();
            delete remoteVideoRefs.current[user.uid];
          }
        });
      }
    } catch (error) {
      console.error("Error joining Agora channel:", error);
    }
  };

  const toggleVideo = () => {
    if (localTracks.videoTrack) {
      localTracks.videoTrack.setEnabled(!isVideoVisible);
      setIsVideoVisible(!isVideoVisible);
    }
  };

  const toggleAudio = () => {
    if (localTracks.audioTrack) {
      localTracks.audioTrack.setEnabled(!isAudioMuted);
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const stopStreaming = async () => {
    if (client && localTracks.audioTrack && localTracks.videoTrack) {
      await client.unpublish([localTracks.audioTrack, localTracks.videoTrack]);
      localTracks.audioTrack.close();
      localTracks.videoTrack.close();
      setLocalTracks({ audioTrack: null, videoTrack: null });
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    if (token) {
      initAgora(token);
    }
  }, [token]);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Agora Video Call - Role: {userRole}</h2>
      <div className="flex flex-col space-y-4">
        {userRole === "host" && (
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              className={`w-full h-auto ${isVideoVisible ? "" : "hidden"}`}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 flex justify-center space-x-4">
              <button
                onClick={toggleVideo}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {isVideoVisible ? "Hide Video" : "Show Video"}
              </button>
              <button
                onClick={toggleAudio}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {isAudioMuted ? "Unmute Audio" : "Mute Audio"}
              </button>
              <button
                onClick={stopStreaming}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Stop Streaming
              </button>
            </div>
          </div>
        )}
        {userRole === "host" && !isStreaming && (
          <button
            onClick={fetchToken}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Start Stream
          </button>
        )}
        {userRole === "audience" && (
          <div className="relative">
            <div className="w-full flex justify-center mt-10">
              {Object.keys(remoteVideoRefs.current).map((uid) => (
                <div key={uid} className="mb-4">
                  <video
                    ref={(el) => {
                      if (el) {
                        remoteVideoRefs.current[uid].srcObject = el.srcObject;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="audience-video" // Apply the fixed size class for audience video
                  />
                </div>
              ))}
            </div>
            <button
              onClick={fetchToken}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Join Stream
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgoraClient;
