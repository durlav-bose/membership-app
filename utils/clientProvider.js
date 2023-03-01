import sessionHandler from "./sessionHandler.js";
import shopify from "./shopifyConfig.js";

const fetchSession = async ({ req, res, isOnline }) => {
  //false for offline session, true for online session
  // console.log("shopify", shopify)
  const sessionId = await shopify.session.getCurrentId({
    isOnline: isOnline,
    rawRequest: req,
    rawResponse: res,
  });
  // console.log("sessionId.........", sessionId);
  return await sessionHandler.loadSession(sessionId);
};

const graphqlClient = async ({ req, res, isOnline }) => {
  const session = await fetchSession({ req, res, isOnline });
  const client = new shopify.clients.Graphql({ session });
  const { shop } = session;
  return { client, shop, session };
};

const restClient = async ({ req, res, isOnline }) => {
  const session = await fetchSession({ req, res, isOnline });
  // console.log("session.....", session);
  const client = new shopify.clients.Rest({ session });
  // console.log("client.....", client);
  const { shop } = session;
  // console.log("shop.....", shop);
  return { client, shop, session };
};

const clientProvider = { graphqlClient, restClient };
export {clientProvider};
