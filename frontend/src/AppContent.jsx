import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useThemeStore } from "./store/useThemeStore";

export default function AppContent() {
  const { theme } = useThemeStore();
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      const email = user?.emailAddresses?.[0]?.emailAddress;
      const username = user?.username;
      //password : hellorym

      if (email === "rymbachrouch11m04@gmail.com" || username === "rymbach") {
        navigate("/dashboard");
      }
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  return <div data-theme={theme}></div>;
}