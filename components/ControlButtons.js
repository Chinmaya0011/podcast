import React from "react";
import { useAgora } from "../context/AgoraContext";

const ControlButtons = ({ userRole }) => {
  const { token, isStreaming, isMuted, fetchToken, stopStream, toggleMute } = useAgora();

  const startStream = async () => {
    await fetchToken();
  };

  return (
    <div>
      {userRole === "host" && !isStreaming && (
        <button onClick={startStream} className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-600">
          Start Stream
        </button>
      )}
      {userRole === "host" && isStreaming && (
        <>
          <button onClick={toggleMute} className="mt-4 bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-yellow-600">
            {isMuted ? "Unmute Video" : "Mute Video"}
          </button>
          <button onClick={stopStream} className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-red-600">
            Stop Stream
          </button>
        </>
      )}
    </div>
  );
};

export default ControlButtons;
