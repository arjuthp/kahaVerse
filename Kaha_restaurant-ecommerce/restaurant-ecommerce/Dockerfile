FROM node:alpine

WORKDIR /restaurant-ecommerce

COPY package.json yarn.lock ./

COPY . .

RUN yarn install

CMD [ "yarn", "dev" ]