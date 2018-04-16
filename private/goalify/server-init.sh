#!/bin/bash
# NOTE: The commands here only applicable for Ubuntu 16.04 Xenial, do not use it for other distros

echo IMPORTANT: Map domain to this VPS instance first

# Get user inputs for some customizable variables
read -p "Subdomain: " SUBDOMAIN

# Update server to latest packages
sudo apt update && sudo apt upgrade -y

# Install prerequisite software
sudo apt install -y software-properties-common nginx git graphicsmagick

# Add Mongo DB app source
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list

# Add NodeJS app source (which already include npm)
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

# Add certbot app source
sudo add-apt-repository -y ppa:certbot/certbot

# Install needed software
sudo apt update && sudo apt install -y python-certbot-nginx mongodb-org nodejs


# Enable replication for mongodb for better concurrency
echo "replication:" | sudo tee -a /etc/mongod.conf
echo "  replSetName: \"rs0\"" | sudo tee -a /etc/mongod.conf

# TODO: enable mongo replica set (https://rocket.chat/docs/installation/manual-installation/ubuntu/)
# Still need to access mongo shell and execute:
# rs.initiate()

# Start mongod service
sudo systemctl start mongod
# Enable mongod service auto restart
sudo systemctl enable mongod

# Create app user
sudo useradd goalifychat


RC_VERSION=".63.0-develop"
# OR
# RC_VERSION="latest"

# Download built Rocket Chat server
# adapted from https://github.com/RocketChat/Rocket.Chat/blob/develop/.docker/Dockerfile
set -x \
 && curl -SLf "https://s3-ap-southeast-1.amazonaws.com/goalify.chat/downloads/beta/goalify-chat-server.tar.gz" -o goalify.chat.tgz \
 && sudo mkdir -p /app \
 && sudo tar -zxf goalify.chat.tgz -C /app \
 && rm goalify.chat.tgz \
 && cd /app/bundle/programs/server \
 && sudo npm install \
 && sudo npm cache clear --force \
 && sudo chown -R goalifychat:goalifychat /app

# Create systemd service file for rocketchat server
NODE_PATH=`which node`
APP_PATH="/app/bundle"

cat > goalifychat.service <<EOF
[Unit]
Description=A Goalify chat app
Requires=mongod.service
After=mongod.service

[Service]
ExecStart=$NODE_PATH ${APP_PATH}/main.js
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=goalifychat
User=goalifychat
Group=goalifychat
Environment=MONGO_OPLOG_URL=mongodb://localhost:27017/local?replicaSet=rs0
Environment=MONGO_URL=mongodb://localhost:27017/goalifychat?replicaSet=rs0
Environment=ROOT_URL=https://$SUBDOMAIN.goalify.chat
Environment=SUBDOMAIN=$SUBDOMAIN
Environment=PORT=3000
Environment=ADMIN_USERNAME=admin
Environment=ADMIN_PASS=supersecret
Environment=ADMIN_EMAIL=thanh@goalify.plus

[Install]
WantedBy=multi-user.target
EOF

sudo cp goalifychat.service /etc/systemd/system/goalifychat.service
rm goalifychat.service

# start rocketchat server and make it run as service (auto start)
sudo systemctl start goalifychat.service && sudo systemctl enable goalifychat.service

# Create Nginx reversed proxy config:
cat > nginx-site.conf <<EOF
# Fix websocket proxying
map \$http_upgrade \$connection_upgrade {
	default upgrade;
	''      close;
}

server {
	listen 80;
	listen [::]:80;

	index index.html index.htm;

	server_name $SUBDOMAIN.goalify.chat;

	location / {
		proxy_redirect     off;
		proxy_set_header   X-Real-IP         \$remote_addr;
		proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
		proxy_set_header   X-Forwarded-Proto \$scheme;
		proxy_set_header   Host              \$http_host;
		proxy_set_header   X-NginX-Proxy     true;
		proxy_http_version 1.1;
		proxy_pass         http://127.0.0.1:3000;
		# Websocket proxying
		proxy_set_header   Upgrade           \$http_upgrade;
		proxy_set_header   Connection        \$connection_upgrade;
	}
}
EOF

sudo cp nginx-site.conf /etc/nginx/sites-available/default
rm nginx-site.service

# Enable web proxies with secured SSL certificate from let's encrypt
echo NOTE: Mannual, interactive inputs ahead for certbot
sudo certbot --nginx

# Restart nginx with new config
sudo systemctl restart nginx

echo "Note: Remember to enable HTTP2 at /etc/nginx/sites-available/default"

echo "Goalifychat server system initialization complete!"

