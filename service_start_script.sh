#!/bin/bash

service_path='/root/ablecloud-crm'

# keycloak 시작
keycloak_path='/root/keycloak-25.0.6_test'
cd $keycloak_path
bin/kc.sh start-dev

# Service_License 시작
cd $service_path'/Service_License'
npm run start:dev &

# Service_Partner_Customer 시작
cd $service_path'Service_Partner_Customer'
npm run start:dev &

# Service_Product 시작
cd $service_path'/Service_Product'
npm run start:dev &

# Service_Business 시작
cd $service_path'/Service_Business'
npm run start:dev &