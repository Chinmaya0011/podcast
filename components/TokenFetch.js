import React, { useEffect } from "react";
import { useAgora } from "../context/AgoraContext";

const TokenFetch = ({ channelName, userRole }) => {
  const { token, fetchToken } = useAgora();

  useEffect(() => {
    if (!token) {
      fetchToken(channelName, userRole);
    }
  }, [token, fetchToken, channelName, userRole]);

  return null;
};

export default TokenFetch;
