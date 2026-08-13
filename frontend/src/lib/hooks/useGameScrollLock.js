import { useEffect, useRef } from 'react'

/**
 * Mobil oyunlarda scroll ve pull-to-refresh engellemek için hook
 *
 * Özellikler:
 * - Oyun içinde sayfa scroll engellenir (body overflow)
 * - Pull-to-refresh (iOS/Android) devre dışı (overscroll-behavior)
 * - Touch eventlere KARIŞMAZ - oyunların kendi swipe kontrolü çalışır
 * - Oyun dışında normal scroll davranışı korunur
 *
 * Kullanım:
 * ```jsx
 * const gameActive = status === 'playing' || status === 'idle' // overlay açıkken de kilitle
 * useGameScrollLock(gameActive)
 * ```
 *
 * @param {boolean} isActive - Oyun aktif mi (playing + overlay durumları)
 */
export function useGameScrollLock(isActive) {
  const scrollPosition = useRef(0)

  useEffect(() => {
    if (!isActive) {
      // Oyun bitti - scroll pozisyonunu geri yükle
      if (scrollPosition.current) {
        document.body.style.top = ''
        document.body.style.position = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollPosition.current)
        scrollPosition.current = 0
      }

      // Pull-to-refresh stilini kaldır
      const existingStyle = document.getElementById('game-scroll-lock-styles')
      if (existingStyle) {
        existingStyle.remove()
      }

      return
    }

    // === Oyun başladı - kilitle ===

    // Mevcut scroll pozisyonunu kaydet
    scrollPosition.current = window.scrollY

    // Body scroll engelle (iOS için position: fixed + top kaydırma)
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollPosition.current}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    // Pull-to-refresh ve overscroll engelle (CSS)
    // Bu, touch eventlere dokunmaz, sadece browser davranışını kontrol eder
    const style = document.createElement('style')
    style.id = 'game-scroll-lock-styles'
    style.textContent = `
      /* Pull-to-refresh engelle (Chrome/Android) */
      html, body {
        overscroll-behavior: none !important;
      }

      /* iOS için - rubber-band efektini engelle */
      body {
        position: fixed;
        overflow: hidden;
        -webkit-overflow-scrolling: auto !important;
      }

      /* Oyun container'larında overscroll engelle */
      .game-container,
      [class*="game"],
      [class*="Game"] {
        overscroll-behavior: none !important;
      }
    `
    document.head.appendChild(style)

    // Cleanup - oyun bittiğinde
    return () => {
      // Scroll pozisyonunu geri yükle
      if (scrollPosition.current) {
        document.body.style.top = ''
        document.body.style.position = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollPosition.current)
        scrollPosition.current = 0
      }

      // Style tag'i kaldır
      const existingStyle = document.getElementById('game-scroll-lock-styles')
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [isActive])
}
