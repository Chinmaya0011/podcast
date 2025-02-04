'use client'
import React, { useState } from 'react'
import LiveStream from '@/components/LiveStream'
const Page = () => {
  const[role,setRole]=useState('host')
  return (
    <div>
          <h1>Agora Live Streaming</h1>
            <button onClick={() => setRole("host")}>Join as Host</button>
            <button onClick={() => setRole("audience")}>Join as Audience</button>
            <LiveStream channelName="test" userRole={role} />
    </div>
  )
}

export default Page