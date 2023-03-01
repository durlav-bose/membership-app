import { Router } from "express";
import { clientProvider } from "../../utils/clientProvider.js";
import subscriptionRoute from "./recurringSubscriptions.js";
import DiscountModel from "../../utils/models/DiscountModel.js";
import shopify from "../../utils/shopifyConfig.js";
import sessionHandler from "../../utils/sessionHandler.js";

const userRoutes = Router();
userRoutes.use(subscriptionRoute);

userRoutes.get("/api", (req, res) => {
  const sendData = { text: "This is coming from /apps/api route." };
  res.status(200).json(sendData);
});

userRoutes.post("/api", (req, res) => {
  res.status(200).json(req.body);
});

userRoutes.get("/api/gql", async (req, res) => {
  //false for offline session, true for online session
  const { client } = await clientProvider.graphqlClient({
    req,
    res,
    isOnline: false,
  });

  const shop = await client.query({
    data: `{
      shop {
        name
      }
    }`,
  });

  res.status(200).send(shop);
});

userRoutes.post("/api/discount-data", async (req, res) => {
  const { discountId, segmentId } = req.body;

  const deletedDiscount = await DiscountModel.deleteMany({
    discountId: `gid://shopify/PriceRule/${discountId}`,
  });
  const deletedSegment = await DiscountModel.deleteMany({
    segmentId: `gid://shopify/Segment/${segmentId}`,
  });

  console.log("deletedDiscount.....", deletedDiscount);
  console.log("deletedSegment.....", deletedSegment);

  const discountModel = await DiscountModel.create({
    discountId: `gid://shopify/PriceRule/${discountId}`,
    segmentId: `gid://shopify/Segment/${segmentId}`,
  });

  res.status(200).json(discountModel);
});

userRoutes.get("/api/tags", (req, res) => {
  // const sendData = { text: "This is coming from /apps/api/tags route." };
  const sendData = {
    tags: ["discount1", "discount2", "discount3", "discount4"],
  };
  res.status(200).json(sendData);
});

userRoutes.get("/api/discounts", async (req, res) => {
  //false for offline session, true for online session
  try {
    const { client } = await clientProvider.restClient({
      req,
      res,
      isOnline: false,
    });
  
    const response = await client.get({
      path: "price_rules.json",
    });
  
    res.status(200).json(response.body);
  } catch (error) {
    res.status(400).send(error)
  }
});

userRoutes.post("/api/discounts", async (req, res) => {
  try {
    const { client } = await clientProvider.restClient({
      req,
      res,
      isOnline: false,
    });

    const { id } = req.query;
    const { segmentId } = req.body;

    console.log("id.....", id);
    console.log("segmentId.....", segmentId);

    const response = await client.put({
      path: `price_rules/${id}.json`,
      data: JSON.stringify({
        price_rule: {
          customer_selection: "prerequisite",
          customer_segment_prerequisite_ids: [segmentId],
          prerequisite_customer_ids: [],
        },
      }),
    });
    console.log("response.body.....", response.body);
    res.status(200).send(response.body);
  } catch (error) {
    console.log("error.....", error);
  }
});

userRoutes.post("/api/discounts/create", async (req, res) => {
  try {
    const { client } = await clientProvider.restClient({
      req,
      res,
      isOnline: false,
    });

    let {
      title,
      code,
      valueType,
      value,
      customerSelection,
      prerequisiteCustomerSegmentIds,
      targetSelection,
      entitledCollectionIds,
      entitledProductIds,
    } = req.body;

    prerequisiteCustomerSegmentIds = prerequisiteCustomerSegmentIds.map((id) =>
      id.substring(id.lastIndexOf("/") + 1)
    );
    entitledCollectionIds = entitledCollectionIds.map((id) =>
      id.substring(id.lastIndexOf("/") + 1)
    );
    entitledProductIds = entitledProductIds.map((id) =>
      id.substring(id.lastIndexOf("/") + 1)
    );

    // Create price rule -------------------------------------------------------

    const priceRuleData = {
      price_rule: {
        title: title,
        value_type: valueType,
        value: value,
        customer_selection: customerSelection,
        customer_segment_prerequisite_ids: prerequisiteCustomerSegmentIds,
        target_type: "line_item",
        target_selection: targetSelection,
        entitled_collection_ids: entitledCollectionIds,
        entitled_product_ids: entitledProductIds,
        allocation_method: "each",
        starts_at: new Date().toISOString(),
        ends_at: null
      },
    };

    // console.log("routes priceRuleData.....", priceRuleData);

    const priceRuleResponse = await client.post({
      path: "price_rules.json",
      data: JSON.stringify(priceRuleData),
    });

    console.log("routes priceRuleResponse.body..... =======================================", priceRuleResponse.body);

    // Create discount code ----------------------------------------------------

    const priceRuleId = priceRuleResponse.body.price_rule.id;

    const discountCodeData = {
      discount_code: {
        code: code,
      },
    };

    // console.log("routes discountCodeData.....", discountCodeData);
    let discountCodeResponse;

    try {
      discountCodeResponse = await client.post({
        path: `price_rules/${priceRuleId}/discount_codes.json`,
        data: JSON.stringify(discountCodeData),
      });

      console.log(
        "discountCodeResponse discountCodeResponse discountCodeResponse..........",
        discountCodeResponse
      );
    } catch (error) {
      console.log("error inside try catch..........", error);
      const response = await client.delete({
        path: `price_rules/${priceRuleId}.json`,
      });

      console.log(
        "response.....++++++++++++++++++++++++++++++++++++++++++",
        response
      );
      res.status(422).send(error);
      return;
    }

    // console.log("routes discountCode.body.....", discountCodeResponse.body);

    // Save discount data to DB -----------------------------------------------

    const data = {
      priceRuleId: `gid://shopify/PriceRule/${priceRuleId}`,
      customerSelection: customerSelection,
      prerequisiteCustomerSegmentIds: prerequisiteCustomerSegmentIds.map(
        (id) => `gid://shopify/Segment/${id}`
      ),
    };

    const discountModel = await DiscountModel.create(data);

    console.log("routes discountModel.....", discountModel);

    // Return response ---------------------------------------------------------

    res.status(200).send(discountCodeResponse.body);
  } catch (error) {
    console.log("routes /api/discounts/create error.....", error);
    res.status(422).send(error);
  }
});

userRoutes.put("/api/gql/updateDiscount", async(req, res) => {
  try {
    
  console.log("req.body.....", req.body);
  const { client } = await clientProvider.graphqlClient({
    req,
    res,
    isOnline: false,
  });

  let {
    title,
    code,
    valueType,
    value,
    customerSelection,
    prerequisiteCustomerSegmentIds,
    targetSelection,
    entitledCollectionIds,
    entitledProductIds,
    priceRuleId 
  } = req.body;
  let id = priceRuleId.id;
  let queryProduct = `mutation priceRuleUpdate {
    priceRuleUpdate (
      id: "gid://shopify/PriceRule/${parseInt(id)}"    
      priceRule: { 
        title: "${title}", 
        allocationMethod: EACH, 
        customerSelection: { 
          segmentIds: ["${prerequisiteCustomerSegmentIds.join('","')}"]
        }, 
        itemEntitlements: {
          productIds: ["${entitledProductIds.join('","')}"]
          collectionIds: []
        }
        value: {
          ${valueType == 'percentage' ? `percentageValue: ${value}` : `fixedAmountValue : "${value}"`}
        }
      }
      priceRuleDiscountCode: {code: "${code}"}
    ) 
    {
      priceRule {
        id
        allocationMethod
        discountCodes(first: 10) {
          nodes {
            id
            code
            usageCount
          }
        }
        features
        summary
        title
        target
        status
        itemPrerequisites {
          products(first: 50) {
            nodes {
              id
              collections(first: 3) {
                nodes {
                  id
                }
              }
            }
          }
          collections(first: 3) {
            nodes {
              id
              image {
                altText
                id
                src
              }
              title
            }
          }
        }
        itemEntitlements {
          products(first: 50) {
            nodes {
              id
              collections(first: 3) {
                nodes {
                  id
                }
              }
            }
          }
          collections(first: 3) {
            nodes {
              id
              image {
                altText
                id
                src
              }
              title
            }
          }
        }
        customerSelection {
          customers(first: 100) {
            nodes {
              firstName
              lastName
              id
            }
          }
          segments {
            id
            name
            query
          }
        }
        value {
          ... on PriceRuleFixedAmountValue {
            __typename
            amount
          }
          ... on PriceRulePercentValue {
            __typename
            percentage
          }
        }
        valueV2 {
          ... on MoneyV2 {
            __typename
            amount
            currencyCode
          }
          ... on PricingPercentageValue {
            __typename
            percentage
          }
        }
      }
      userErrors {
        field
        message
      }
      priceRuleDiscountCode {
        code
        id
        usageCount
      }
      priceRuleUserErrors {
        code
        field
        message
      }
    }
  }`

  let queryCollection = `mutation priceRuleUpdate {
    priceRuleUpdate (
      id: "gid://shopify/PriceRule/${parseInt(id)}"    
      priceRule: { 
        title: "${title}", 
        allocationMethod: EACH, 
        customerSelection: { 
          segmentIds: ["${prerequisiteCustomerSegmentIds.join('","')}"]
        }, 
        itemEntitlements: {
          collectionIds: ["${entitledCollectionIds.join('","')}"]
          productIds: []
        }
        value: {
          ${valueType == 'percentage' ? `percentageValue: ${value}` : `fixedAmountValue : "${value}"`}
        }
      }
      priceRuleDiscountCode: {code: "${code}"}
    ) 
    {
      priceRule {
        id
        allocationMethod
        discountCodes(first: 10) {
          nodes {
            id
            code
            usageCount
          }
        }
        features
        summary
        title
        target
        status
        itemPrerequisites {
          products(first: 50) {
            nodes {
              id
              collections(first: 3) {
                nodes {
                  id
                }
              }
            }
          }
          collections(first: 3) {
            nodes {
              id
              image {
                altText
                id
                src
              }
              title
            }
          }
        }
        itemEntitlements {
          products(first: 50) {
            nodes {
              id
              collections(first: 3) {
                nodes {
                  id
                }
              }
            }
          }
          collections(first: 3) {
            nodes {
              id
              image {
                altText
                id
                src
              }
              title
            }
          }
        }
        customerSelection {
          customers(first: 10) {
            nodes {
              firstName
              lastName
              id
            }
          }
          segments {
            id
            name
            query
          }
        }
        value {
          ... on PriceRuleFixedAmountValue {
            __typename
            amount
          }
          ... on PriceRulePercentValue {
            __typename
            percentage
          }
        }
        valueV2 {
          ... on MoneyV2 {
            __typename
            amount
            currencyCode
          }
          ... on PricingPercentageValue {
            __typename
            percentage
          }
        }
      }
      userErrors {
        field
        message
      }
      priceRuleDiscountCode {
        code
        id
        usageCount
      }
      priceRuleUserErrors {
        code
        field
        message
      }
    }
  }`
  const response = await client.query({
    data: entitledProductIds && entitledProductIds.length ? queryProduct : queryCollection
  })

  console.log("RESPONSE...../api/gql/updateDiscount", response.body.data.priceRuleUpdate);
  let errors = response.body.data.priceRuleUpdate.userErrors;
  let customerSelections = response.body.data.priceRuleUpdate.priceRule.customerSelection;
  if(errors && errors.length == 0) {
    let id = response.body.data.priceRuleUpdate.priceRule.id;
    let segmentIds;
    let customerIds;
    if (customerSelections && customerSelections.customers && customerSelections.customers.length) {
      customerIds = customerSelections.customers.map(item => item.id);
    }
    if (customerSelections && customerSelections.segments && customerSelections.segments.length) {
      segmentIds = customerSelections.segments.map(item => item.id);
    }
    let filter = { priceRuleId: id };
    let update = { prerequisiteCustomerSegmentIds: segmentIds }
    const updateDiscount = await DiscountModel.findOneAndUpdate(filter, update, {
      new: true
    });
    console.log("updatedDiscount.....", updateDiscount);
  }
  res.status(200).send(response);

  } catch (error) {
    console.log("error...... update discount.....", error);
    res.status(400).send(error.response);
  }
})

userRoutes.get("/api/gql/customers", async (req, res) => {
  try {
    const { client } = await clientProvider.graphqlClient({
      req,
      res,
      isOnline: false,
    });

    let pagination = req.query.pageInfo;
    let query = req.query.query;
    let paginationInformation = req.query.info;
    let response;
    let customers;
    let pageInfo;
    console.log("pagination.....", pagination);
    console.log("query.....", query);


    if(query && query.length) {
      let queryWithNextPageInfo = `query {
        customers(query: "${query}", first: 15, after: "${pagination}") {
          nodes {
            id
            firstName
            lastName
            email
            tags
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`

      let queryWithPrevPageInfo = `query {
        customers(query: "${query}", last: 15, before: "${pagination}") {
          nodes {
            id
            firstName
            lastName
            email
            tags
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`

      let queryWithoutPageInfo = `query {
        customers(query: "${query}", first: 15) {
          nodes {
            id
            firstName
            lastName
            email
            tags
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`

      response = await client.query({
        data: pagination ? paginationInformation == "next" ? queryWithNextPageInfo : paginationInformation == "previous" ? queryWithPrevPageInfo : queryWithoutPageInfo: queryWithoutPageInfo
      })

      console.log("response.....with query.....", response);

    } else {
      let queryWithNextPageInfo = `query {
        customers(first: 10, after: "${pagination}") {
          nodes {
            id
            firstName
            lastName
            email
            tags
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`

      let queryWithPrevPageInfo = `query {
        customers(last: 10, before: "${pagination}") {
          nodes {
            id
            firstName
            lastName
            email
            tags
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`

      let queryWithoutPageInfo = `query {
        customers(first: 10) {
          nodes {
            id
            firstName
            lastName
            email
            tags
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`

      response = await client.query({
        data: pagination ? paginationInformation == "next" ? queryWithNextPageInfo : paginationInformation == "previous" ? queryWithPrevPageInfo : queryWithoutPageInfo: queryWithoutPageInfo
      })
      console.log("response.....without query.....", response)

    }

    customers = response.body.data.customers.nodes;
    pageInfo = response.body.data.customers.pageInfo;
    res.status(200).send({ customers: customers, pageInfo: pageInfo });
    

  } catch (error) {
    console.log("customers error.....", error.response.errors);
    res.status(500).send(error);
  }
});

userRoutes.get("/api/gql/discounts", async (req, res) => {
  try {
    const { client } = await clientProvider.graphqlClient({
      req,
      res,
      isOnline: false,
    });
    const discounts = await client.query({
      data: `{
        priceRules(first: 150, query: "title:MembershipApp:*") {
          edges {
            node {
              id
              title
              summary
              startsAt
              endsAt
              status
              usageCount
              discountClass
              discountCodes(first: 1) {
                nodes {
                  code
                  id
                  usageCount
                }
              }
            }
          }
        }
      }`,
    });
    console.log("discounts.....", discounts);
    res.status(200).send(discounts);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

userRoutes.get("/api/gql/singleDiscount", async (req, res) => {
  try {
    const { client } = await clientProvider.graphqlClient({
      req,
      res,
      isOnline: false,
    });
    let id;
    if (req.query && req.query.id) {
      id = req.query.id;
    }
    const singleDiscount = await client.query({
      data: `{
        priceRule(id: "gid://shopify/PriceRule/${parseInt(id)}") {
          id
          hasTimelineComment
          features
          discountCodesCount
          discountClass
          title
          summary
          startsAt
          endsAt
          status
          usageCount
          itemPrerequisites {
            products(first: 50) {
              nodes {
                id
                collections(first: 3) {
                  nodes {
                    id
                  }
                }
              }
            }
            collections(first: 3) {
              nodes {
                id
                image {
                  altText
                  id
                  src
                }
                title
              }
            }
          }
          itemEntitlements {
            products(first: 50) {
              nodes {
                id
                collections(first: 3) {
                  nodes {
                    id
                  }
                }
              }
            }
            collections(first: 3) {
              nodes {
                id
                image {
                  altText
                  id
                  src
                }
                title
              }
            }
          }
          customerSelection {
            customers(first: 10) {
              nodes {
                firstName
                lastName
                id
              }
            }
            segments {
              id
              name
              query
            }
          }
          discountCodes(first: 10) {
            nodes {
              code
              id
              usageCount
            }
          }
          value {
            ... on PriceRuleFixedAmountValue {
              __typename
              amount
            }
            ... on PriceRulePercentValue {
              __typename
              percentage
            }
          }
          valueV2 {
            ... on MoneyV2 {
              __typename
              amount
              currencyCode
            }
            ... on PricingPercentageValue {
              __typename
              percentage
            }
          }
        }
      }`,
    });
    console.log("singleDiscount.....???????????????????", singleDiscount.body.data.priceRule);
    res.status(200).send(singleDiscount);
  } catch (error) {
    console.log("error.....", error.response.errors);
    res.status(400).send(error);
  }
});

userRoutes.post("/api/discounts/delete", async (req, res) => {
  try {
    const { client } = await clientProvider.restClient({
      req,
      res,
      isOnline: false,
    });
    const { priceRuleId } = req.body;
    let id = priceRuleId.substring(priceRuleId.lastIndexOf("/") + 1);
    const response = await client.delete({
      path: `price_rules/${id}.json`,
    });

    const deletedDiscount = await DiscountModel.deleteMany({
      priceRuleId: priceRuleId,
    });

    res.status(200).send(response);
  } catch (error) {
    console.log("error.....", error);
  }
});

userRoutes.get("/api/gql/segments", async (req, res) => {
  try {

    let pagination = req.query.pageInfo;
    let paginationInformation = req.query.info;
    let query = req.query.query;
    let total = req.query.total;
    const { client } = await clientProvider.graphqlClient({
      req,
      res,
      isOnline: false,
    });
    let queryWithNextPageInfo;
    let queryWithPrevPageInfo;
    let queryWithoutPageInfo;

    if (query && query.length) {
      queryWithNextPageInfo = `{
        segmentCount
        segments(query: "name:${query ? query : ''}", first: ${total ? total : 5}, after: "${pagination}") {
          edges {
            node {
              id
              name
              query
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`
  
      queryWithPrevPageInfo = `{
        segmentCount
        segments(query: "name:${query ? query : ''}", last: ${total ? total : 5}, before: "${pagination}") {
          edges {
            node {
              id
              name
              query
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`
  
      queryWithoutPageInfo = `query {
        segmentCount
        segments(first: ${total ? total : 5}, query: "name:${query ? query : ''}") {
          edges {
            node {
              id
              name
              query
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`
    } else {
      queryWithNextPageInfo = `{
        segmentCount
        segments(first: ${total ? total : 5}, after: "${pagination}") {
          edges {
            node {
              id
              name
              query
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`
  
      queryWithPrevPageInfo = `{
        segmentCount
        segments(last: ${total ? total : 5}, before: "${pagination}") {
          edges {
            node {
              id
              name
              query
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`
  
      queryWithoutPageInfo = `query {
        segmentCount
        segments(first: ${total ? total : 5}) {
          edges {
            node {
              id
              name
              query
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`
    }

    

    const response = await client.query({
        data: pagination ? paginationInformation == "next" ? queryWithNextPageInfo : paginationInformation == "previous" ? queryWithPrevPageInfo : queryWithoutPageInfo: queryWithoutPageInfo
      })
    console.log("response......", response);
    res.status(200).send(response);

  } catch (error) {
    console.log("error.....", error.response.errors);
    res.status(400).send(error);
  }
});

// userRoutes.get("/api/gql/customers", async (req, res) => {
//   try {
//     const { client } = await clientProvider.graphqlClient({
//       req,
//       res,
//       isOnline: false,
//     });
  
//     const { tag } = req.query;
//     console.log(tag);
  
//     const response = await client.query({
//       data: `{
//         customers(first: 250, query: "tag:${tag}") {
//           edges {
//             node {
//               id
//               tags
//             }
//           }
//         }
//       }`,
//     });
//     res.status(200).send(response);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

userRoutes.post("/api/gql/createSegment", async(req, res) => {
  
  let name = req.body.segmentName;
  let tag = req.body.segmentTag;
  // let query = "customer_tags CONTAINS 'discount20'";
  let query = `customer_tags CONTAINS '${tag}'`;

  const { client } = await clientProvider.graphqlClient({
    req,
    res,
    isOnline: false,
  });

  const response = await client.query({
    data: `mutation segmentCreate {
      segmentCreate(
        name: "${name}",
        query: "${query}"
      ) {
        segment {
          name
          query
        }
        userErrors {
          field
          message
        }
      }
    }`,
    variables: {
      name,
      query,
    },
  });

  console.log("response.body.data.segmentCreate.....", response.body.data.segmentCreate)

  let segmentResponse;
  let message;
  let field;
  if(response.body.data && response.body.data.segmentCreate) {
    segmentResponse = response.body.data.segmentCreate;
  }
  if(response.body.data.segmentCreate && response.body.data.segmentCreate.userErrors && response.body.data.segmentCreate.userErrors.length) {
    message = response.body.data.segmentCreate.userErrors[0].message;
    field = response.body.data.segmentCreate.userErrors[0].field;
  }

  res.status(200).send({
    segmentResponse,
    message
  })
})

userRoutes.put("/api/gql/updateSegment", async(req, res) => {
  
  let name = req.body.segmentName;
  let id = req.body.segmentId;

  console.log("name...../api/gql/updateSegment", name);
  console.log("id...../api/gql/updateSegment", id);

  const { client } = await clientProvider.graphqlClient({
    req,
    res,
    isOnline: false,
  });

  const response = await client.query({
    data: `mutation segmentUpdate {
      segmentUpdate(id: "gid://shopify/Segment/${parseInt(id)}", name: "${name}") {
        segment {
          id
          name
        }
        userErrors {
          message
          field
        }
      }
    }`,
    variables: {
      id,
      name
    }
  })

  // const response = await client.query({
  //   data: `mutation segmentCreate {
  //     segmentCreate(
  //       name: "${name}",
  //       query: "${query}"
  //     ) {
  //       segment {
  //         name
  //         query
  //       }
  //       userErrors {
  //         field
  //         message
  //       }
  //     }
  //   }`,
  //   variables: {
  //     name,
  //     query,
  //   },
  // });

  console.log("response.body.data./api/gql/updateSegment.....", response.body.data)

  let segmentResponse;
  let message;
  let field;
  if(response.body.data && response.body.data.segmentCreate) {
    segmentResponse = response.body.data.segmentCreate;
  }
  if(response.body.data.segmentCreate && response.body.data.segmentCreate.userErrors && response.body.data.segmentCreate.userErrors.length) {
    message = response.body.data.segmentCreate.userErrors[0].message;
    field = response.body.data.segmentCreate.userErrors[0].field;
  }

  res.status(200).send({
    segmentResponse,
    message
  })
})

userRoutes.get("/api/gql/getSegment", async(req, res) => {
  try {

    let id = req.query.id;
    console.log("id.....", id);
    const { client } = await clientProvider.graphqlClient({
      req,
      res,
      isOnline: false,
    });
    const response = await client.query({
      data: `{
        segment(id: "gid://shopify/Segment/${parseInt(id)}") {
          id
          name
          query
        }
      }`
    });
    let segment = response.body.data.segment;
    console.log("segment.....", segment);
    res.status(200).send(segment);

  } catch (error) {
    console.log("error", error);
    res.status(400).send(error);
  }
})

userRoutes.delete("/api/gql/deleteSegment", async(req, res) => {
  try {
    let id = req.body.id;
    const { client } = await clientProvider.graphqlClient({
      req,
      res,
      isOnline: false,
    });
    const response = await client.query({
      data: `mutation segmentDelete{
        segmentDelete(
          id: "${id}"
        ) {
          deletedSegmentId
          userErrors {
            field
            message
          }
        }
      }`,
      variables: {
        id
      },
    });
    
    let segmentId = response.body.data.segmentDelete.deletedSegmentId;
    let deleteSegment = await DiscountModel.update(
      {},
      { $pull: { prerequisiteCustomerSegmentIds: segmentId } },
      { multi: true }
    )
    console.log("deleteSegment.....", deleteSegment);
    res.status(200).send(response);
  } catch (error) {
    console.log("error.....", error);
    res.status(400).send(error);
  }
})

userRoutes.put("/api/update/customers", async (req, res) => {
  console.log("working......", req.body);
  let ids = req.body.ids.join(",");
  let singleTag = req.body.tag
  console.log("ids", ids);
  const { client } = await clientProvider.restClient({
    req,
    res,
    isOnline: false,
  });

  const response = await client.get({
    path: `customers.json?ids=${ids}`, 
  });

  console.log("response..... customers", response.body.customers);

  let p = [];
  let count = 0;
  if (response && response.body && response.body.customers && response.body.customers.length) {
    let customers = response.body.customers;
    for(let i = 0; i< customers.length; i++) {
      let id = customers[i].id;
      let tags = customers[i].tags;
      console.log("tags.........", tags);
      if(customers[i].tags.length == 0) {
        tags = customers[i].tags.concat(singleTag);
      } else {
        tags = customers[i].tags.concat(",", singleTag);
      }

      console.log("tags.....", tags);
      console.log("id.....", id);

      const customerUpdate = await client.put({
        path: `customers/${id}.json`,
        data: JSON.stringify({
          customer: {
            tags: tags
          },
        }),
      })

      count ++;
      console.log("customerUpdate.....", customerUpdate.body);
      console.log("customerUpdate.....", customerUpdate.body.customer.tags);
    }

    if(count == customers.length) {
      res.status(200).send({
        message: "All the customer updated successfully"
      })
    }
  }
})

userRoutes.get("/api/gql/currency", async (req, res) => {
  try {
    const { client } = await clientProvider.graphqlClient({
      req,
      res,
      isOnline: false,
    });
  
    const response = await client.query({
      data: `{
        shop {
          currencyCode
        }
      }`,
    });
  
    res.status(200).send(response);
  } catch (error) {
    res.status.send(error);
  }
});

export default userRoutes;
