import { useAppBridge, Loading } from "@shopify/app-bridge-react";
import {
  Badge,
  Card,
  Divider,
  EmptyState,
  IndexTable,
  Layout,
  Page,
  Spinner,
  Text,
  useIndexResourceState,
  Button,
  Modal,
  Toast,
  Frame,
  Icon
} from "@shopify/polaris";
// import { useNavigate } from "react-router-dom";
import React, { useCallback, useEffect, useState } from "react";
import { Redirect } from "@shopify/app-bridge/actions";
import useFetch from "../hooks/useFetch.js";
import TabBar from "../components/TabBar.jsx";
// import { navigate } from "raviger";
import { DeleteMajor, DeleteMinor, EditMinor } from "@shopify/polaris-icons";
import { useLocation } from "react-router";
import { useNavigate } from "react-router-dom";

const Discounts = () => {
  
  const fetch = useFetch();
  let navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [selectedTabId, setSelectedTabId] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [deleteDiscountId, setDeleteDiscountId] = useState("");
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [check, setCheck] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [pageLoading, setPageLoading] = useState(false);

  let getDiscounts = useCallback(async() => {
    try {
      setLoading(true);
      setPageLoading(true);
      const res = await fetch("/api/gql/discounts");
      console.log("res..........", res);

      if (res.ok) {
        const response = await res.json();
        let priceRules = response.body.data.priceRules.edges;
        console.log("priceRules.....", priceRules);
        const discounts = priceRules.map(function(priceRule) {
          return {
            id: priceRule.node.id,
            title: priceRule.node.title,
            summary: priceRule.node.summary,
            startsAt: priceRule.node.startsAt,
            endsAt: priceRule.node.endsAt,
            status: priceRule.node.status,
            usageCount: priceRule.node.usageCount,
            discountCodes: priceRule.node.discountCodes.nodes,
            discountClass: priceRule.node.discountClass,
          };
        });
        console.log("discounts.....", discounts);
        setDiscounts(discounts);
      }
    } catch (error) {
      console.log("error.....", error);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  },[])

  let deleteDiscount = useCallback(async(priceRuleId) => {
    setLoadingDelete(true);
    const body = {
      priceRuleId: priceRuleId
    };

    try {
      const res = await fetch("/api/discounts/delete", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(body),
      });

      console.log("deleteDiscounts res.....", res);
      if (res.ok) {
        const response = await res.json();
        console.log("deleteDiscounts response.....", response);
        setShowToast(true);
        setToastMessage("Discount deleted successfully");
      }
    } catch (error) {
      console.log("error deleting discount", error);
      setShowToast(true);
      setToastMessage("Error deleting discount")
    } finally {
      setCheck(true);
      setLoadingDelete(false);
      setShowModal(false);
    }
  }, [])

  useEffect(() => {
    setCheck(false)
    getDiscounts();
  }, [check]);

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(discounts);

  const tabBarMarkup =
    <TabBar
      items={[
        {
          id: "all",
          title: "All Discounts",
        },
      ]}
      selectedItemId={selectedTabId}
      onAction={(item) => {
        console.log("item.....", item);
        setSelectedTabId(item.id);
      }}
    />;

  const loadingMarkup =
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Spinner accessibilityLabel="" size="large" />
    </div>;

  const tableMarkup =
    <IndexTable
      itemCount={discounts.length}
      selectable={false}
      selectedItemsCount={
        allResourcesSelected ? "All" : selectedResources.length
      }
      onSelectionChange={handleSelectionChange}
      bulkActions={[
        {
          content: "Delete discounts",
          onAction: async () => {
            // await deleteDiscount(selectedResources);
          },
        },
      ]}
      promotedBulkActions={[
        {
          content: "Active discounts",
          onAction: () => console.log("Todo: implement bulk add tags"),
        },
        {
          content: "Deactivate discounts",
          onAction: () => console.log("Todo: implement bulk remove tags"),
        },
      ]}
      headings={[
        { title: "Title" },
        { title: "Status" },
        { title: "Type" },
        { title: "Used" },
        { title: "Actions" },
      ]}
    >
      {
        discounts.map(
          ({ id, title, summary, status, discountClass, usageCount }, index) => (
            <IndexTable.Row
              id={id}
              key={id}
              selected={selectedResources.includes(id)}
              position={index}
            >
              <IndexTable.Cell>
                <div style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => {
                let x = id.substring(id.lastIndexOf("/")+1);
                // navigate(`/createDiscount/${x}`);
                navigate({
                  pathname: "/createDiscount",
                  search: `?id=${x}`,
                });
              }}>
                <Text variant="bodyMd" fontWeight="bold" as="span">{title}</Text>
                <div style={{ marginTop: "4px" }}>
                  <Text variant="bodyMd" as="p">{summary}</Text>
                </div>
              </div>
                
              </IndexTable.Cell>
              <IndexTable.Cell>{
                status === "ACTIVE" ? <Badge status="success">Active</Badge> : <Badge>Expired</Badge>
              }</IndexTable.Cell>
              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">{
                  discountClass === "PRODUCT" ? "Amount off products" : "Amount off order"
                }</Text>
                <div style={{ marginTop: "4px" }}>
                  <Text variant="bodyMd" as="p" color="subdued">{
                    discountClass === "PRODUCT" ? "Product discount" : "Order discount"
                  }</Text>
                </div>
              </IndexTable.Cell>
              <IndexTable.Cell>{usageCount}</IndexTable.Cell>
              <IndexTable.Cell>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <p
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    let x = id.substring(id.lastIndexOf("/")+1);
                    // navigate(`/createDiscount/${x}`);
                    navigate({
                      pathname: "/createDiscount",
                      search: `?id=${x}`,
                    });
                  }}
                >
                  <Icon
                  source={EditMinor}
                  color="base"
                />
                </p>
                <p
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setDeleteDiscountId(id);
                    setShowModal(true);
                  }}
                >
                  <Icon source={DeleteMinor} color="Critical" />
                </p>
              </div>
              </IndexTable.Cell>
            </IndexTable.Row>
          ),
        )
      }
    </IndexTable>;

  const emptyStateMarkup =
    <EmptyState
      heading="Manage membership discounts"
      action={{
        content: "Create discount",
        onAction: () => {
          // navigate({ pathname: "/createDiscount" });
          navigate("/createDiscount");
        },
      }}
      image="https://cdn.shopify.com/shopifycloud/web/assets/v1/b8d201c5328e302af3b6b06df16f4b52a37ea7bacf7f8f2891b7bad1872a3ba0.svg"
    >
      <p>Create discounts that will be visible with each product in your store and will be applied at checkout
        automatically.</p>
    </EmptyState>;

  return (
    <Page
      title="Discounts"
      breadcrumbs={[{
        content: "Home", onAction: () => {
          // navigate({ pathname: "/" });
          navigate("/");
        },
      }]}
      primaryAction={{
        content: "Create discount",
        onAction: () => {
          // navigate({ pathname: "/createDiscount" });
          navigate("/createDiscount")
        },
      }}
    >
      {
        pageLoading ? <Loading /> : <Layout>
        <Layout.Section fullWidth>
          <Card sectioned>
            {!loading && discounts.length === 0 ?
              emptyStateMarkup :
              <div>
                {tabBarMarkup}
                <Divider />
                {loading ? loadingMarkup : tableMarkup}
              </div>
            }
          </Card>
          
            <Modal
            open={showModal}
            onClose={() => {
              setShowModal(false)
            }}
            
            title="Discard all unsaved changes"
            primaryAction={{
              destructive: true,
              loading: loadingDelete,
              content: "Delete",
              onAction: () => {
                console.log("delete discount id", deleteDiscountId);
                deleteDiscount(deleteDiscountId);
              },
            }}
            secondaryActions={[
              {
                content: "Cancel",
                onAction: () => {
                  setShowModal(false)
                },
              },
            ]}>
            <Modal.Section>
              <p>
                Are you sure you want to delete this discount permanently?
              </p>
            </Modal.Section>
          </Modal>
          
          {
            showToast ? <Frame>
              <Toast content={toastMessage} onDismiss={() => {
              setShowToast(false)
            }} />
            </Frame>  : ""
          }
        </Layout.Section>
      </Layout>
      }
    </Page>
  );
};

export default Discounts;