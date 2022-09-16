# Base 이미지를 nodeJS alpine 버전으로 사용
FROM node:alpine
ENV DOCKERIZE_VERSION v0.2.0
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# 작업 디렉토리 전환
RUN mkdir /backend
WORKDIR /backend
ENV PATH /backend/node_modules/.bin:$PATH

# local 컴터에있는  package.json 파일을 현재 워킹 디렉토리에 복사 
COPY package*.json ./

# local machine 에서 npm install 실행 
RUN npm install --no-cache

COPY . .

RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ./docker-entrypoint.sh

EXPOSE 3000