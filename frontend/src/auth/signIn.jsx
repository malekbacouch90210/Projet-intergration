import React from 'react'
import { SignIn} from '@clerk/clerk-react';

function signIn() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
        <SignIn/>
    </div>
  )
}

export default signIn

