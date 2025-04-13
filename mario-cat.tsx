"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'

const GRAVITY = 0.5
const JUMP_STRENGTH = 12
const MOVE_SPEED = 5
const CAT_WIDTH = 75  // 黑猫大小1.5倍
const CAT_HEIGHT = 75
const SUNFLOWER_SIZE = 30
const SCORE_BG_WIDTH = 200
const SCORE_BG_HEIGHT = 60

// 预定义方块位置和类型，根据新的图片重新调整
const BLOCKS = [
  // 第一行
  { x: 50, y: 100, type: '块1-默认起点', width: 200, height: 100 },  // 默认起点

  // 第二行
  { x: 200, y: 200, type: '块2-启动', width: 200, height: 100 },     // 启动
  { x: 400, y: 200, type: '块3-深度工作', width: 300, height: 100 }, // 深度工作

  // 第三行
  { x: 300, y: 300, type: '块4-午间空地', width: 200, height: 100 }, // 午间空地

  // 第四行
  { x: 200, y: 400, type: '块5-漫游玩耍', width: 400, height: 100 }, // 漫游玩耍

  // 第五行
  { x: 500, y: 500, type: '块6-关机', width: 200, height: 100 },     // 关机
  { x: 700, y: 500, type: '块7-浅度工作', width: 200, height: 100 }  // 浅度工作
]

// 预定义向日葵位置
const SUNFLOWER_POSITIONS = [
  // 左上角区域
  { x: 180, y: 400 },  // Morning! 区域
  { x: 240, y: 350 },
  
  // 中上部区域
  { x: 400, y: 100 },  // Focus 区域附近
  { x: 450, y: 150 },
  { x: 500, y: 200 },
  
  // 右上角区域
  { x: 700, y: 200 },  // 休耕区域
  { x: 750, y: 250 },
  
  // 中部区域
  { x: 300, y: 300 },  // Warn Up 区域
  { x: 350, y: 350 },
  { x: 500, y: 300 },  // 深度工作区域
  { x: 550, y: 350 },
  
  // 右部区域
  { x: 650, y: 400 },  // 午间空地
  { x: 700, y: 450 },
  
  // 底部区域
  { x: 400, y: 500 },  // Play! 区域
  { x: 450, y: 550 }
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
    x: 100,
    y: 100,  // 调整初始位置到第一个方块上
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
      return (
        x < block.x + block.width &&
        x + width > block.x &&
        y < block.y + block.height &&
        y + height > block.y
      )
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
        // 在左上角绘制计分背景
        ctx.drawImage(
          scoreBgImage.current,
          10,  // x坐标
          10,  // y坐标
          SCORE_BG_WIDTH,
          SCORE_BG_HEIGHT
        )

        // 在背景上绘制分数
        ctx.fillStyle = '#FFD700'  // 金色
        ctx.font = 'bold 32px Arial'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        
        // 绘制向日葵图标
        if (sunflowerImage.current) {
          ctx.drawImage(
            sunflowerImage.current,
            30,  // x坐标
            25,  // y坐标
            30,  // 向日葵图标宽度
            30   // 向日葵图标高度
          )
        }
        
        // 绘制分数
        ctx.fillText(
          `× ${score}`,
          70,  // x坐标（向日葵图标右侧）
          40   // y坐标（垂直居中）
        )
      }
    }, 1000 / 60)

    return () => clearInterval(gameLoop)
  }, [assetsLoaded, cat, sunflowers, score, gameOver, blocks, checkCollision])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={1000}   // 调整画布大小以适应新的布局
        height={800}
        className="border border-gray-300"
      />
    </div>
  )
} 