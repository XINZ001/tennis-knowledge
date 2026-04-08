import Avatar from 'boring-avatars'

// 基于系统色调的自定义调色板
// forest 系 + amber 系 + 岩石灰暖色 + 点缀色
const PALETTE = [
  '#4A7C59',  // forest 主色
  '#3A6347',  // forest-dark
  '#D4913D',  // amber 主色
  '#8B6F4E',  // 岩石棕
  '#A3B5A6',  // 浅苔绿
]

/**
 * 用户头像组件 — 基于 boring-avatars 的 beam 风格
 * @param {string}  name  用户名或任意字符串（决定头像样式）
 * @param {number}  size  头像尺寸（px），默认 32
 * @param {boolean} square 是否方形，默认 false（圆形）
 * @param {string}  className 额外样式
 */
export default function UserAvatar({ name = 'Climber', size = 32, square = false, className = '' }) {
  return (
    <span className={`inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      <Avatar
        size={size}
        name={name}
        variant="beam"
        colors={PALETTE}
        square={square}
      />
    </span>
  )
}
