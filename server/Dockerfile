FROM node:latest
# RUN apt-get update && apt-get install -y python3
# Встановлення залежностей для canvas

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "app.js"]