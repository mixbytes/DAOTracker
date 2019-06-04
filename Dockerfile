FROM node:10.16.0-stretch
SHELL ["/bin/bash", "-c"]
WORKDIR /opt/eostracker
COPY . /opt/eostracker
RUN npm install && npm run build

EXPOSE 8080
CMD ["npm", "start"]
