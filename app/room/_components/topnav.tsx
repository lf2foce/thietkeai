
import {
    SignInButton,
    SignedIn,
    SignedOut,
    UserButton
  } from '@clerk/nextjs'

export default function TopNav() {
    return (
        <nav className="flex items-center justify-between h-16 px-6 lg:px-8">
           
                <a className="flex items-center justify-center text-xl font-semibold text-gray-900 dark:text-white">
                    
                    <img
                        className="h-8 w-auto"
                        src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
                        alt="Workflow"
                    />
                    
                </a>
                <div> Gallery</div>
                <div> Nice</div>


                <div> 
                    <SignedOut>
                        <SignInButton />
                    </SignedOut>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </div>
            
            </nav>
        )
    }