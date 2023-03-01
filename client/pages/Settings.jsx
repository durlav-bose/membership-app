import { useAppBridge } from "@shopify/app-bridge-react";
import { Card, Layout, Page, Select } from "@shopify/polaris";
import { navigate } from "raviger";
import React, { useState } from "react";

const Settings = () => {
  const app = useAppBridge();

  const themeOptions = [
    { label: "Dawn", value: "dawn" },
    { label: "Refresh", value: "refresh" },
    { label: "Sense", value: "sense" },
  ];

  const [selectedTheme, setSelectedTheme] = useState("");

  return (
    <Page
      title="Settings"
      breadcrumbs={[{ content: "Home", onAction: () => navigate("/") }]}
    >
      <Layout>
        <Layout.Section fullWidth>
          {/* <Card
            sectioned
            title="Store Theme"
            primaryFooterAction={{
              content: "Save",
              onAction: async () => {
                console.log("Updating discount...");
                // const customerIds = await fetchCustomers(selectedTag);
                // await updateDiscount(selectedDiscount, selectedSegment);
              },
            }}
          >
            <Select
              label="Select Theme"
              placeholder={"Select a theme"}
              options={themeOptions}
              value={selectedTheme}
              onChange={(newValue) => setSelectedTheme(newValue)}
            />
          </Card> */}
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Settings;
