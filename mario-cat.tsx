"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'

const GRAVITY = 0.5
const JUMP_STRENGTH = 15
const MOVE_SPEED = 7
const CAT_WIDTH = 118
const CAT_HEIGHT = 118
const SUNFLOWER_SIZE = 45
const SCORE_BG_WIDTH = 256
const SCORE_BG_HEIGHT = 128
const BLOCK_NAME_HEIGHT = 60  // 添加块名称显示区域高度

// 移除网格系统，使用精确像素值
const BLOCKS = [
  // 块1 - 默认起点（左下方）
  { 
    x: 192,
    y: 576,
    type: '块1-默认起点',
    width: 192,
    height: 64
  },

  // 块2 - 启动（中上方）
  { 
    x: 386,
    y: 448,
    type: '块2-启动',
    width: 192,
    height: 64
  },

  // 块3 - 深度工作（顶部中间）
  { 
    x: 576,
    y: 320,
    type: '块3-深度工作',
    width: 384,
    height: 64
  },

  // 块4 - 午间空地（右上方）
  { 
    x: 960,
    y: 448,
    type: '块4-午间空地',
    width: 192,
    height: 64
  },

  // 块5 - 漫游玩耍（中下方）
  { 
    x: 646,
    y: 640,
    type: '块5-漫游玩耍',
    width: 384,
    height: 64
  },

  // 块6 - 关机（底部中间）
  { 
    x: 451,
    y: 768,
    type: '块6-关机',
    width: 192,
    height: 64
  },

  // 块7 - 浅度工作（右下方）
  { 
    x: 1088,
    y: 576,
    type: '块7-浅度工作',
    width: 255,
    height: 64
  }
]

// 按照块的顺序重新排列向日葵位置
const SUNFLOWER_POSITIONS = [
  // 块1 - 默认起点区域
  { x: 134, y: 670 },
  { x: 268, y: 670 },
  
  // 块2 - 启动区域
  { x: 402, y: 402 },
  { x: 536, y: 402 },
  
  // 块3 - 深度工作区域
  { x: 536, y: 134 },
  { x: 670, y: 134 },
  { x: 804, y: 134 },
  
  // 块4 - 午间空地区域
  { x: 1072, y: 402 },
  { x: 1206, y: 402 },
  
  // 块5 - 漫游玩耍区域
  { x: 536, y: 871 },
  { x: 670, y: 871 },
  { x: 804, y: 871 },
  { x: 938, y: 871 },
  
  // 块6 - 关机区域
  { x: 536, y: 1072 },
  { x: 670, y: 1072 },
  
  // 块7 - 浅度工作区域
  { x: 1206, y: 670 },
  { x: 1340, y: 670 }
]

interface Cat {
  x: number
  y: number
  velocityY: number
  velocityX: number
  velocityYManual: number
  isJumping: boolean
  direction: 'left' | 'right'
}

interface Sunflower {
  x: number
  y: number
  collected: boolean
}

interface Block {
  x: number
  y: number
  type: string
  width: number
  height: number
  image: HTMLImageElement | null
}

export default function MarioCat() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cat, setCat] = useState<Cat>({
    x: 77,    // 设置为块1左侧的起始位置
    y: 568,   // 设置为合适的起始高度
    velocityY: 0,
    velocityX: 0,
    velocityYManual: 0,
    isJumping: false,
    direction: 'right'
  })
  const [sunflowers, setSunflowers] = useState<Sunflower[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [currentBlock, setCurrentBlock] = useState<string>('')  // 添加当前块名称状态

  // 加载游戏资源
  const catImage = useRef<HTMLImageElement | null>(null)
  const backgroundImage = useRef<HTMLImageElement | null>(null)
  const sunflowerImage = useRef<HTMLImageElement | null>(null)
  const blockImages = useRef<Record<string, HTMLImageElement>>({})
  const scoreBgImage = useRef<HTMLImageElement | null>(null)  // 新增：计分背景图片
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  useEffect(() => {
    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })

    Promise.all([
      loadImage('/game-assets/black-cat.png'),
      loadImage('/game-assets/background.png'),
      loadImage('/game-assets/sunflower.png'),
      loadImage('/game-assets/向日葵计数.png'),
      ...BLOCKS.map(block => loadImage(`/game-assets/${block.type}.png`))
    ]).then(([cat, background, sunflower, scoreBg, ...blockImgs]) => {
      catImage.current = cat
      backgroundImage.current = background
      sunflowerImage.current = sunflower
      scoreBgImage.current = scoreBg
      
      // 存储方块图片
      BLOCKS.forEach((block, index) => {
        blockImages.current[block.type] = blockImgs[index]
      })

      // 初始化方块
      setBlocks(BLOCKS.map(block => ({
        ...block,
        image: blockImgs[BLOCKS.findIndex(b => b.type === block.type)]
      })))

      setAssetsLoaded(true)
    })
  }, [])

  // 生成向日葵
  useEffect(() => {
    if (!assetsLoaded) return

    const generateSunflowers = () => {
      const newSunflowers = SUNFLOWER_POSITIONS.map(pos => ({
        x: pos.x,
        y: pos.y,
        collected: false
      }))
      setSunflowers(newSunflowers)
    }

    generateSunflowers()
  }, [assetsLoaded])

  // 检查碰撞
  const checkCollision = useCallback((x: number, y: number, width: number, height: number) => {
    return blocks.find(block => {
      const collision = (
        x < block.x + block.width &&
        x + width > block.x &&
        y < block.y + block.height &&
        y + height > block.y
      )
      // 如果发生碰撞，更新当前块名称
      if (collision) {
        setCurrentBlock(block.type.replace('块', '空间').replace('-', '：'))
      }
      return collision
    })
  }, [blocks])

  // 处理键盘输入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return

      switch (e.code) {
        case 'ArrowLeft':
          setCat(prev => ({ ...prev, velocityX: -MOVE_SPEED, direction: 'left' }))
          break
        case 'ArrowRight':
          setCat(prev => ({ ...prev, velocityX: MOVE_SPEED, direction: 'right' }))
          break
        case 'ArrowUp':
          setCat(prev => ({ ...prev, velocityYManual: -MOVE_SPEED }))
          break
        case 'ArrowDown':
          setCat(prev => ({ ...prev, velocityYManual: MOVE_SPEED }))
          break
        case 'Space':
          if (!cat.isJumping) {
            setCat(prev => ({ ...prev, velocityY: -JUMP_STRENGTH, isJumping: true }))
          }
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'ArrowRight':
          setCat(prev => ({ ...prev, velocityX: 0 }))
          break
        case 'ArrowUp':
        case 'ArrowDown':
          setCat(prev => ({ ...prev, velocityYManual: 0 }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [cat.isJumping, gameOver])

  // 游戏主循环
  useEffect(() => {
    if (!assetsLoaded) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const gameLoop = setInterval(() => {
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制背景
      if (backgroundImage.current) {
        ctx.drawImage(backgroundImage.current, 0, 0, canvas.width, canvas.height)
      }

      // 绘制方块
      blocks.forEach(block => {
        if (block.image) {
          ctx.drawImage(block.image, block.x, block.y, block.width, block.height)
        }
      })

      // 更新猫咪位置
      setCat(prev => {
        const newY = prev.y + prev.velocityY + prev.velocityYManual
        const newX = prev.x + prev.velocityX

        // 重力效果
        const newVelocityY = prev.velocityY + GRAVITY

        // 检查与方块的碰撞
        const blockCollision = checkCollision(newX, newY, CAT_WIDTH, CAT_HEIGHT)
        
        // 如果碰到方块顶部
        if (blockCollision && prev.velocityY >= 0) {
          const blockTop = blockCollision.y
          if (prev.y + CAT_HEIGHT <= blockTop + 10) {
            return {
              ...prev,
              y: blockTop - CAT_HEIGHT,
              velocityY: 0,
              isJumping: false
            }
          }
        }

        // 地面碰撞检测
        if (newY > canvas.height - CAT_HEIGHT) {
          return {
            ...prev,
            y: canvas.height - CAT_HEIGHT,
            velocityY: 0,
            isJumping: false
          }
        }

        // 天花板碰撞检测
        if (newY < 0) {
          return {
            ...prev,
            y: 0,
            velocityY: 0,
            velocityYManual: 0
          }
        }

        // 边界检测
        const boundedX = Math.max(0, Math.min(canvas.width - CAT_WIDTH, newX))

        return {
          ...prev,
          x: boundedX,
          y: newY,
          velocityY: newVelocityY
        }
      })

      // 检测向日葵收集
      setSunflowers(prev => {
        return prev.map(sunflower => {
          if (sunflower.collected) return sunflower

          const distance = Math.sqrt(
            Math.pow(cat.x + CAT_WIDTH/2 - (sunflower.x + SUNFLOWER_SIZE/2), 2) +
            Math.pow(cat.y + CAT_HEIGHT/2 - (sunflower.y + SUNFLOWER_SIZE/2), 2)
          )

          if (distance < (CAT_WIDTH + SUNFLOWER_SIZE) / 2) {
            setScore(s => s + 1)
            return { ...sunflower, collected: true }
          }
          return sunflower
        })
      })

      // 绘制向日葵
      sunflowers.forEach(sunflower => {
        if (!sunflower.collected && sunflowerImage.current) {
          ctx.drawImage(
            sunflowerImage.current,
            sunflower.x,
            sunflower.y,
            SUNFLOWER_SIZE,
            SUNFLOWER_SIZE
          )
        }
      })

      // 绘制猫咪
      if (catImage.current) {
        ctx.save()
        if (cat.direction === 'left') {
          ctx.scale(-1, 1)
          ctx.drawImage(
            catImage.current,
            -cat.x - CAT_WIDTH,
            cat.y,
            CAT_WIDTH,
            CAT_HEIGHT
          )
        } else {
          ctx.drawImage(
            catImage.current,
            cat.x,
            cat.y,
            CAT_WIDTH,
            CAT_HEIGHT
          )
        }
        ctx.restore()
      }

      // 绘制分数背景和分数
      if (scoreBgImage.current) {
        ctx.drawImage(
          scoreBgImage.current,
          0,  // x位置改为0
          0,  // y位置改为0
          SCORE_BG_WIDTH,
          SCORE_BG_HEIGHT
        )
      }

      // 绘制向日葵图标和分数
      ctx.fillStyle = '#FFD700'  // 金色
      ctx.font = 'bold 48px Arial'  // 字体大小
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      
      const scoreText = `${score}`
      const textMetrics = ctx.measureText(scoreText)
      const textWidth = textMetrics.width
      
      // 计算向日葵和文本的总宽度
      const totalWidth = 45 + 15 + textWidth  // 向日葵宽度 + 间距 + 文本宽度
      const startX = (SCORE_BG_WIDTH - totalWidth) / 2  // 居中偏移
      const centerY = SCORE_BG_HEIGHT / 2  // 垂直居中位置
      
      // 绘制向日葵图标
      if (sunflowerImage.current) {
        ctx.drawImage(
          sunflowerImage.current,
          startX,          // 从计算的起始位置开始
          centerY - 22.5,  // 垂直居中（图标高度的一半）
          45,             // 向日葵图标宽度
          45              // 向日葵图标高度
        )
      }

      // 绘制分数文本
      ctx.fillText(
        scoreText,
        startX + 45 + 15,  // 向日葵右侧位置 + 间距
        centerY           // 与向日葵垂直对齐
      )

      // 绘制当前块名称
      if (currentBlock) {
        // 绘制文本
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 32px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(
          currentBlock,
          canvas.width / 2,  // 水平居中
          8                  // 固定在顶部8像素位置
        )
      }
    }, 1000 / 60)

    return () => clearInterval(gameLoop)
  }, [assetsLoaded, cat, sunflowers, score, gameOver, blocks, checkCollision, currentBlock])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={1340}    // 设置为精确的宽度
        height={952}    // 设置为精确的高度
        className="border border-gray-300"
      />
    </div>
  )
} 