import React from "react";
import { ClerkProvider } from "@clerk/clerk-react";

const ClerkProviderWrapper = ({ children }) => {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error("Missing Clerk publishable key in environment variables.");
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
};

export default ClerkProviderWrapper;