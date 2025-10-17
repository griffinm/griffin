import { Outlet } from 'react-router-dom';
import { Card } from '@mantine/core';

export const NoAuthLayout = () => {
  return (
    <div className="bg-gray-50 h-screen w-screen flex-1">
      <div className="p-4 flex align-center justify-center items-center gap-2">
        <img 
          src="/notes-icon.png" 
          alt="Griffin Logo" 
          className="h-16 w-16 object-contain"
        />
        <h1 className="text-2xl font-bold">Bear Notes</h1>
      </div>

      <div className="flex flex-col flex-1 items-center px-4 sm:px-0">
        <Card w={{ base: '100%', md: 400 }} className="mt-[25px] sm:mt-[100px]">
          <Outlet />
        </Card>
      </div>
    </div>
  )
}

