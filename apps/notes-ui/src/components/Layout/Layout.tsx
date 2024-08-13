import { Outlet } from "react-router";
import { SideNav } from "../SideNav/SideNav";

export function Layout() {
  return (
    <div className="flex flex-row">
      <div>
        <SideNav />
      </div>
      <div className="grow">
        <Outlet />
      </div>
    </div>
  )
}
