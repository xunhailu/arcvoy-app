import { useEffect } from 'react'

function setMeta(name, content, attr = 'name') {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function useSEO({ title, description, url } = {}) {
  useEffect(() => {
    if (title === undefined && description === undefined) return

    const fullTitle = title ? `${title} — Arcvoy` : 'Arcvoy — Build the Future'
    const desc = description ?? 'Arcvoy connects AI professionals with the world\'s leading AI-first companies. Find your next role today.'
    const canonical = url ?? window.location.href

    document.title = fullTitle

    setMeta('description', desc)
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', desc, 'property')
    setMeta('og:url', canonical, 'property')
    setMeta('og:type', 'website', 'property')
    setMeta('og:site_name', 'Arcvoy', 'property')
    setMeta('twitter:card', 'summary')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', desc)
  }, [title, description, url])
}
