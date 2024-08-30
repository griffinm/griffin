import { createContext, useContext, useState } from "react";
import { Snackbar } from "@mui/material";

type ToastContextType = {
  showMessage: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showMessage = (message: string) => {
    setMessage(message);
  };

  return (
    <ToastContext.Provider value={{ showMessage }}>
      {children}
      <Snackbar
        open={!!message}
        message={message}
        onClose={() => setMessage(null)}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
