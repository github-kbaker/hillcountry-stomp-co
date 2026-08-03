import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout route for /services. File-based routing treats this file as the
 * parent of the routes under src/routes/services/, so it must render <Outlet/>
 * for the child pages (the services index and each service detail page) to
 * appear. Each child provides its own page head; this layout adds none.
 */
export const Route = createFileRoute("/services")({
  component: () => <Outlet />,
});
