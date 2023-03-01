// import React from "react";
// import ExitFrame from "./ExitFrame";
// import ActiveWebhooks from "./pages/debugCards/ActiveWebhooks";
// import BillingAPI from "./pages/debugCards/BillingAPI";
// import DebugIndex from "./pages/debugCards/DebugIndex";
// import DevNotes from "./pages/debugCards/DevNotes";
// import GetData from "./pages/debugCards/GetData";
// import Index from "./pages/Index";
// import Settings from "./pages/Settings.jsx";
// import CreateDiscount from "./pages/CreateDiscount";
// import CreateSegment from "./pages/CreateSegment";
// import Discounts from "./pages/Discounts.jsx";
// import Segments from "./pages/Segments.jsx";

// const routes = {
//   "/": () => <Index />,
//   "/exitframe": () => <ExitFrame />,
//   //Debug Cards
//   "/debug": () => <DebugIndex />,
//   "/discounts": () => <Discounts />,
//   "/creatediscount/:id": (id) => <CreateDiscount id={id} />,
//   "/creatediscount": () => <CreateDiscount />,
//   "/segments": () => <Segments />,
//   "/createsegment/:id": (id) => <CreateSegment id={id} />,
//   "/createsegment": () => <CreateSegment />,
//   "/settings": () => <Settings />,
//   "/debug/activeWebhooks": () => <ActiveWebhooks />,
//   "/debug/getData": () => <GetData />,
//   "/debug/billing": () => <BillingAPI />,
//   "/debug/devNotes": () => <DevNotes />,
//   //Add your routes here
// };

// export default routes;


import { Routes as ReactRouterRoutes, Route } from "react-router-dom";

/**
 * File-based routing.
 * @desc File-based routing that uses React Router under the hood.
 * To create a new route create a new .jsx file in `/pages` with a default export.
 *
 * Some examples:
 * * `/pages/index.jsx` matches `/`
 * * `/pages/blog/[id].jsx` matches `/blog/123`
 * * `/pages/[...catchAll].jsx` matches any URL not explicitly matched
 *
 * @param {object} pages value of import.meta.globEager(). See https://vitejs.dev/guide/features.html#glob-import
 *
 * @return {Routes} `<Routes/>` from React Router, with a `<Route/>` for each file in `pages`
 */
export default function Routes({ pages }) {
  console.log('pages ................................... inside routes', pages);
  const routes = useRoutes(pages);
  console.log('routes .................................. inside routes ', routes);
  const routeComponents = routes.map(({ path, component: Component }) => (
    <Route key={path} path={path} element={<Component />} />
  ));

  console.log('routeComponents ............................. inside routes ', routeComponents);

  const NotFound = routes.find(({ path }) => path === "/notFound").component;

  console.log('NotFound ............................ inside routes ', NotFound);

  return (
    <ReactRouterRoutes>
      {routeComponents}
      <Route path="*" element={<NotFound />} />
    </ReactRouterRoutes>
  );
}

function useRoutes(pages) {
  console.log('pages inside routes....................... inside routes', pages);
  const routes = Object.keys(pages)
    .map((key) => {
      let path = key
        .replace("./pages", "")
        .replace(/\.(t|j)sx?$/, "")
        /**
         * Replace /index with /
         */
        .replace(/\/index$/i, "/")
        /**
         * Only lowercase the first letter. This allows the developer to use camelCase
         * dynamic paths while ensuring their standard routes are normalized to lowercase.
         */
        .replace(/\b[A-Z]/, (firstLetter) => firstLetter.toLowerCase())
        /**
         * Convert /[handle].jsx and /[...handle].jsx to /:handle.jsx for react-router-dom
         */
        .replace(/\[(?:[.]{3})?(\w+?)\]/g, (_match, param) => `:${param}`);

      if (path.endsWith("/") && path !== "/") {
        path = path.substring(0, path.length - 1);
      }

      if (!pages[key].default) {
        console.warn(`${key} doesn't export a default React component`);
      }

      return {
        path,
        component: pages[key].default,
      };
    })
    .filter((route) => route.component);

  console.log('routes xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx inside routes', routes);

  return routes;
}
