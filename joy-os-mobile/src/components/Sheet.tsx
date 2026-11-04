import { type ReactNode } from 'react'
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDict } from '../lib/i18n'
import { useReduceMotion } from '../lib/store'
import { useTheme } from '../theme/ThemeProvider'
import { KIT } from './_i18n'
import { useReducedFade } from './FadeModal'
import { Icon } from './Icon'
import { Body } from './Text'

/**
 * Sheet — a bottom sheet on a Modal. Scrim tap, the close button and Android back all close it.
 * Content scrolls; keep a sheet to one idea ("Why this, today").
 * Under Reduce Motion (the system's or the member's own) the sheet fades in and out over 120 ms
 * (the instant token, Playbook p53) instead of the Modal's own fade: it never moves, never jumps.
 */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const { c, radius, space } = useTheme()
  const insets = useSafeAreaInsets()
  const t = useDict(KIT)
  const reduce = useReduceMotion()
  const fade = useReducedFade(open, reduce)
  return (
    <Modal visible={fade.visible} transparent animationType={reduce ? 'none' : 'fade'} onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={{ flex: 1, opacity: fade.opacity }} pointerEvents={open ? 'auto' : 'none'}>
        {/* The keyboard must not cover a Field in the sheet or its footer button. iOS needs the padding;
            on Android the Modal window already resizes for the keyboard. */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={{ position: 'absolute', inset: 0, backgroundColor: c.scrim }} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('close')} />
          <View
            accessibilityViewIsModal
            style={{
              backgroundColor: c.paper,
              borderTopLeftRadius: radius.sheet,
              borderTopRightRadius: radius.sheet,
              maxHeight: '88%',
              width: '100%',
              maxWidth: 640,
              alignSelf: 'center',
              paddingBottom: insets.bottom + space.s2,
            }}
          >
            <View style={{ alignItems: 'center', paddingTop: 8 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.lineStrong }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
              <Body size={19} weight="medium" accessibilityRole="header" style={{ flex: 1 }}>
                {title}
              </Body>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('close')} hitSlop={8} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: pressed ? c.paperSunk : undefined })}>
                <Icon name="x" size={20} color={c.ink2} />
              </Pressable>
            </View>
            <ScrollView automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.s3, paddingBottom: space.s2, gap: space.s2 }}>{children}</ScrollView>
            {footer ? <View style={{ paddingHorizontal: space.gutter, paddingTop: space.s1, gap: space.s1 }}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  )
}
