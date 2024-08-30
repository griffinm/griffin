import { UserProvider } from "./../UserProvider";
import { NoteProvider } from "./../NoteProvider";
import { TaskProvider } from "./../TaskProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <NoteProvider>
        <TaskProvider>
          {children}
        </TaskProvider>
      </NoteProvider>
    </UserProvider>
  )
}
