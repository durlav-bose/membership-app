import { Loading, useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { useEffect } from "react";

const ExitFrame = () => {
  const app = useAppBridge();

  useEffect(() => {
    const params = new URLSearchParams(window.location.href);
    console.log('params ................exitframe ', params);
    const redirectUri = params.get("redirectUri");
    console.log('redirectUri .....................exitframe ', redirectUri);
    const redirect = Redirect.create(app);
    console.log('redirect .....................exitframe ', redirect.dispatch);
    redirect.dispatch(Redirect.Action.REMOTE, decodeURIComponent(redirectUri));
  }, [app]);

  return <Loading />;
};

export default ExitFrame;
