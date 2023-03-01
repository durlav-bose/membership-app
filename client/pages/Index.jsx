import { useAppBridge, Loading } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { Card, Layout, Page } from "@shopify/polaris";
import React, { useEffect } from "react";
import useFetch from "../hooks/useFetch.js";
import { useNavigate } from "react-router-dom";
// import { navigate } from "raviger";

const HomePage = () => {
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  let navigate = useNavigate();

  const fetch = useFetch();

  useEffect(() => {
  }, []);

  return (
    <Page title="Home">
      <Layout>
        <Layout.Section oneHalf>
          <Card
            sectioned
            title="🛍️ Discounts"
            primaryFooterAction={{
              content: "Explore",
              onAction: () => {
                navigate("/discounts");
              },
            }}
          >
            <p>See and manage all membership discounts.</p>
          </Card>
        </Layout.Section>
        <Layout.Section oneHalf>
          <Card
            sectioned
            title="👥 Customer Segments"
            primaryFooterAction={{
              content: "Explore",
              onAction: () => {
                navigate("/segments");
              },
            }}
          >
            <p>See and manage all customer segments.</p>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default HomePage;