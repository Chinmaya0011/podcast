'use client'
import React, { createContext, useContext, useState } from 'react';

const AgoraContext = createContext();

export const useAgora = () => {
  return useContext(AgoraContext);
};

export const AgoraProvider = ({ children }) => {
  const [role, setRole] = useState('host');


  return (
    <AgoraContext.Provider value={{role,setRole}}>
      {children}
    </AgoraContext.Provider>
  );
};
