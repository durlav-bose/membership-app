import React, { useCallback, useEffect, useState } from "react";
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
  Icon,
  Pagination
} from "@shopify/polaris";
import { Redirect } from "@shopify/app-bridge/actions";
import useFetch from "../hooks/useFetch.js";
import TabBar from "../components/TabBar.jsx";
import { navigate, useQueryParams } from "raviger";
import SkeletonExample from "../components/Skeleton.jsx";
import { DeleteMajor, EditMajor, EditMinor, DeleteMinor } from "@shopify/polaris-icons";
import { useNavigate } from "react-router-dom";

const Segments = () => {
  const [customerSegments, setCustomerSegments] = useState([]);
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  const fetch = useFetch();
  const [loading, setLoading] = useState(false);
  const [selectedTabId, setSelectedTabId] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState("");
  const [next, setNext] = useState("");
  const [previous, setPrevious] = useState("");
  let navigate = useNavigate();

  useEffect(() => {
    getCustomerSegments();
  }, []);

  const getCustomerSegments = useCallback(async (page, info) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/gql/segments?pageInfo=${page ? page : ""}&info=${info}&total=${20}`
      );
      console.log("getCustomerSegments.....", res);

      if (res.ok) {
        const response = await res.json();
        console.log("response.body.data.....", response.body.data);
        const { segments } = response.body.data;
        let customerSegments = segments.edges.map(function (segment) {
          return segment.node;
        });
        if (segments && segments.pageInfo) {
          if (segments.pageInfo.hasNextPage) {
            setNext(segments.pageInfo.endCursor);
          }
          if (segments.pageInfo.hasPreviousPage) {
            setPrevious(segments.pageInfo.startCursor);
          }
        }
        console.log("customerSegments.....", customerSegments);
        setCustomerSegments(customerSegments);
      }
    } catch (error) {
      console.log("error.....", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCustomerSegment = useCallback(async (id) => {
    try {
      setLoadingDelete(true);
      const res = await fetch("/api/gql/deleteSegment", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      console.log("res.........", res);
      if (res.ok) {
        setShowToast(true);
        setToastMessage("Segment deleted successfully");
      }
    } catch (error) {
      console.log("error.....", error);
    } finally {
      setLoadingDelete(false);
      setShowModal(false);
      setSelectedSegment("");
      await getCustomerSegments();
    }
  }, []);

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(customerSegments);

  const tabBarMarkup = (
    <TabBar
      items={[
        {
          id: "all",
          title: "All segments",
        },
      ]}
      selectedItemId={selectedTabId}
      onAction={(item) => {
        console.log("item.....", item);
        setSelectedTabId(item.id);
      }}
    />
  );

  const loadingMarkup = (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Spinner accessibilityLabel="" size="large" />
    </div>
  );

  const tableMarkup = (
    <div className="seg-page">
      <IndexTable
        itemCount={customerSegments.length}
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
        headings={[{ title: "Name" }, { title: "Customer Tag" }, { title: "Action" }]}
      >
        {customerSegments.map(({ id, name, query }, index) => (
          <IndexTable.Row
            padding="40px"
            id={id}
            key={id}
            selected={selectedResources.includes(id)}
            position={index}
          >
            
            <IndexTable.Cell>
              <p style={{ textDecoration: "underline", cursor: "pointer", fontWeight: "bold" }} onClick={() => {
                let x = id.substring(id.lastIndexOf("/")+1);
                // navigate(`/createSegment/${x}`);
                navigate({
                  pathname: "/createSegment",
                  search: `?id=${x}`,
                });
              }}>
                {name}
              </p>
              
            </IndexTable.Cell>
            <IndexTable.Cell>
              <Text variant="bodyMd" as="span">
                {query.substring(query.lastIndexOf(" ") + 2, query.length-1)}
              </Text>
            </IndexTable.Cell>
            <IndexTable.Cell>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <p
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    let x = id.substring(id.lastIndexOf("/")+1);
                    // navigate(`/createSegment/${x}`);
                    navigate({
                      pathname: "/createSegment",
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
                    setSelectedSegment(id);
                    setShowModal(true);
                  }}
                >
                  <Icon source={DeleteMinor} color="Critical" />
                </p>
              </div>
            </IndexTable.Cell>
          </IndexTable.Row>
        ))}
      </IndexTable>
      <Pagination
        hasPrevious
        onPrevious={async () => {
          if (previous) {
            await getCustomerSegments(previous, "previous");
          }
        }}
        hasNext
        onNext={async () => {
          if (next) {
            await getCustomerSegments(next, "next");
          }
        }}
        alignment="center"
      />
    </div>
  );

  const emptyStateMarkup = (
    <EmptyState
      heading="Manage segments"
      action={{
        content: "Create segment",
        onAction: () => {
          // navigate({ pathname: "/createDiscount" });
          navigate("/createSegment");
        },
      }}
      image="https://cdn.shopify.com/shopifycloud/web/assets/v1/b8d201c5328e302af3b6b06df16f4b52a37ea7bacf7f8f2891b7bad1872a3ba0.svg"
    >
      <p>Create segment that will be visible when you will create discount.</p>
    </EmptyState>
  );

  return (
    <Page
      title="Segments"
      breadcrumbs={[
        {
          content: "Home",
          onAction: () => {
            navigate("/");
          },
        },
      ]}
      primaryAction={{
        content: "Create segment",
        onAction: () => {
          navigate("/createSegment");
        },
      }}
    >
      {
        <Layout>
          <Layout.Section fullWidth>
            <div style={{ marginBottom: "40px" }}>
              <Card sectioned>
                {loading
                  ? loadingMarkup
                  : customerSegments.length === 0
                  ? emptyStateMarkup
                  : tableMarkup}
              </Card>
            </div>

            <Modal
              open={showModal}
              onClose={() => {
                setShowModal(false);
              }}
              title="Discard all unsaved changes"
              primaryAction={{
                destructive: true,
                loading: loadingDelete,
                content: "Delete",
                onAction: async () => {
                  await deleteCustomerSegment(selectedSegment);
                },
              }}
              secondaryActions={[
                {
                  content: "Cancel",
                  onAction: () => {
                    setShowModal(false);
                  },
                },
              ]}
            >
              <Modal.Section>
                <p>
                  Are you sure you want to delete this discount permanently?
                </p>
              </Modal.Section>
            </Modal>

            {showToast ? (
              <Frame>
                <Toast
                  content={toastMessage}
                  onDismiss={() => {
                    setShowToast(false);
                  }}
                />
              </Frame>
            ) : (
              ""
            )}
          </Layout.Section>
        </Layout>
      }
    </Page>
  );
};

export default Segments;
