'use client'
import React, { useState } from 'react'
import LiveStream from '@/components/LiveStream'

const Page = () => {
  const [role, setRole] = useState('host')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Agora Live Streaming</h1>
      <div className="space-x-4 mb-6">
        <button 
          onClick={() => setRole("host")} 
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            role === "host" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-800"
          }`}
        >
          Join as Host
        </button>
        <button 
          onClick={() => setRole("audience")} 
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            role === "audience" ? "bg-green-600 text-white" : "bg-gray-300 text-gray-800"
          }`}
        >
          Join as Audience
        </button>
      </div>
      <LiveStream channelName="test" userRole={role} />
    </div>
  )
}

export default Page
