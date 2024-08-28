import { useState } from 'react'
import { Outlet } from "react-router";
import { SideNav } from "../SideNav/SideNav";
import MenuIcon from '@mui/icons-material/Menu';
import classnames from 'classnames'
import { useSearchParams } from 'react-router-dom';

export function Layout() {
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [searchParams] = useSearchParams();
  const isFullScreen = searchParams.get('fs') === 'true';
  
  const outletClasses = classnames(
    "grow bg-dark-2 md:block",
    {
      "hidden": menuExpanded,
      'h-[100vh]': isFullScreen,
    },
  );

  return (
    <div className="flex flex-col h-[100vh]">

      {!isFullScreen && (
        <div className="md:hidden bg-dark-1 text-white p-2">
          <MenuIcon onClick={() => setMenuExpanded(!menuExpanded)} />
        </div>
      )}

      <div className="grow">
        <div className="flex flex-row grow">
          {!isFullScreen && (
            <div className="bg-dark-1 text-white">
              <SideNav menuExpanded={menuExpanded} />
            </div>
          )}
          <div className={outletClasses}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
