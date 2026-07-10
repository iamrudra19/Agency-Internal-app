import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppLayout } from "@/app/layout";
import { DashboardPage } from "@/app/routes/index";
import { ContactsPage } from "@/app/routes/contacts";
import { PipelinePage } from "@/app/routes/pipeline";
import { OutreachPage } from "@/app/routes/outreach";
import { ClientsPage } from "@/app/routes/clients";
import { AnalyticsPage } from "@/app/routes/analytics";
import { SettingsPage } from "@/app/routes/settings";

const rootRoute = createRootRoute({ component: AppLayout });

const routes = [
  createRoute({ getParentRoute: () => rootRoute, path: "/", component: DashboardPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/contacts", component: ContactsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/pipeline", component: PipelinePage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/outreach", component: OutreachPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/clients", component: ClientsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/analytics", component: AnalyticsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/settings", component: SettingsPage }),
];

const routeTree = rootRoute.addChildren(routes);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
