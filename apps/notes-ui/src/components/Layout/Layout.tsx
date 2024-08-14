import { Outlet } from "react-router";
import { SideNav } from "../SideNav/SideNav";

export function Layout() {
  return (
    <div className="flex flex-row">
      <div className="bg-dark-1 text-white">
        <SideNav />
      </div>
      <div className="grow bg-dark-2">
        <Outlet />
      </div>
    </div>
  )
}
