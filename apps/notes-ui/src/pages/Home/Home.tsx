import { RecentNotes } from "./RecentNotes";
import { Tasks } from "./Tasks";

export function Home() {
  return (
    <div className="p-5 max-w-4xl">
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