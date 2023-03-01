FROM node:18-alpine

ARG NODE_ENV

ENV NODE_ENV=${NODE_ENV} \
    SHOPIFY_APP_URL=https://membership.socialcommerceguys.com \
    SHOPIFY_API_SCOPES=read_customers,write_customers,read_products,write_products,read_discounts,write_discounts,read_price_rules,write_price_rules \
    SHOPIFY_API_KEY=d5182f2d495da8a1da52191d00569133 \
    SHOPIFY_API_SECRET=ff09ebd4f298afa6ce068f6a2b828574 \
    SHOPIFY_API_VERSION=2023-01 \
    ENCRYPTION_STRING=ENCRYPTION_STRING \
    NPM_CONFIG_FORCE=true \
    MONGO_URL=mongodb://member:6Y5p%23%409D%405*m@34.236.161.121:27017/member
EXPOSE 8081
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
