"use client"

import MarioCat from '../mario-cat'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">黑猫的一天</h1>
      <MarioCat />
      <div className="mt-8 text-center">
        <p className="text-lg mb-4">游戏操作说明：</p>
        <ul className="text-left">
          <li>← → ↑ ↓ 键：控制黑猫移动</li>
          <li>空格键：跳跃</li>
          <li>收集向日葵增加分数</li>
        </ul>
      </div>
    </main>
  )
}