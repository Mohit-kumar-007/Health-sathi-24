import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react'

// A tiny client-side router: enough to move between pages without reloading, and nothing more.
const NAVIGATE_EVENT = 'app:navigate'

export function navigate(path: string, options: { replace?: boolean } = {}) {
  if (options.replace) window.history.replaceState(null, '', path)
  else window.history.pushState(null, '', path)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
}

export function usePathname(): string {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const update = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', update)
    window.addEventListener(NAVIGATE_EVENT, update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(NAVIGATE_EVENT, update)
    }
  }, [])

  return pathname
}

type LinkProps = { to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

// A normal link that switches pages without a reload. Ctrl/Cmd-click and "open in new tab" still work.
export function Link({ to, onClick, ...rest }: LinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    const isPlainClick = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
    if (event.defaultPrevented || !isPlainClick || rest.target === '_blank') return
    event.preventDefault()
    navigate(to)
    window.scrollTo(0, 0)
  }

  return <a href={to} onClick={handleClick} {...rest} />
}
