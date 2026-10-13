import type { ReactNode } from 'react'
import { Icon } from '@/components/ui/icons'

const CLS = { warn: 'hx-banner hx-banner--warn', err: 'hx-banner hx-banner--err' } as const

/** Aviso (`.hx-banner`): `warn` para dado antigo, `err` para falha (role="alert"). */
export function Banner({
  kind,
  title,
  children,
  action,
}: {
  kind: 'warn' | 'err'
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className={CLS[kind]} role={kind === 'err' ? 'alert' : 'status'}>
      <Icon name={kind === 'err' ? 'cloud' : 'alert'} size={20} />
      <div>
        <b>{title}</b>
        {children && <span className="dim">{children}</span>}
        {action && <div style={{ marginTop: 10 }}>{action}</div>}
      </div>
    </div>
  )
}
