import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none ${className}`}
      {...props}
    />
  )
)

Input.displayName = 'Input'
