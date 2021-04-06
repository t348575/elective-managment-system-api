FROM node:15

WORKDIR ./

COPY package*.json ./

RUN yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "start:prod"]


