import { Button } from '@/components/ui/Button'

const CLS = { default: 'hx-toast', err: 'hx-toast hx-toast--err' } as const

/** Toast (`.hx-toast`): confirmação reversível, com ação opcional ("Desfazer"). */
export function Toast({
  message,
  actionLabel,
  onAction,
  kind = 'default',
}: {
  message: string
  actionLabel?: string
  onAction?: () => void
  kind?: 'default' | 'err'
}) {
  return (
    <div className="hx-toast-wrap">
      <div className={CLS[kind]} role={kind === 'err' ? 'alert' : 'status'}>
        <span style={{ flex: 1, minWidth: 0 }}>{message}</span>
        {actionLabel && (
          <Button kind="ghost" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
