import { Outlet } from "react-router-dom";

export function NoAuthLayout() {
  return (
    <div>
      <h1>No Auth Layout</h1>
      <Outlet />
    </div>
  );
}
