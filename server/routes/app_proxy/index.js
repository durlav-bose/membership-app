import { clientProvider } from "../../../utils/clientProvider.js";
import { Router } from "express";
import DiscountModel from "../../../utils/models/DiscountModel.js";
const proxyRouter = Router();
import shopify from "../../../utils/shopifyConfig.js";
import sessionHandler from "../../../utils/sessionHandler.js";


proxyRouter.get("/json", async (req, res) => {
  let userId = req.query.userId;
  // let host = req.headers["x-shop-domain"];
  let host = req.query.shop;
  console.log("userId.....", userId);
  console.log("host.....", host);
  // console.log("shopify", shopify);
  const session = shopify.session.getOfflineId(host);
  let result;
  if(session) {
    result = await sessionHandler.loadSession(session);
  }

  const discountDetails = await DiscountModel.find({});
  // console.log("discountDetails.....", discountDetails);

  let segmentIdList = []

  if(discountDetails && discountDetails.length) {
    segmentIdList = discountDetails.map((item) => {
      return item.prerequisiteCustomerSegmentIds;
    })
  }

  // console.log("segmentIdList.....", segmentIdList);
  let client;
  if(result) {
    client  = new shopify.clients.Graphql({ session: result });
  }

  console.log("client.........", client);

  if (client) {
    try {
      let segmentIds = [];
      segmentIdList.forEach(item => {
        console.log("item.....",item);
        item.forEach((el,index) => {
          if(!segmentIds.includes(el)) {
            segmentIds.push(el);
          }
        })
      })
  
      let match = await client.query({
        data: `query {
          customerSegmentMembership(customerId: "gid://shopify/Customer/${userId}", segmentIds: ["${segmentIds.join('","')}"] ) {
            memberships {
              isMember
              segmentId
            }
          }
        }`
      })
  
      console.log("match....", match.body.data.customerSegmentMembership.memberships);
  
      let totalSegments = match.body.data.customerSegmentMembership.memberships;
      let trueSegment = totalSegments.find((item) => {
        return item.isMember
      })
  
      let trueSegmentId = trueSegment?.segmentId;
      console.log("trueSegmentId.....", trueSegmentId);
      if(!trueSegmentId) return 
  
      const filteredDiscount = discountDetails.filter(item => item.prerequisiteCustomerSegmentIds.includes(trueSegmentId));
      console.log("filteredDiscount.....", filteredDiscount[filteredDiscount.length-1]);
  
      const filteredDiscountId = filteredDiscount[filteredDiscount.length-1].priceRuleId;
  
      console.log("filteredDiscountId.....", filteredDiscountId);
  
      const discounts = await client.query({
        data: `{
          priceRule(id: "${filteredDiscountId}") {
            id
            title
            allocationMethod
            features
            discountClass
            discountCodes(first: 1) {
              nodes {
                code
                id
                usageCount
              }
            }
            discountCodesCount
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
            itemEntitlements {
              collections(first: 3) {
                nodes {
                  id
                  products(first: 50) {
                    nodes {
                      handle
                      id
                      variants(first: 2) {
                        nodes {
                          id
                          price
                        }
                      }
                    }
                  }
                }
              }
              products(first: 30) {
                nodes {
                  handle
                  id
                  variants(first: 3) {
                    nodes {
                      id
                      price
                    }
                  }
                }
              }
            }
          }
        }`,
      });
  
      console.log("discounts.body.....", discounts.body)
      let products = discounts.body.data.priceRule.itemEntitlements.products;
      let collections = discounts.body.data.priceRule.itemEntitlements.collections.nodes;
      let handles = [];
      let productIds = [];
  
      // console.log("collections............................", collections[0].products.nodes[0].variants);
      console.log("collections............................", collections);
      // console.log("products.nodes...............................", discounts.body.data.priceRule.itemEntitlements);
      console.log("products.nodes...............................", products);
      if(products && products.nodes && products.nodes.length) {
        products.nodes.forEach(item => {
          console.log('item :>> ', item);
          console.log("item.....", item.variants.nodes)
          handles.push(item.handle);
          let id = item.id.slice(item.id.length - 13, item.id.length)
          productIds.push(id);
        });
      } else if (collections && collections.length) {
        console.log("collections.....", collections);
        collections.forEach(item => {
          console.log("item.....", item);
          if (item.products && item.products.nodes && item.products.nodes.length) {
            let products = item.products.nodes;
            // console.log("products.....", products);
            products.forEach(el => {
              if(!handles.includes(el.handle)) {
                handles.push(el.handle);
                let id = el.id.slice(el.id.length - 13, el.id.length)
                productIds.push(id);
              }
            })
          }
        })
      }
  
      console.log("handles.....", handles);
      console.log("productIds.....", productIds);
  
      let priceRule = discounts.body.data.priceRule;
      let discountCode = priceRule.discountCodes.nodes[0].code;
  
      console.log("priceRule.....", priceRule);
      console.log("code.....", discountCode);

      const response = await client.query({
        data: `{
          shop {
            currencyCode
          }
        }`,
      });

      console.log('response ................................. ', response.body.data.shop.currencyCode);
      let currencyCode = response.body.data.shop.currencyCode;
  
      let obj = {
        discountCode: discountCode,
        discountPercentage: priceRule.value.percentage,
        discountAmount: priceRule.value.amount,
        allocationMethod: priceRule.allocationMethod,
        currencyCode: currencyCode,
        handles,
        productIds
      }
  
      res.status(200).json(obj);
    } catch (err) {
      if(err.response && err.response.errors && err.response.errors.length) {
        console.log("error.........",err.response.errors);
        console.log('locations :>> ', err.response.errors[0].locations);
      } else {
        console.log('err :>> ', err);
      }
      res.status(500).json(err);
    }
  }
});

export default proxyRouter;
