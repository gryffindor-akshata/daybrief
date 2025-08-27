'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'

interface HeaderNavProps {
  selectedDate: string
  onDateChange: (date: string) => void
  onSendRecap: () => void
  isRecapLoading?: boolean
}

export function HeaderNav({ 
  selectedDate, 
  onDateChange, 
  onSendRecap, 
  isRecapLoading = false 
}: HeaderNavProps) {
  const { data: session } = useSession()

  const user = session?.user

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl text-gray-900">DayBrief</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            />
            {user?.provider && <ProviderBadge provider={user.provider} />}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={onSendRecap}
            disabled={isRecapLoading}
            variant="outline"
            size="sm"
          >
            {isRecapLoading ? 'Sending...' : 'Send Recap'}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ''} alt={user.name || ''} />
                    <AvatarFallback>
                      {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/signin">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

function ProviderBadge({ provider }: { provider: string }) {
  const colors = {
    google: 'bg-red-100 text-red-700',
    microsoft: 'bg-blue-100 text-blue-700',
  }

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
      {provider === 'google' ? 'Google' : 'Microsoft'}
    </span>
  )
}
