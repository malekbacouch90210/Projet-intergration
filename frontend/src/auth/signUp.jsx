import React from 'react'
import { SignUp} from '@clerk/clerk-react';

function signUp() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
        <SignUp/>
    </div>
  )
}

export default signUp
