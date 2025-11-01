"use client"

import { BarLoader } from 'react-spinners'
import { LayoutDashboard } from 'lucide-react'
import { Authenticated, Unauthenticated } from 'convex/react'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { useStoreUser } from '@/hooks'

import { Button } from './ui/button'

const Header = () => {
  const { isLoading } = useStoreUser()
  const path = usePathname()
  return (
    <header className='fixed top-0 w-full border-b bg-navbar/95 backdrop-blur z-50 supports-[backdrop-filter]:bg-navbar/60'>
      <nav className='container mx-auto px-4 h-16 flex items-center justify-between'>
        <Link href='/' className='flex items-center gap-2'>
          <Image
            src={'/logos/logo.png'}
            alt='Splitx'
            width={200}
            height={80}
            className='h-11 w-auto object-contain p-1'
          />
        </Link>
        {path === '/' && (
          <div className='hidden md:flex items-center gap-6'>
            <Link
              href='#features'
              className='text-sm font-medium text-brand hover:text-yellow-500 transition'
            >Features</Link>
            <Link
              href='#how-it-works'
              className='text-sm font-medium text-brand hover:text-yellow-500 transition'
            >How It Works</Link>
          </div>
        )}

        <div className='flex items-center gap-4'>
          <Authenticated>
            <Link href='/dashboard'>
              <Button
                variant='outline'
                className='hidden md:inline-flex items-center gap-2 text-brand hover:text-yellow-500 hover:bg-white-100 hover:border-yellow-500 transition'
              >
                <LayoutDashboard className='h-4 w-4' />
                Dashboard
              </Button>

              <Button
                variant='ghost'
                className='md:hidden text-brand w-10 h-10 p-0'
              >
                <LayoutDashboard className='h-4 w-4' />
              </Button>
            </Link>
            <UserButton />
          </Authenticated>

          <Unauthenticated>
            <SignInButton>
              <Button variant={'ghost'} className='bg-yellow-400 hover:bg-brand border-none text-white hover:text-white'>Sign In</Button>
            </SignInButton>

            <SignUpButton>
              <Button variant='outline' className='text-brand hover:text-yellow-500 hover:bg-white-100 hover:border-yellow-500 transition'>New User?</Button>
            </SignUpButton>
          </Unauthenticated>
        </div>
      </nav>
      {isLoading && <BarLoader width={'100%'} color={'#BF40BF'} />}
    </header>
  )
}

export default Header