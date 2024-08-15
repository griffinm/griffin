import { useState } from 'react'
import { Outlet } from "react-router";
import { SideNav } from "../SideNav/SideNav";
import MenuIcon from '@mui/icons-material/Menu';
import classnames from 'classnames'

export function Layout() {
  const [menuExpanded, setMenuExpanded] = useState(false);

  const outletClasses = classnames(
    "grow bg-dark-2 md:block",
    {
      "hidden": menuExpanded,
    },
  );

  return (
    <div className="flex flex-col h-[100vh]">

      <div className="md:hidden bg-dark-1 text-white p-2">
        <MenuIcon onClick={() => setMenuExpanded(!menuExpanded)} />
      </div>

      <div>
        <div className="flex flex-row grow">
          <div className="bg-dark-1 text-white">
            <SideNav menuExpanded={menuExpanded} />
          </div>
          <div className={outletClasses}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
