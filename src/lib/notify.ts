export type NoticeType = 'success' | 'error' | 'info'

export function notify(message: string, type: NoticeType = 'success') {
  window.dispatchEvent(new CustomEvent('lilkank-notice', { detail: { message, type } }))
}
