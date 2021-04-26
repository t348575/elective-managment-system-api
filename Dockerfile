FROM node:15

WORKDIR ./

COPY package*.json ./

COPY . .

RUN yarn install

RUN yarn build:prod

EXPOSE 3000

CMD ["yarn", "start:prod:debug"]