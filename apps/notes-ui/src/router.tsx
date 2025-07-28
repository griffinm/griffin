import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Note } from "./components/Note";
import { TabContainer } from "./components/TabContainer";

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
      {
        path: "/tab-container",
        element: <TabContainer />,
      },
    ]
  },
]);
