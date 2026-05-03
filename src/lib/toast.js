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
  el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${message}</span>`
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
