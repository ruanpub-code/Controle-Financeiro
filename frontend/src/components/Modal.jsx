import { useEffect, useRef } from 'react'

function getFocusableElements(container) {
  if (!container) return []

  return Array.from(container.querySelectorAll(
    'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
  ))
}

export default function Modal({ open, title, onClose, children }) {
  const cardRef = useRef(null)
  const lastFocusedRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    lastFocusedRef.current = document.activeElement
    document.body.classList.add('modal-open')

    const card = cardRef.current
    const focusFirstElement = () => {
      if (!card) return

      const preferredField = card.querySelector(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
      )

      if (preferredField && typeof preferredField.focus === 'function') {
        preferredField.focus({ preventScroll: true })
        return
      }

      const firstFocusable = getFocusableElements(card)[0]
      if (firstFocusable && typeof firstFocusable.focus === 'function') {
        firstFocusable.focus({ preventScroll: true })
        return
      }

      card.focus({ preventScroll: true })
    }

    const frameId = window.requestAnimationFrame(focusFirstElement)

    const handleKeyDown = (event) => {
      if (!card) return

      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = getFocusableElements(card)
      if (focusable.length === 0) {
        event.preventDefault()
        card.focus({ preventScroll: true })
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey && activeElement === first) {
        event.preventDefault()
        last.focus({ preventScroll: true })
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      window.cancelAnimationFrame(frameId)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.body.classList.remove('modal-open')

      if (lastFocusedRef.current && typeof lastFocusedRef.current.focus === 'function') {
        lastFocusedRef.current.focus({ preventScroll: true })
      }
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={cardRef}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar modal">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
