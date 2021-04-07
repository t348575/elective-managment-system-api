FROM node:15

WORKDIR ./

COPY package*.json ./

RUN yarn install

RUN yarn build:prod

COPY . .

EXPOSE 3000

CMD ["yarn", "start:prod"]


