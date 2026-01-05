import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            'h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0',
            'cursor-pointer',
            className
          )}
          {...props}
        />
        {label && <span className="ml-2 text-sm text-gray-700">{label}</span>}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
