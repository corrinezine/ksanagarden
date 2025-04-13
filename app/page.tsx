"use client"

import MarioCat from '@/mario-cat'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* 游戏区域 */}
      <div className="pt-24 pb-12 px-8">
        <div className="max-w-[1340px] mx-auto">
          <div className="sticky top-20">
            <MarioCat />
          </div>
        </div>
      </div>
    </main>
  )
}