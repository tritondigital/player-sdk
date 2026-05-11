FROM ubuntu:latest

# Install tools
RUN apt update && apt install -y \
    curl \
    build-essential

# Install dependencies for puppeteer browsers
RUN apt install -y \
    libglib2.0-0 libnss3 libnss3-dev libxss1 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcomposite1 libxrandr2 libxdamage1 libpango-1.0-0 libnss3 libxshmfence1 libgbm-dev libxfixes3 libxkbcommon-x11-0 libcairo2 libasound2t64

# Install phantomjs
ENV PHANTOMJS_VERSION=2.1.1
RUN cd /tmp && \
    curl -k -Ls https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-${PHANTOMJS_VERSION}-linux-x86_64.tar.bz2 | tar -jxf - && \
    cp phantomjs-${PHANTOMJS_VERSION}-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs

# Install node
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt install -y nodejs
RUN npm install -g npm 

ENV NODE_ENV=production

# Create dir structure
RUN mkdir -p /workspace/web-sdk

# Switch work directory
WORKDIR /workspace/web-sdk

# Install node dependencies
ADD package*.json ./
ADD .npmrc ./

# The project is old and some dependencies cannot be installed anymore. 
# --force flag and manual install on puppeteer are necessary until we upgrade all dependencies.
RUN npm install --production=false --force
RUN node node_modules/puppeteer/install.js

# Add project files
ADD server.js   .
ADD config      ./config
ADD src         ./src
ADD test        ./test
ADD dev         ./dev
ADD public      ./public