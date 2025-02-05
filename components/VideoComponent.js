import React, { useEffect, useRef } from "react";
import { useAgora } from "../context/AgoraContext";

const VideoComponent = ({ userRole }) => {
  const { client, localTrack, remoteUsers, uid } = useAgora();
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});

  useEffect(() => {
    if (localTrack && localVideoRef.current) {
      localVideoRef.current.srcObject = new MediaStream([localTrack.getMediaStreamTrack()]);
    }
  }, [localTrack]);

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl">
      {userRole === "host" && localTrack && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          className="w-full md:w-1/2 bg-black rounded-lg shadow-md"
        ></video>
      )}
      {userRole === "audience" &&
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
  );
};

export default VideoComponent;
