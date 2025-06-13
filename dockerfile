FROM node:23

WORKDIR /app

COPY . .

ENV PUBLIC_API_URL=/api

COPY package*.json ./
RUN npm install

RUN npm run build

EXPOSE 80

CMD ["npm", "run", "preview"]