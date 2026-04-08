import { useEffect, useRef } from 'react'

/**
 * 滚动入场动画 hook
 * 当元素进入视口时添加 'anim-visible' class 触发 CSS 动画
 *
 * @param {Object} options
 * @param {string}  options.threshold  - IntersectionObserver threshold (default 0.15)
 * @param {string}  options.rootMargin - rootMargin (default '0px 0px -40px 0px')
 * @param {boolean} options.once       - 只触发一次 (default true)
 * @returns {React.RefObject}
 */
export function useAnimateIn({ threshold = 0.15, rootMargin = '0px 0px -40px 0px', once = true } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // 尊重用户系统设置
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('anim-visible', 'anim-done')
      return
    }

    const onAnimEnd = () => {
      el.classList.add('anim-done')
      el.removeEventListener('animationend', onAnimEnd)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.addEventListener('animationend', onAnimEnd)
          el.classList.add('anim-visible')
          if (once) observer.unobserve(el)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      el.removeEventListener('animationend', onAnimEnd)
    }
  }, [threshold, rootMargin, once])

  return ref
}

/**
 * 批量子元素 stagger 入场
 * 给容器 ref，当容器进入视口时，所有 .anim-ready 子元素依次触发
 *
 * @param {Object} options
 * @param {number} options.stagger - 每个子元素延迟 ms (default 60)
 * @returns {React.RefObject}
 */
export function useStaggerIn({ stagger = 60, rootMargin = '0px 0px -40px 0px' } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const children = container.querySelectorAll('.anim-ready')
          children.forEach((child, i) => {
            if (reducedMotion) {
              child.classList.add('anim-visible', 'anim-done')
            } else {
              child.style.animationDelay = `${i * stagger}ms`
              child.addEventListener('animationend', function handler() {
                child.classList.add('anim-done')
                child.removeEventListener('animationend', handler)
              })
              child.classList.add('anim-visible')
            }
          })
          observer.unobserve(container)
        }
      },
      { threshold: 0.05, rootMargin }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [stagger, rootMargin])

  return ref
}
