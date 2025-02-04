'use client';
import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-react";

const LiveStream = ({ channelName = "test", userRole = "audience" }) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [client, setClient] = useState(null);
    const [localTrack, setLocalTrack] = useState(null);
    const [remoteUser, setRemoteUser] = useState(null); // Track remote user

    useEffect(() => {
        const initAgora = async () => {
            const response = await fetch(`http://localhost:5000/agora-token?channel=${channelName}&role=${userRole}`);
            const { token, appId, role } = await response.json();

            const agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
            setClient(agoraClient);
            
            await agoraClient.join(appId, channelName, token, null);
            agoraClient.setClientRole(role);

            if (role === "host") {
                const track = await AgoraRTC.createCameraVideoTrack();
                setLocalTrack(track);
                localVideoRef.current.srcObject = new MediaStream([track.getMediaStreamTrack()]);
                await agoraClient.publish([track]);
            }

            agoraClient.on("user-published", async (user, mediaType) => {
                await agoraClient.subscribe(user, mediaType);
                if (mediaType === "video") {
                    setRemoteUser(user); // Set remote user when they join
                    remoteVideoRef.current.srcObject = new MediaStream([user.videoTrack.getMediaStreamTrack()]);
                }
            });

            agoraClient.on("user-unpublished", (user) => {
                if (user === remoteUser) {
                    setRemoteUser(null); // Clear remote user when they leave
                }
            });
        };

        // initAgora();

        return () => {
            if (client) client.leave();
            if (localTrack) localTrack.stop();
        };
    }, [channelName, userRole, client, localTrack, remoteUser]);

    return (
        <div className="flex flex-col items-center justify-center bg-gray-100 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Agora Live Streaming</h2>
            <h3 className="text-lg text-gray-600 mb-4">Role: {userRole}</h3>

            <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl">
                {userRole === "host" && localTrack && (
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

export default LiveStream;
