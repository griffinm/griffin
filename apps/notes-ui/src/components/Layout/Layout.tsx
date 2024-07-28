import { Outlet } from "react-router";
import { SideNav } from "../SideNav/SideNav";

export function Layout() {
  return (
    <div className="flex flex-row">
      <div className="w-[275px]">
        <SideNav />
      </div>
      <div className="grow">
        <Outlet />
      </div>
    </div>
  )
}
