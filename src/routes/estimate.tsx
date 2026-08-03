import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout route for /estimate. File-based routing treats this file as the
 * parent of the routes under src/routes/estimate/, so it must render <Outlet/>
 * for the child pages (the estimate form at /estimate and the thank-you page
 * at /estimate/thank-you) to appear. Each child provides its own page head;
 * this layout adds none.
 */
export const Route = createFileRoute("/estimate")({
  component: () => <Outlet />,
});
