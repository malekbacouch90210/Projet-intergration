import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ClerkProviderWrapper from "./providers/ClerkProviderWrapper.jsx";
import "./App.css";



ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProviderWrapper>
      <App />
    </ClerkProviderWrapper>
  </React.StrictMode>
);
