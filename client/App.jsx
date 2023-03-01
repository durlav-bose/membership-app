// import {
//   NavigationMenu,
//   Provider as AppBridgeProvider,
// } from "@shopify/app-bridge-react";
// import { AppProvider as PolarisProvider } from "@shopify/polaris";
// import "@shopify/polaris/build/esm/styles.css";
// import translations from "@shopify/polaris/locales/en.json";
// import { useRoutes } from "raviger";
// import ApolloClientProvider from "./providers/ApolloClientProvider";
// import routes from "./Routes";
// import {I18nUniversalProvider} from '@shopify/react-i18n-universal-provider';

// const appBridgeConfig = {
//   apiKey: process.env.SHOPIFY_API_KEY,
//   host: new URL(location).searchParams.get("host"),
//   forceRedirect: true,
// };

// export default function App() {
//   const RouteComponents = useRoutes(routes);

//   return (
//     <I18nUniversalProvider >
//       <PolarisProvider i18n={translations}>
//       <AppBridgeProvider config={appBridgeConfig}>
//         <NavigationMenu
//           navigationLinks={[
//             {
//               label: "Discount Lists",
//               destination: "/discounts",
//             },
//             {
//               label: "Create Discount",
//               destination: "/createDiscount",
//             },
//             {
//               label: "Segment Lists",
//               destination: "/segments",
//             },
//             {
//               label: "Create Segment",
//               destination: "/createSegment",
//             },
//           ]}
//         />
//         <ApolloClientProvider>{RouteComponents}</ApolloClientProvider>
//       </AppBridgeProvider>
//     </PolarisProvider>
//     </I18nUniversalProvider>
//   );
// }



import { BrowserRouter } from "react-router-dom";
import { NavigationMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";
import ApolloClientProvider from "./providers/ApolloClientProvider";

import {
  AppBridgeProvider,
  QueryProvider,
  PolarisProvider,
} from "./components/providers";

console.log('location inside app.jsx ', location);

export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  const pages = import.meta.globEager("./pages/**/!(*.test.[jt]sx)*.([jt]sx)");

  return (
    <PolarisProvider>
      <BrowserRouter>
        <AppBridgeProvider>
          <QueryProvider>
            <NavigationMenu
              navigationLinks={[
                {
                  label: "Discount Lists",
                  destination: "/discounts",
                },
                {
                  label: "Create Discount",
                  destination: "/createDiscount",
                },
                {
                  label: "Segment Lists",
                  destination: "/segments",
                },
                {
                  label: "Create Segment",
                  destination: "/createSegment",
                },
              ]}
            />
            <ApolloClientProvider>
              <Routes pages={pages} />
            </ApolloClientProvider>
          </QueryProvider>
        </AppBridgeProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
