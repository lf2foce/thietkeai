'use client'

import { UploadButton } from '@/utils/uploadthing'
import {
    SignInButton,
    SignedIn,
    SignedOut,
    UserButton
  } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function TopNav() {
    const router = useRouter();
    return (
        <nav className="flex w-full items-center justify-between border-b border-gray-200 text-xl font-semibold">
           
                {/* <a className="flex items-center justify-center text-xl font-semibold text-gray-900 dark:text-white">
                    
                    <img
                        className="h-8 w-auto"
                        src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
                        alt="Workflow"
                    />
                    
                </a> */}
                <div> Gallery</div>


                <div className="flex flex-row"> 
                    <SignedOut>
                        <SignInButton />
                    </SignedOut>
                    <SignedIn>
                        <UploadButton endpoint="imageUploader"
                        onClientUploadComplete={()=>{
                            router.refresh();
                        }}
                        />
                        <UserButton />
                    </SignedIn>
                </div>
            
            </nav>
        )
    }