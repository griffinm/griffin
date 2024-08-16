import { RecentNotes } from "./RecentNotes";
import { Tasks } from "./Tasks";
import { useUser } from "../../providers/UserProvider";
import { Typography } from "@mui/material";

export function Home() {
  const { user } = useUser();

  return (
    <div className="p-5 max-w-4xl">
      <div className="pb-6">
        {user?.firstName && (<Typography variant="h5" component="h2">
          Welcome, {user?.firstName}
        </Typography>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <RecentNotes />
        </div>
        <div>
          <Tasks />
        </div>
      </div>
    </div>
  );
}