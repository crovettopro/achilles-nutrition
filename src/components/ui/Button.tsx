import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  block?: boolean
}

/** Primary = gold CTA, ghost = outlined. Both match the handoff exactly. */
export default function Button({
  variant = 'primary',
  block = true,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${block ? styles.block : ''} ${className}`}
      {...props}
    />
  )
}
