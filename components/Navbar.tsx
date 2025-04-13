import { useState } from 'react'

export default function Navbar() {
  const [showGuide, setShowGuide] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-50 flex items-center justify-between px-8">
      <h1 className="text-2xl font-bold">黑猫的一天</h1>
      
      <button 
        onClick={() => setShowGuide(true)}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        游戏指南
      </button>

      {/* 非模态指南弹窗 */}
      {showGuide && (
        <div className="absolute top-20 right-8 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">游戏指南</h3>
            <button 
              onClick={() => setShowGuide(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            <p className="text-gray-600">控制方式：</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>← → 键：左右移动</li>
              <li>↑ ↓ 键：上下移动</li>
              <li>空格键：跳跃</li>
              <li>收集向日葵增加分数</li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  )
} 