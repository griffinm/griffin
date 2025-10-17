import { createBrowserRouter } from "react-router-dom";
import { NoAuthLayout } from "@/layouts/NoAuthLayout";
import { LogInPage } from "@/pages/LogInPage";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <NoAuthLayout />,
    children: [
      {
        path: "/login",
        element: <LogInPage />,
      },
    ],
  }
]);
