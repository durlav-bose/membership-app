import {
  ResourcePicker,
  useAppBridge,
  Loading,
} from "@shopify/app-bridge-react";
import {
  Banner,
  Button,
  ButtonGroup,
  Card,
  ChoiceList,
  Icon,
  Layout,
  Link,
  List,
  Modal,
  Page,
  Stack,
  Text,
  TextField,
  Badge,
  ResourceList,
  ResourceItem,
  Pagination,
} from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import { Redirect } from "@shopify/app-bridge/actions";
import useFetch from "../hooks/useFetch.js";
import { SearchMinor } from "@shopify/polaris-icons";
import cryptoRandomString from "crypto-random-string";
import { CustomPicker } from "../components/CustomPicker.jsx";
// import { navigate } from "raviger";
import { useCallback } from "react";
import SkeletonExample from "../components/Skeleton.jsx";
import { useLocation } from "react-router";
import { useNavigate } from "react-router-dom";

const createDiscount = () => {
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  const fetch = useFetch();

  const [discountCode, setDiscountCode] = useState("");
  const [discountType, setDiscountType] = React.useState("Percentage");
  const [discountPercentageValue, setPercentageDiscountValue] = useState("");
  const [discountFixedValue, setDiscountFixedValue] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [productSelectionType, setProductSelectionType] = useState([
    "collections",
  ]);
  const [collectionSearchQuery, setCollectionSearchQuery] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [customerSelectionType, setCustomerSelectionType] = useState([
    "customer_segments",
  ]);
  const [customerSegments, setCustomerSegments] = useState([]);
  const [selectedCustomerSegments, setSelectedCustomerSegments] = useState([]);

  const [errorBannerHidden, setErrorBannerHidden] = useState(true);
  const [errorBannerMessage, setErrorBannerMessage] = useState("");
  const [successBannerHidden, setSuccessBannerHidden] = useState(true);

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [cancelWarningOpen, setCancelWarningOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [savedDiscountCode, setSavedDiscountCode] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [next, setNext] = useState("");
  const [prev, setPrev] = useState("");
  const [previous, setPrevious] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [usageCount, setUsageCount] = useState(0);
  let [initialValues, setInitialValues] = useState({});
  const [customers, setCustomers] = useState([]);
  const [selectedItemsIds, setSelectedItemsIds] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  let navigate = useNavigate();

  useEffect(() => {
    if (id) {
      getSingleDiscount(id);
    }
    getAllData();
    // getFirstCustomers();
  }, []);

  const getSingleDiscount = useCallback(async (discountId) => {
    try {
      const res = await fetch(`/api/gql/singleDiscount?id=${discountId}`);
      console.log("res.........++++++++++++===============", res);
      if (res.ok) {
        let response = await res.json();
        console.log("response.....getSingleDiscount", response);
        let data = response.body.data.priceRule;
        let segmentDetails =
          response.body.data.priceRule.customerSelection.segments;
        let discountCodesDetails =
          response.body.data.priceRule.discountCodes.nodes;
        let discountCodeTitle = response.body.data.priceRule.title;
        let discountPercentage =
          response.body.data.priceRule.valueV2.percentage;
        let discountAmount = response.body.data.priceRule.valueV2.amount;
        let discountAmountCurrency =
          response.body.data.priceRule.valueV2.currencyCode;
        let discountCollectionsDetails =
          response.body.data.priceRule.itemEntitlements.collections.nodes;
        let discountProductsDetails =
          response.body.data.priceRule.itemEntitlements.products.nodes;
        let status = response.body.data.priceRule.status;
        let usageCount = response.body.data.priceRule.usageCount;
        let segments = [];
        let discountCodes = [];
        let collections = [];
        let products = [];
        setStatus(status);
        setUsageCount(usageCount);
        if (discountPercentage) {
          setDiscountType("Percentage");
          setPercentageDiscountValue(-1 * discountPercentage);
        }
        if (discountAmount) {
          setDiscountType("Fixed amount");
          setDiscountFixedValue(-1 * discountAmount);
        }
        console.log("segmentDetails &&&&&........", segmentDetails);
        segmentDetails.forEach((item, index) => {
          segments.push(item.id);
        });
        console.log("segments.....", segments);
        discountCodesDetails.forEach((item, index) => {
          discountCodes.push(item.code);
        });
        console.log("discountCodes.....", discountCodes);
        discountCollectionsDetails.forEach((item, index) => {
          let obj = {};
          obj.id = item.id;
          collections.push(obj);
        });
        console.log("collections.....", collections);
        discountProductsDetails.forEach((item, index) => {
          let obj = {};
          obj.id = item.id;
          products.push(obj);
        });
        console.log("products.....", products);
        if (collections && collections.length) {
          setProductSelectionType(["collections"]);
          console.log("collections.....", collections);
          setSelectedCollections([...collections]);
        }
        console.log("selectedCollections.....", selectedCollections);
        if (products && products.length) {
          setProductSelectionType(["products"]);
          console.log("products.....", products);
          setSelectedProducts([...products]);
        }
        console.log("selectedProducts.....", selectedProducts);
        console.log("segments.....", segments);
        setSelectedCustomerSegments([...segments]);
        console.log("discountCodes.....", discountCodes);
        setDiscountCode(discountCodes[0]);
        console.log("discountCode.....", discountCode);

        setInitialValues({
          discountCode: discountCodes[0],
          discountPercentageValue: discountPercentage
            ? (-1 * discountPercentage).toString()
            : "",
          discountFixedValue: discountAmount
            ? (-1 * discountAmount).toString()
            : "",
          selectedCollections: [...collections],
          selectedProducts: [...products],
          selectedCustomerSegments: [...segmentDetails],
        });

        console.log(
          "initialValues.....+++++++++++++++++++++++++",
          initialValues
        );
      }
    } catch (error) {
      console.log("error..... single discount.....", error);
    }
  }, []);

  const compareArray = (array1, array2) => {
    let results = array1.filter(
      ({ id: id1 }) => !array2.some(({ id: id2 }) => id2 === id1)
    );
    return results.length == 0;
  };

  useEffect(() => {
    console.log("initialValues inside effect.....", initialValues);
    if (id) {
      let col;
      let pro;
      let seg;
      if (initialValues.selectedCollections && initialValues.selectedProducts) {
        col = compareArray(
          initialValues.selectedCollections,
          selectedCollections
        );
        pro = compareArray(initialValues.selectedProducts, selectedProducts);
      }
      if (
        initialValues.selectedCustomerSegments &&
        initialValues.selectedCustomerSegments.length
      ) {
        seg = compareArray(
          initialValues.selectedCustomerSegments,
          selectedCustomerSegments
        );
      }
      let x;
      if (
        discountCode !== initialValues.discountCode ||
        discountPercentageValue != initialValues.discountPercentageValue ||
        discountFixedValue !== initialValues.discountFixedValue ||
        !col ||
        !pro ||
        !seg
      ) {
        x = true;
        setUnsavedChanges(x);
      } else {
        x = false;
        setUnsavedChanges(x);
      }
    } else {
      if (
        discountCode !== "" ||
        discountPercentageValue !== "" ||
        discountFixedValue !== "" ||
        selectedCollections.length > 0 ||
        selectedProducts.length > 0 ||
        selectedCustomerSegments.length > 0
      ) {
        setUnsavedChanges(true);
      } else {
        setUnsavedChanges(false);
      }
    }
  }, [
    discountCode,
    // discountType,
    discountPercentageValue,
    discountFixedValue,
    // productSelectionType,
    selectedCollections,
    selectedProducts,
    // customerSelectionType,
    selectedCustomerSegments,
  ]);

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

  const getCustomerSegments = useCallback(
    async (page, info, query) => {
      try {
        setUpdateLoading(true);
        console.log("customerSegments.length", customerSegments.length);
        setCustomerSegments([]);
        const res = await fetch(
          `/api/gql/segments?pageInfo=${page ? page : ""}&info=${info}&query=${
            query ? query : ""
          }`
        );
        console.log("getCustomerSegments.....", res);

        if (res.ok) {
          const response = await res.json();
          console.log("response.body.data.....", response.body.data);
          const { segments, segmentCount } = response.body.data;
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
          setCustomerSegments([...customerSegments]);
        }

        // setCustomerPickerLoading(false);
      } catch (error) {
        console.log("error.....", error);
      } finally {
        // setCustomerPickerLoading(false);
        setUpdateLoading(false)
      }
    },
    [next, previous, query]
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
          }}
          key={index}
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

  const getAllData = useCallback(async () => {
    setPageLoading(true);
    await getStoreCurrency().then();
    await getCustomerSegments().then();
    setPageLoading(false);
  }, []);

  async function getStoreCurrency() {
    const res = await fetch("/api/gql/currency", {});
    console.log("getStoreCurrency.....", res);

    if (res.ok) {
      const response = await res.json();
      let currencyCode = response.body.data.shop.currencyCode;
      const currencySymbols = {
        AUD: "$",
        BDT: "৳",
        CAD: "$",
        EUR: "€",
        GBP: "£",
        HKD: "$",
        JPY: "¥",
        NZD: "$",
        SGD: "$",
        USD: "$",
      };
      let currencySymbol = currencySymbols[currencyCode];
      if (currencyCode) {
        console.log("currencySymbol.....", currencySymbol);
        setCurrencySymbol(currencySymbol);
      } else {
        console.log("Unsupported currency");
      }
    }
  }

  async function createDiscount() {
    const body = {
      title: `MembershipApp: ${discountCode.trim()}`,
      code: discountCode.trim(),
      valueType: discountType === "Percentage" ? "percentage" : "fixed_amount",
      value:
        discountType === "Percentage"
          ? -discountPercentageValue
          : -discountFixedValue,
      customerSelection: customerSelectionType.includes("all_customers")
        ? "all"
        : "prerequisite",
      prerequisiteCustomerSegmentIds: selectedCustomerSegments,
      targetSelection: productSelectionType.includes("all_products")
        ? "all"
        : "entitled",
      entitledCollectionIds: selectedCollections.map(
        (collection) => collection.id
      ),
      entitledProductIds: selectedProducts.map((product) => product.id),
    };
    if (productSelectionType.includes("products")) {
      body.entitledCollectionIds = [];
    } else if (productSelectionType.includes("collections")) {
      body.entitledProductIds = [];
    }
    console.log("createDiscount body.....", body);
    try {
      setLoading(true);
      const res = await fetch("/api/discounts/create", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(body),
      });
      console.log("createDiscount res.....", res);
      if (res.ok) {
        const response = await res.json();
        console.log("createDiscount response.....", response);
        setUsageCount(response.discount_code.usage_count);
        setStatus("Active");
        setSuccessBannerHidden(false);
        setUnsavedChanges(false);
        setSavedDiscountCode(discountCode.trim());
      } else {
        let response = await res.json();
        console.log("error.....", response);
        let error = response.response.body.errors.code[0];
        setErrorBannerMessage(error);
        setErrorBannerHidden(false);
      }
    } catch (error) {
      console.log("error creating discount", error);
    } finally {
      setLoading(false);
    }
  }

  const updateDiscount = async () => {
    try {
      setLoading(true);
      const body = {
        title: `MembershipApp: ${discountCode.trim()}`,
        code: discountCode.trim(),
        valueType:
          discountType === "Percentage" ? "percentage" : "fixed_amount",
        value:
          discountType === "Percentage"
            ? -discountPercentageValue
            : -discountFixedValue,
        customerSelection: customerSelectionType.includes("all_customers")
          ? "all"
          : "prerequisite",
        prerequisiteCustomerSegmentIds: selectedCustomerSegments,
        targetSelection: productSelectionType.includes("all_products")
          ? "all"
          : "entitled",
        entitledCollectionIds: selectedCollections.map(
          (collection) => collection.id
        ),
        entitledProductIds: selectedProducts.map((product) => product.id),
        priceRuleId: id ? id : null,
      };
      if (productSelectionType.includes("products")) {
        body.entitledCollectionIds = [];
      } else if (productSelectionType.includes("collections")) {
        body.entitledProductIds = [];
      }
      console.log("createDiscount body.....", body);
      const res = await fetch("/api/gql/updateDiscount", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "PUT",
        body: JSON.stringify(body),
      });

      console.log("res.........update discount", res);
      if (res.ok) {
        const response = await res.json();
        console.log("updateDiscount response.....", response);
        let usageCount =
          response.body.data.priceRuleUpdate.priceRuleDiscountCode.usageCount;
        setUsageCount(usageCount);
        setSuccessBannerHidden(false);
        setUnsavedChanges(false);
        setSavedDiscountCode(discountCode.trim());
      } else {
        let response = await res.json();
        console.log("error..... else.....", response);
        let error = response.response.body.errors.code[0];
        setErrorBannerMessage(error);
        setErrorBannerHidden(false);
      }
    } catch (error) {
      console.log("error.....error", error);
      setErrorBannerMessage(error);
      setErrorBannerHidden(false);
    } finally {
      setLoading(false);
    }
  };

  function navigateBack(ignoreWarning = false) {
    if (!ignoreWarning && unsavedChanges) {
      setCancelWarningOpen(true);
    } else {
      navigate("/discounts");
    }
  }

  const saveDiscount = async () => {
    if (discountCode.trim() === "") {
      setErrorBannerHidden(false);
      setErrorBannerMessage("Discount code can’t be blank");
    } else if (
      (discountType === "Percentage" && discountPercentageValue === "") ||
      (discountType === "Fixed amount" && discountFixedValue === "")
    ) {
      setErrorBannerHidden(false);
      setErrorBannerMessage("Discount value can’t be blank");
    } else if (
      productSelectionType[0] === "collections" &&
      selectedCollections.length === 0
    ) {
      setErrorBannerHidden(false);
      setErrorBannerMessage("Specific collections must be added");
    } else if (
      productSelectionType[0] === "products" &&
      selectedProducts.length === 0
    ) {
      setErrorBannerHidden(false);
      setErrorBannerMessage("Specific products must be added");
    } else if (
      customerSelectionType[0] === "customer_segments" &&
      selectedCustomerSegments.length === 0
    ) {
      setErrorBannerHidden(false);
      setErrorBannerMessage("Specific customer segments must be added");
    } else {
      setErrorBannerHidden(true);
      if (id) {
        await updateDiscount();
      } else {
        await createDiscount();
      }
    }
  };

  function resolveItemIds({ id }) {
    console.log("id.....", id);
    return id;
  }

  return (
    <Page
      title={id ? "Update discount" : "Create discount"}
      breadcrumbs={[
        {
          content: "Home",
          onAction: () => navigateBack(),
        },
      ]}
      primaryAction={{
        content: id ? "Update" : "Save",
        loading: loading,
        onAction: async () => {
          saveDiscount();
        },
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: () => {
            navigateBack();
          },
        },
      ]}
    >
      {pageLoading ? (
        <Loading />
      ) : (
        <div>
          <div
            style={{
              display: errorBannerHidden ? "none" : "block",
              marginBottom: "15px",
            }}
          >
            <Layout>
              <Layout.Section fullWidth>
                <Banner
                  onDismiss={() => {
                    setErrorBannerHidden(true);
                  }}
                  title="There is 1 error with this discount:"
                  status="critical"
                >
                  <p>{errorBannerMessage}</p>
                </Banner>
              </Layout.Section>
            </Layout>
          </div>
          <div
            style={{
              display: successBannerHidden ? "none" : "block",
              marginBottom: "15px",
            }}
          >
            <Layout>
              <Layout.Section fullWidth>
                <Banner
                  onDismiss={() => {
                    setSuccessBannerHidden(true);
                  }}
                  title={
                    id
                      ? `MembershipApp: ${savedDiscountCode} was updated successfully.`
                      : `MembershipApp: ${savedDiscountCode} was created successfully.`
                  }
                  status="success"
                >
                  <p>
                    This discount will be applied at checkout automatically.
                  </p>
                </Banner>
              </Layout.Section>
            </Layout>
          </div>
          <div>
            <Modal
              open={cancelWarningOpen}
              onClose={() => {
                setCancelWarningOpen(false);
              }}
              title="Discard all unsaved changes"
              primaryAction={{
                destructive: true,
                content: "Discard changes",
                onAction: () => {
                  setCancelWarningOpen(false);
                  navigateBack(true);
                },
              }}
              secondaryActions={[
                {
                  content: "Continue editing",
                  onAction: () => {
                    setCancelWarningOpen(false);
                  },
                },
              ]}
            >
              <Modal.Section>
                <p>
                  If you discard changes, you’ll delete any edits you made since
                  you last saved.
                </p>
              </Modal.Section>
            </Modal>
          </div>
          <div style={{ paddingBottom: "20px" }}>
            <Layout>
              <Layout.Section oneHalf>
                {/*Amount off products-------------------------------------------------------------------------------------*/}
                <Card>
                  <Card.Section>
                    <Stack distribution="equalSpacing" alignment="center">
                      <Stack.Item>
                        <Text variant="headingMd" as="h6">
                          Amount off products
                        </Text>
                      </Stack.Item>
                      <Stack.Item>
                        <Text variant="bodyMd" as="span" color="subdued">
                          Product discount
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
                          label="Discount code"
                          type="text"
                          maxLength={255}
                          value={discountCode}
                          onChange={(value) => {
                            console.log("value.....", value);
                            setDiscountCode(value);
                          }}
                          autoComplete="off"
                          helpText="This code will be automatically applied at checkout."
                        />
                      </div>
                      <Button
                        onClick={() => {
                          let randomString = cryptoRandomString({
                            length: 12,
                            type: "alphanumeric",
                          });
                          setDiscountCode(randomString.toUpperCase());
                        }}
                      >
                        Generate
                      </Button>
                    </div>
                  </Card.Section>
                </Card>
                {/*Value---------------------------------------------------------------------------------------------------*/}
                <Card>
                  <Card.Section>
                    <Stack distribution="equalSpacing" vertical>
                      <Stack.Item>
                        <Text variant="headingMd" as="h6">
                          Value
                        </Text>
                      </Stack.Item>
                      <Stack.Item>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "flex-end",
                            gap: "5px",
                          }}
                        >
                          <ButtonGroup segmented>
                            <Button
                              pressed={discountType === "Percentage"}
                              onClick={() => setDiscountType("Percentage")}
                            >
                              Percentage
                            </Button>
                            <Button
                              pressed={discountType === "Fixed amount"}
                              onClick={() => setDiscountType("Fixed amount")}
                            >
                              Fixed amount
                            </Button>
                          </ButtonGroup>
                          <div style={{ flex: 1 }}>
                            <TextField
                              label=""
                              type="text"
                              maxLength={20}
                              value={
                                discountType === "Percentage"
                                  ? discountPercentageValue
                                  : discountFixedValue
                              }
                              onChange={(value) => {
                                if (!isNaN(Number(value))) {
                                  if (discountType === "Percentage") {
                                    setPercentageDiscountValue(value);
                                  } else {
                                    setDiscountFixedValue(value);
                                  }
                                }
                              }}
                              suffix={discountType === "Percentage" ? "%" : ""}
                              prefix={
                                discountType === "Fixed amount"
                                  ? currencySymbol
                                  : ""
                              }
                              placeholder={
                                discountType === "Fixed amount" ? "0.00" : ""
                              }
                              autoComplete="off"
                            />
                          </div>
                        </div>
                      </Stack.Item>
                    </Stack>
                  </Card.Section>
                  <Card.Section>
                    <Stack distribution="equalSpacing" vertical>
                      <Stack.Item>
                        <Text variant="headingSm" as="h6">
                          Applies to
                        </Text>
                      </Stack.Item>
                      <Stack.Item>
                        <ChoiceList
                          title=""
                          allowMultiple={false}
                          choices={[
                            {
                              label: "Specific collections",
                              value: "collections",
                            },
                            { label: "Specific products", value: "products" },
                          ]}
                          selected={productSelectionType}
                          onChange={(value) => {
                            console.log("value.....", value);
                            setProductSelectionType(value);
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "flex-end",
                            gap: "5px",
                            marginTop: "10px",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <TextField
                              label=""
                              type="text"
                              placeholder={
                                productSelectionType[0] === "collections"
                                  ? "Search collections"
                                  : "Search products"
                              }
                              value={
                                productSelectionType[0] === "collections"
                                  ? collectionSearchQuery
                                  : productSearchQuery
                              }
                              onChange={(value) => {
                                if (productSelectionType[0] === "collections") {
                                  setCollectionSearchQuery(value);
                                  setCollectionPickerOpen(true);
                                } else {
                                  setProductSearchQuery(value);
                                  setProductPickerOpen(true);
                                }
                              }}
                              prefix={<Icon source={SearchMinor} />}
                              autoComplete="off"
                            />
                          </div>
                          <Button
                            onClick={() => {
                              if (productSelectionType[0] === "collections") {
                                setCollectionPickerOpen(true);
                              } else {
                                setProductPickerOpen(true);
                              }
                            }}
                          >
                            Browse
                          </Button>
                          <ResourcePicker
                            resourceType="Collection"
                            selectMultiple={true}
                            initialSelectionIds={selectedCollections}
                            initialQuery={collectionSearchQuery}
                            open={collectionPickerOpen}
                            onCancel={() => {
                              setCollectionPickerOpen(false);
                              setCollectionSearchQuery("");
                            }}
                            onSelection={(resources) => {
                              setCollectionPickerOpen(false);
                              setSelectedCollections(resources.selection);
                              setCollectionSearchQuery("");
                            }}
                          />
                          <ResourcePicker
                            resourceType="Product"
                            selectMultiple={true}
                            initialSelectionIds={selectedProducts}
                            initialQuery={productSearchQuery}
                            open={productPickerOpen}
                            onCancel={() => {
                              setProductPickerOpen(false);
                              setProductSearchQuery("");
                            }}
                            onSelection={(resources) => {
                              setProductPickerOpen(false);
                              setSelectedProducts(resources.selection);
                              setProductSearchQuery("");
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display:
                              (productSelectionType[0] === "collections" &&
                                selectedCollections.length === 0) ||
                              (productSelectionType[0] === "products" &&
                                selectedProducts.length === 0)
                                ? "none"
                                : "flex",
                            marginTop: "10px",
                            gap: "5px",
                          }}
                        >
                          <Text
                            variant="bodyMd"
                            as="span"
                            style={{ marginRight: "5x" }}
                          >
                            {productSelectionType[0] === "collections"
                              ? `${selectedCollections.length} collections`
                              : `${selectedProducts.length} products`}{" "}
                            selected.
                          </Text>
                          <Link
                            removeUnderline={true}
                            onClick={() => {
                              if (productSelectionType[0] === "collections") {
                                setCollectionPickerOpen(true);
                              } else {
                                setProductPickerOpen(true);
                              }
                            }}
                          >
                            Details
                          </Link>
                        </div>
                      </Stack.Item>
                    </Stack>
                  </Card.Section>
                </Card>
                {/*Customer eligibility------------------------------------------------------------------------------------*/}
                <Card>
                  <Card.Section>
                    <Stack distribution="equalSpacing" vertical>
                      <Stack.Item>
                        <Text variant="headingMd" as="h6">
                          Customer eligibility
                        </Text>
                      </Stack.Item>
                      <Stack.Item>
                        <div style={{ marginBottom: "20px" }}>
                          <ChoiceList
                            title=""
                            allowMultiple={false}
                            choices={[
                              // { label: "All customers", value: "all_customers" },
                              {
                                label: "Specific customer segments",
                                value: "customer_segments",
                              },
                            ]}
                            selected={customerSelectionType}
                            onChange={(value) => {
                              console.log(
                                "customerSelectionType.....",
                                customerSelectionType
                              );
                              setCustomerSelectionType(value);
                            }}
                          />
                        </div>
                        <TextField
                          autoFocus={true}
                          label=""
                          type="text"
                          placeholder={
                            customerSelectionType[0] === "customer_segments"
                              ? "Search customer segments"
                              : "Search customers"
                          }
                          value={query}
                          onChange={async (value) => {
                            console.log("value...", value);
                            setQuery(value);
                            await getCustomerSegments(false, false, value);
                            // await getFirstCustomers(false, false, value);
                          }}
                          prefix={<Icon source={SearchMinor} />}
                          autoComplete="off"
                        />
                        {customerSegments &&
                        customerSegments.length &&
                        !updateLoading ? (
                          <div>
                            <ResourceList
                              selectable={true}
                              // showHeader={true}
                              loading={loading}
                              items={customerSegments}
                              renderItem={(item, id, index) =>
                                renderItem(item, id, index)
                              }
                              selectedItems={selectedCustomerSegments}
                              onSelectionChange={(value) => {
                                console.log(
                                  "customerSegments.....",
                                  customerSegments
                                );
                                console.log("value.....", value);
                                setSelectedCustomerSegments(value);
                                console.log(
                                  "setSelectedCustomerSegments.....",
                                  selectedCustomerSegments
                                );
                              }}
                              resolveItemId={resolveItemIds}
                            />

                            <Pagination
                              hasPrevious
                              onPrevious={async () => {
                                console.log("query.....", query);
                                if (previous) {
                                  // setSelectedItemsIds([]);
                                  console.log("Previous.....", previous);
                                  // await getFirstCustomers(prev, "previous", query);
                                  await getCustomerSegments(
                                    previous,
                                    "previous",
                                    query
                                  );
                                }
                              }}
                              hasNext
                              onNext={async () => {
                                console.log("query.....", query);
                                if (next) {
                                  console.log("next.....", next);
                                  // setSelectedItemsIds([]);
                                  // await getFirstCustomers(next, "next", query);
                                  await getCustomerSegments(
                                    next,
                                    "next",
                                    query
                                  );
                                }
                              }}
                              alignment="center"
                            />
                          </div>
                        ) : (
                          <SkeletonExample num={5}/>
                        )}
                      </Stack.Item>
                    </Stack>
                  </Card.Section>
                </Card>
              </Layout.Section>
              {/*Summary---------------------------------------------------------------------------------------------------*/}
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          variant={
                            discountCode !== "" ? "headingMd" : "headingSm"
                          }
                          as="h6"
                          color={discountCode !== "" ? "ink" : "subdued"}
                        >
                          {discountCode !== ""
                            ? discountCode
                            : "No discount code yet."}
                        </Text>
                        {status ? <Badge status="success">{status}</Badge> : ""}
                      </div>
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
                    <List type="bullet">
                      <List.Item>
                        {usageCount ? usageCount + " used" : "0 used"}
                      </List.Item>
                    </List>
                  </Card.Section>
                </Card>
              </Layout.Section>
            </Layout>
          </div>
        </div>
      )}
    </Page>
  );
};

export default createDiscount;
