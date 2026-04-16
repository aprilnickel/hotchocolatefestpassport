'use client'

import { ComponentProps, useId, useRef } from 'react'
import { CircleXIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function InputClear({
  value,
  setValue,
  id,
  className,
  ...props
}: {
  value: string,
  setValue: (value: string) => void
} & ComponentProps<typeof Input>) {
  const inputRef = useRef<HTMLInputElement>(null)

  const inputId = id ?? useId()

  const handleClearInput = () => {
    setValue('')

    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className='relative flex items-center'>
      <Input
        ref={inputRef}
        id={inputId}
        type='text'
        placeholder="Type something..."
        value={value}
        onChange={e => setValue(e.target.value)}
        className={cn('pr-9', className)}
        {...props}
      />
      {value && (
        <Button
          variant='ghost'
          size='icon'
          onClick={handleClearInput}
          className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent h-full'
        >
          <CircleXIcon />
          <span className='sr-only'>Clear input</span>
        </Button>
      )}
    </div>
  )
}

export { InputClear }
