import type { ButtonHTMLAttributes, MouseEvent } from 'react'
import { Icon, type IconName } from '@/components/ui/icons'

type Kind = 'primary' | 'secondary' | 'ghost' | 'danger'

const KIND: Record<Kind, string> = {
  primary: 'hx-btn--primary',
  secondary: 'hx-btn--secondary',
  ghost: 'hx-btn--ghost',
  danger: 'hx-btn--danger',
}

type NativeProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>

export interface ButtonProps extends NativeProps {
  kind?: Kind
  size?: 'md' | 'lg'
  block?: boolean
  icon?: IconName
  iconRight?: IconName
  loading?: boolean
}

/** Botão em pílula da v2 (`.hx-btn`). No máximo um `primary` visível por tela. */
export function Button({
  kind = 'primary',
  size = 'md',
  block,
  icon,
  iconRight,
  loading,
  disabled,
  type = 'button',
  onClick,
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    'hx-btn',
    KIND[kind],
    size === 'lg' ? 'hx-btn--lg' : '',
    block ? 'hx-btn--block' : '',
    loading ? 'is-loading' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      {icon && <Icon name={icon} size={20} />}
      {children}
      {iconRight &&
        (kind === 'primary' && iconRight === 'play' ? (
          <span className="hx-btn-ico">
            <Icon name="play" size={13} filled />
          </span>
        ) : (
          <Icon name={iconRight} size={20} />
        ))}
    </button>
  )
}

export interface IconButtonProps extends Omit<NativeProps, 'aria-label' | 'children'> {
  icon: IconName
  /** Rótulo acessível obrigatório (ícone sozinho). */
  label: string
  bare?: boolean
  iconSize?: number
}

/** Botão de ícone 44×44 (`.hx-icbtn`). */
export function IconButton({ icon, label, bare, iconSize = 22, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={type} className={bare ? 'hx-icbtn hx-icbtn--bare' : 'hx-icbtn'} aria-label={label} {...rest}>
      <Icon name={icon} size={iconSize} />
    </button>
  )
}
