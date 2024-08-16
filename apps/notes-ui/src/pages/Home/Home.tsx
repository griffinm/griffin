import { RecentNotes } from "./RecentNotes";

export function Home() {
  return (
    <div className="p-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <RecentNotes />
        </div>
      </div>
    </div>
  );
}