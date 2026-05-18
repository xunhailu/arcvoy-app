let container = null

function getContainer() {
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-root'
    document.body.appendChild(container)
  }
  return container
}

function show(message, type) {
  const c = getContainer()
  const el = document.createElement('div')
  el.className = `toast-item toast-${type}`
  const icons = { success: '✓', error: '✕', info: '·' }
  const icon = document.createElement('span')
  icon.className = 'toast-icon'
  icon.textContent = icons[type] || icons.info
  const msg = document.createElement('span')
  msg.className = 'toast-msg'
  msg.textContent = message
  el.appendChild(icon)
  el.appendChild(msg)
  c.appendChild(el)
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('toast-visible')))
  const dismiss = () => {
    el.classList.remove('toast-visible')
    setTimeout(() => { if (el.parentNode) el.remove() }, 340)
  }
  const t = setTimeout(dismiss, 4200)
  el.addEventListener('click', () => { clearTimeout(t); dismiss() })
}

export const toast = {
  success: msg => show(msg, 'success'),
  error:   msg => show(msg, 'error'),
  info:    msg => show(msg, 'info'),
}
