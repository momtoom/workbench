import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    // Read the query's own result, not `window.innerWidth`. They are the same
    // number in a plain browser tab, but not inside the Workbench design
    // preview: components there run in the editor's React runtime and only
    // their DOM is portalled into the preview iframe, so `window` is the
    // editor window. The preview delegates viewport media queries to the
    // iframe, so `mql` reports the previewed viewport while `window.innerWidth`
    // reports the editor's -- which left the mobile sidebar unable to open at
    // any preview width.
    const onChange = () => {
      setIsMobile(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
