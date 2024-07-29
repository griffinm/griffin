import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Note } from "./components/Note";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <div>Home</div>,
      },
      {
        path: "/note/:noteId",
        element: <Note />,
      },
    ]
  },
]);
