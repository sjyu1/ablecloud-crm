#!/bin/bash

#keycloak
/root/keycloak-25.0.6_test/bin/kc.sh start-dev &

# Service_License 시작
/usr/bin/npm run start --prefix /root/ablecloud-crm/Service_License &

# Service_Partner_Customer 시작
/usr/bin/npm run start --prefix /root/ablecloud-crm/Service_Partner_Customer &

# Service_Product 시작
/usr/bin/npm run start --prefix /root/ablecloud-crm/Service_Product &

# Service_Business 시작
/usr/bin/npm run start --prefix /root/ablecloud-crm/Service_Business &

# Service_Gateway 시작
/usr/bin/npm run dev --prefix /root/ablecloud-crm/Service_Gateway &