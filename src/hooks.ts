import { useEffect, useState } from 'react'
interface InstallEvent extends Event { prompt(): Promise<void> }
/** Exposes Chrome's PWA install prompt so we can show our own Install button. */
export function useInstall() {
  const [ev, setEv] = useState<InstallEvent | null>(null)
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setEv(e as InstallEvent) }
    const done = () => setEv(null)
    window.addEventListener('beforeinstallprompt', on); window.addEventListener('appinstalled', done)
    return () => { window.removeEventListener('beforeinstallprompt', on); window.removeEventListener('appinstalled', done) }
  }, [])
  return ev ? () => { void ev.prompt(); setEv(null) } : null
}
export function useFullscreen() {
  const [fs, setFs] = useState(!!document.fullscreenElement)
  useEffect(() => { const f = () => setFs(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f) }, [])
  const toggle = () => { void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()) }
  return [fs, toggle] as const
}
