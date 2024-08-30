import { UserProvider } from "./../UserProvider";
import { NoteProvider } from "./../NoteProvider";
import { TaskProvider } from "./../TaskProvider";
import { ToastProvider } from "./../ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <UserProvider>
        <NoteProvider>
          <TaskProvider>
            {children}
          </TaskProvider>
        </NoteProvider>
      </UserProvider>
    </ToastProvider>
  )
}
