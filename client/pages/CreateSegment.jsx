import {
  ResourcePicker,
  useAppBridge,
  Loading,
} from "@shopify/app-bridge-react";
import {
  Page,
  TextField,
  Stack,
  Card,
  Button,
  Layout,
  Text,
  List,
  Modal,
  Icon,
  ResourceList,
  ResourceItem,
  Pagination,
  Banner,
  Frame,
} from "@shopify/polaris";
import React, { useCallback, useEffect, useState } from "react";
import useFetch from "../hooks/useFetch.js";
import { SearchMinor } from "@shopify/polaris-icons";
import "./style.css";
// import { navigate, Link } from "raviger";
import SkeletonExample from "../components/Skeleton.jsx";
import cryptoRandomString from "crypto-random-string";
import { useLocation } from "react-router";
import { useNavigate } from "react-router-dom";

const CreateSegment = () => {
  const fetch = useFetch();
  const [tag, setTag] = useState("");
  const [segmentName, setSegmentName] = useState("");
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedItemsIds, setSelectedItemsIds] = useState([]);
  const [next, setNext] = useState("");
  const [prev, setPrev] = useState("");
  const [errorBannerMessage, setErrorBannerMessage] = useState("");
  const [successBannerMessage, setSuccessBannerMessage] = useState("");
  const [finalLoading, setFinalLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  let navigate = useNavigate();
  console.log("id..........", id);

  useEffect(() => {
    getFirstCustomers();
  }, []);

  useEffect(() => {
    getSegment();
  }, []);

  const getSegment = useCallback(async () => {
    try {
      setUpdateLoading(true);
      if (id) {
        const response = await fetch(`/api/gql/getSegment?id=${id}`);
        console.log("response.....", response);
        if (response.ok) {
          let res = await response.json();
          console.log("res.....", res);
          if (res && res.name) {
            setSegmentName(res.name);
          }
          let string = res.query.substring(
            res.query.lastIndexOf(" ") + 2,
            res.query.length - 1
          );
          console.log("string.....", string);
          setTag(string);
          const customers = await fetch(`/api/gql/customers?query=${string}`);
          if (customers.ok) {
            let cust = await customers.json();
            let arr = [];
            cust.customers.forEach((item, index) => {
              arr.push(item.id);
            });
            setSelectedItemsIds([...arr]);
          }
        }
      }
    } catch (error) {
      console.log("error.....", error);
    } finally {
      setUpdateLoading(false);
    }
  }, []);

  const getFirstCustomers = useCallback(
    async (page, info, search) => {
      setLoading(true);
      try {
        console.log("page.....", page);
        console.log("info.....", info);
        console.log("search.....", search);
        setCustomers([]);
        const response = await fetch(
          `/api/gql/customers?pageInfo=${page ? page : ""}&info=${info}&query=${
            search ? search : ""
          }`
        );
        if (response.ok) {
          let res = await response.json();
          if (res && res.customers && res.customers.length) {
            console.log("res.customers.....", res.customers);
            setCustomers([...res.customers]);
            if (
              res.pageInfo &&
              res.pageInfo.hasNextPage &&
              res.pageInfo.endCursor
            ) {
              setNext(res.pageInfo.endCursor);
            }
            if (
              res.pageInfo &&
              res.pageInfo.hasPreviousPage &&
              res.pageInfo.startCursor
            ) {
              setPrev(res.pageInfo.startCursor);
            }
          }
        }

        console.log("customers.....", customers);
      } catch (error) {
        console.log("error.....", error);
      } finally {
        setLoading(false);
      }
    },
    [next, prev, query]
  );

  const renderItem = useCallback(
    (item, ownId, index) => {
      let { id, name, firstName, lastName, first_name, last_name, email } =
        item;

      return (
        <ResourceItem
          id={id}
          sortOrder={index}
          onClick={() => {
            console.log("id.....", id);
            console.log("firstName.....", firstName);
            // if (selectedItemsIds.includes(id)) {
            //   setSelectedItemsIds(selectedItemsIds.filter((itemId) => itemId !== id));
            // } else {
            //   const newSelectedItemIds = [...selectedItemsIds, id];
            //   setSelectedItemsIds(newSelectedItemIds);
            // }
          }}
          key={index}
          // accessibilityLabel={`View details for ${id}`}
        >
          <Text variant="bodyMd" as="p">
            {name
              ? name
              : first_name && last_name
              ? first_name + " " + last_name
              : firstName && lastName
              ? firstName + " " + lastName
              : ""}
          </Text>
          <Text variant="bodyMd" as="span" color="subdued">
            { email ? email : null }
          </Text>
        </ResourceItem>
      );
    },
    [customers, selectedItemsIds]
  );

  function resolveItemIds({ id }) {
    console.log("id.....", id);
    return id;
  }

  const resourceName = {
    singular: "customer",
    plural: "customers",
  };

  const promotedBulkActions = [
    {
      content: "Add customers",
      onAction: () => console.log("Todo: implement bulk edit"),
    },
  ];

  const CreateSingleSegment = useCallback(async (segmentTag) => {
    try {
      setFinalLoading(true);
      console.log("segmentName.....", segmentName);
      console.log("segmentTag.....", segmentTag);
      let body = {
        segmentName: segmentName,
        segmentTag: segmentTag,
      };
      const res = await fetch("/api/gql/createSegment", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(body),
      });

      console.log("res CreateSingleSegment res", res);
      if (res.ok) {
        let result = await res.json();
        console.log("result.....", result);
        if (
          result &&
          result.segmentResponse &&
          result.segmentResponse.userErrors &&
          result.segmentResponse.userErrors.length >= 1
        ) {
          let message = result.segmentResponse.userErrors[0].message;
          setErrorBannerMessage(message);
          setFinalLoading(false);
        } else {
          await updateSelectedCustomers(segmentTag);
        }
      }
    } catch (error) {
      console.log("error.....", error);
    }
  });

  const updateSingleSegment = useCallback(async (id) => {
    try {
      setFinalLoading(true);
      console.log("setTag.....", tag);
      let body = {
        segmentName: segmentName,
        segmentId: id,
      };
      const res = await fetch("/api/gql/updateSegment", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "PUT",
        body: JSON.stringify(body),
      });

      console.log("res.....updateSingleSegment", res);
      if (res.ok) {
        let result = await res.json();
        console.log("result.....", result);
        if (
          result &&
          result.segmentResponse &&
          result.segmentResponse.userErrors &&
          result.segmentResponse.userErrors.length >= 1
        ) {
          let message = result.segmentResponse.userErrors[0].message;
          setErrorBannerMessage(message);
          setFinalLoading(false);
        } else {
          await updateSelectedCustomers(tag);
        }
      }
    } catch (error) {
      console.log("error.....", error);
    }
  });

  const updateSelectedCustomers = useCallback(async (segmentTag) => {
    try {
      console.log("selectedItemsIds updateSelectedCustomers", selectedItemsIds);
      console.log("segmentTag updateSelectedCustomers", segmentTag);
      let count = 0;
      let array = [];
      let p = [];
      selectedItemsIds.forEach(async (item, index) => {
        let id = item.substring(item.lastIndexOf("/") + 1);
        array.push(id);
      });

      const response = await fetch("/api/update/customers", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "PUT",
        body: JSON.stringify({
          ids: array,
          tag: segmentTag,
        }),
      });

      console.log("response.....", response);
      if (response.ok) {
        let res = await response.json();
        console.log("res.....", res);
        setFinalLoading(false);
        setSuccessBannerMessage(
          `Segment created successfully with ${selectedItemsIds.length} selected customers.`
        );
      }
    } catch (error) {
      console.log("error.....", error);
      setFinalLoading(false);
    }
  });

  const updateCustomSegment = useCallback(async () => {
    if (segmentName === "") {
      setErrorBannerMessage("Segment name can not be blank");
    } else if (selectedItemsIds.length === 0) {
      setErrorBannerMessage("Please select customers");
    } else {
      if (id) {
        await updateSingleSegment(id);
      } else {
        let randomString = cryptoRandomString({
          length: 12,
          type: "alphanumeric",
        });
        let tag = `membership-${randomString}`;
        setErrorBannerMessage("");
        await CreateSingleSegment(tag.toUpperCase());
      }
    }
  });

  return (
    <Frame>
      <Page
        title={id ? "Update segment" : "Create segment"}
        breadcrumbs={[
          {
            content: "Home",
            onAction: () => {
              navigate("/segments");
            },
          },
        ]}
        primaryAction={{
          content: id ? "Update" : "Save",
          loading: finalLoading,
          onAction: async () => {
            await updateCustomSegment();
          },
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              console.log("cancel working");
              navigate("/segments");
            },
          },
        ]}
      >
        <div
          style={{
            display: errorBannerMessage ? "block" : "none",
            marginBottom: "15px",
          }}
        >
          <Layout>
            <Layout.Section fullWidth>
              <Banner
                onDismiss={() => {
                  setErrorBannerMessage("");
                }}
                title="There is 1 error with this segment:"
                status="critical"
              >
                <p>{errorBannerMessage}</p>
              </Banner>
            </Layout.Section>
          </Layout>
        </div>
        <div
          style={{
            display: successBannerMessage ? "block" : "none",
            marginBottom: "15px",
          }}
        >
          <Layout>
            <Layout.Section fullWidth>
              <Banner
                onDismiss={() => {
                  setSuccessBannerMessage("");
                }}
                title={ id ? `Segment was updated successfully.` : `Segment was created successfully.`}
                status="success"
              >
                <p>{successBannerMessage}</p>
              </Banner>
            </Layout.Section>
          </Layout>
        </div>

        <div style={{ paddingBottom: "20px" }}>
          <Layout>
            <Layout.Section oneHalf>
              <Card>
                <Card.Section>
                  <Stack distribution="equalSpacing" alignment="center">
                    <Stack.Item>
                      <Text variant="headingMd" as="h6">
                        {id ? "Update a segment name" : "Create a segment name"}
                      </Text>
                    </Stack.Item>
                    <Stack.Item>
                      <Text variant="bodyMd" as="span" color="subdued">
                        Customer segment
                      </Text>
                    </Stack.Item>
                  </Stack>
                </Card.Section>
                <Card.Section>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <TextField
                        label="Customer segment name"
                        type="text"
                        maxLength={255}
                        value={segmentName}
                        onChange={(value) => {
                          setSegmentName(value);
                        }}
                        autoComplete="off"
                        helpText="This name will be automatically applied when creating segment."
                      />
                    </div>
                  </div>
                </Card.Section>
              </Card>

              <Card>
                <Card.Section>
                  <div style={{ marginBottom: "10px" }}>
                    <Stack distribution="equalSpacing" alignment="center">
                      <Stack.Item>
                        <Text variant="headingMd" as="h6">
                          Customer eligibility
                        </Text>
                      </Stack.Item>
                      <Stack.Item>
                        <Text variant="bodyMd" as="span" color="subdued">
                          Customer segment
                        </Text>
                      </Stack.Item>
                    </Stack>
                  </div>

                  <TextField
                    autoFocus={true}
                    label=""
                    type="text"
                    placeholder={"Search customers"}
                    value={query}
                    onChange={async (value) => {
                      console.log("value...", value);
                      setQuery(value);
                      await getFirstCustomers(false, false, value);
                    }}
                    prefix={<Icon source={SearchMinor} />}
                    autoComplete="off"
                  />
                  {customers && customers.length && !updateLoading ? (
                    <div>
                      <ResourceList
                        selectable={true}
                        // showHeader={true}
                        loading={loading}
                        items={customers}
                        renderItem={(item, id, index) =>
                          renderItem(item, id, index)
                        }
                        selectedItems={selectedItemsIds}
                        onSelectionChange={(value) => {
                          console.log("customers.....", customers);
                          setSelectedItemsIds(value);
                          console.log("selectedItemIds.....", value);
                        }}
                        resolveItemId={resolveItemIds}
                        // hasMoreItems={true}
                        // isFiltered={true}
                        // resourceName={resourceName}
                        // promotedBulkActions={promotedBulkActions}
                      />

                      <Pagination
                        hasPrevious
                        onPrevious={async () => {
                          console.log("Previous.....", prev);
                          console.log("query.....", query);
                          if (prev) {
                            // setSelectedItemsIds([]);

                            await getFirstCustomers(prev, "previous", query);
                          }
                        }}
                        hasNext
                        onNext={async () => {
                          console.log("next.....", next);
                          console.log("query.....", query);
                          if (next) {
                            // setSelectedItemsIds([]);
                            await getFirstCustomers(next, "next", query);
                          }
                        }}
                        alignment="center"
                      />
                    </div>
                  ) : (
                    <SkeletonExample num={7}/>
                  )}
                </Card.Section>
              </Card>
            </Layout.Section>

            <Layout.Section oneThird>
              <Card>
                <Card.Header
                  title={
                    <Text variant="headingMd" as="h6">
                      Summary
                    </Text>
                  }
                />
                <Card.Section>
                  <Stack vertical>
                    <Stack vertical>
                      <Stack.Item>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            marginBottom: "3px",
                          }}
                        >
                          type and method
                        </div>
                        <List>
                          <List.Item>Amount off products</List.Item>
                          <List.Item>Code</List.Item>
                        </List>
                      </Stack.Item>
                      <Stack.Item>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            marginBottom: "3px",
                          }}
                        >
                          details
                        </div>
                        <List>
                          <List.Item>
                            Can’t combine with other discounts
                          </List.Item>
                        </List>
                      </Stack.Item>
                    </Stack>
                  </Stack>
                </Card.Section>
                <Card.Section>
                  <div style={{ marginBottom: "5px" }}>
                    <Text variant="headingSm" as="h6">
                      Performance
                    </Text>
                  </div>
                  <Text variant="bodyMd" as="p" color="subdued">
                    Discount is not active yet.
                  </Text>
                </Card.Section>
              </Card>
            </Layout.Section>
          </Layout>
        </div>
      </Page>
    </Frame>
  );
};

export default CreateSegment;
