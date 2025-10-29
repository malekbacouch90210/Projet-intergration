import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { FaUser } from "react-icons/fa";

function Navbar() {
  const { isSignedIn } = useUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-yellow-400/40 py-3 shadow-lg">
      <div className="container mx-auto flex items-center justify-between px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-yellow-300 rounded">
            <FaUser className="w-4 h-4 text-pink-900 drop-shadow-[0_0_6px_rgba(255,105,180,0.8)]" />
          </div>
          <span className="text-pink-500 font-semibold tracking-wide">
            ADMIN DASHBOARD
          </span>
        </div>

        {/* Auth Buttons */}
        <nav className="flex items-center gap-5">
          {isSignedIn ? (
            <UserButton />
          ) : (
            <>
              <SignInButton>
                <button className="border border-pink-500 text-pink-500 px-3 py-1.5 rounded-md text-sm hover:text-yellow-300 hover:bg-pink-500/10 transition-all">
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton>
                <button className="border border-pink-500 text-pink-500 px-3 py-1.5 rounded-md text-sm hover:text-yellow-300 hover:bg-pink-500/10 transition-all">
                  Sign Up
                </button>
              </SignUpButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;