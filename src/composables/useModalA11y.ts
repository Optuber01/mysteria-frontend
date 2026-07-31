import {nextTick, onUnmounted, type Ref, watch} from 'vue'

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useModalA11y(
  isOpen: Ref<boolean>,
  container: Ref<HTMLElement | null>,
  close: () => void,
) {
  let trigger: HTMLElement | null = null
  let previousOverflow = ''
  let previousRootOverflow = ''
  let inertedElements: Array<{element: HTMLElement; wasInert: boolean}> = []

  const cleanup = (restoreFocus = true) => {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = previousOverflow
    document.documentElement.style.overflow = previousRootOverflow
    inertedElements.forEach(({element, wasInert}) => {
      element.inert = wasInert
    })
    inertedElements = []
    if (restoreFocus && trigger?.isConnected) trigger.focus({preventScroll: true})
    trigger = null
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }

    if (event.key !== 'Tab' || !container.value) return
    const controls = [...container.value.querySelectorAll<HTMLElement>(focusableSelector)]
      .filter(element => !element.hasAttribute('hidden'))
    if (!controls.length) {
      event.preventDefault()
      container.value.focus()
      return
    }

    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  watch(isOpen, async open => {
    if (!open) {
      cleanup()
      return
    }

    trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousOverflow = document.body.style.overflow
    previousRootOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeydown)
    await nextTick()
    const modalLayer = container.value?.closest<HTMLElement>('.modal-ritual-overlay')
    inertedElements = [...document.body.children]
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== modalLayer && element.tagName !== 'SCRIPT')
      .map(element => ({element, wasInert: element.inert}))
    inertedElements.forEach(({element}) => {
      element.inert = true
    })
    const firstControl = container.value?.querySelector<HTMLElement>(focusableSelector)
    ;(firstControl ?? container.value)?.focus({preventScroll: true})
  })

  onUnmounted(() => cleanup(false))
}
