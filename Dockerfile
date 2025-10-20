FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npx next telemetry disable

COPY --chown=app:app . .

EXPOSE 3000
