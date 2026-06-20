import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <Image
      src="/repogen_logo.png"
      alt="repogen"
      width={size}
      height={size}
      className={className}
    />
  )
}

export function LogoWithText({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo size={24} />
      <span className="text-xl font-medium tracking-tight">repogen</span>
    </div>
  )
}
