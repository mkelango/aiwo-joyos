import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Animated, Easing, Modal, type ModalProps } from 'react-native'
import { useReduceMotion } from '../lib/store'
import { EASE_BRAND, motion } from '../theme/tokens'

/**
 * The reduced-motion fade for a Modal: 0→1 over 120 ms on open, 1→0 over 120 ms on close, and
 * the Modal stays up until the fade-out ends. Without Reduce Motion it follows `open` at full
 * opacity and the Modal's own animation does the work. Pass the result's `visible` to the Modal
 * and its `opacity` to an Animated.View that fills it.
 */
export function useReducedFade(open: boolean, reduce: boolean) {
  const opacity = useRef(new Animated.Value(open && !reduce ? 1 : 0)).current
  const [up, setUp] = useState(open)
  useEffect(() => {
    if (!reduce) {
      opacity.setValue(1)
      setUp(open)
      return
    }
    if (open) setUp(true)
    const run = Animated.timing(opacity, { toValue: open ? 1 : 0, duration: motion.d1, easing: Easing.bezier(...EASE_BRAND), useNativeDriver: true })
    run.start(({ finished }) => {
      if (finished && !open) setUp(false)
    })
    return () => run.stop()
  }, [open, reduce, opacity])
  return { opacity, visible: reduce ? open || up : open }
}

/**
 * A Modal that keeps the brand's reduced-motion rule (Playbook p53): under Reduce Motion (the
 * system's or the member's own) it never slides and never jumps, it fades in and out over 120 ms.
 * Otherwise it is a plain Modal with its own animationType (fade by default).
 *
 * Under Reduce Motion the Modal is made transparent for the fade, so the screen beneath shows
 * through rather than a blank window: give the content its own background (a full-screen room
 * does already). A Modal that unmounts instead of closing fades in but cannot fade out; keep it
 * mounted and drive `visible` for the 120 ms fade-out too.
 */
export function FadeModal({ visible = true, animationType = 'fade', transparent, children, ...rest }: ModalProps & { children: ReactNode }) {
  const reduce = useReduceMotion()
  const fade = useReducedFade(visible, reduce)
  return (
    <Modal {...rest} visible={fade.visible} transparent={reduce ? true : transparent} animationType={reduce ? 'none' : animationType}>
      <Animated.View style={{ flex: 1, opacity: fade.opacity }} pointerEvents={visible ? 'auto' : 'none'}>
        {children}
      </Animated.View>
    </Modal>
  )
}
