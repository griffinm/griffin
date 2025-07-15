import { RecentNotes } from "./RecentNotes";
import { Tasks } from "./Tasks";
import { Questions } from "./Questions";
import { useUser } from "../../providers/UserProvider";
import { Typography } from "@mui/material";
import { useNotes } from "../../providers/NoteProvider";
import { useEffect } from "react";

export function Home() {
  const { user } = useUser();
  const { setCurrentNotebook } = useNotes();

  useEffect(() => {
    setCurrentNotebook();
  }, []);

  return (
    <div className="p-5 max-w-4xl">
      <div className="pb-6">
        {user?.firstName && (<Typography variant="h5" component="h2">
          Welcome, {user?.firstName}
        </Typography>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col justify-start align-top gap-4">
          <Tasks />
          <RecentNotes />
        </div>
        <div>
          <Questions />
        </div>
      </div>
    </div>
  );
}
