FROM node:alpine

WORKDIR /restaurant-ecommerce

COPY package.json yarn.lock ./

COPY . .

RUN yarn install

CMD ["sh", "-c", "npm run migration:run && node dist/main.js"]