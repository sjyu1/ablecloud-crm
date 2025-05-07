# timer 스크립트

0. 서비스
systemctl status web-health-check.service

1. web-health-check.sh
파일경로 : /usr/local/bin/web-health-check.sh(파일권한 확인)

------------------------------------------
#!/bin/bash

# 확인할 URL
URL="http://localhost:3000/login"

# 요청을 보내고 응답을 확인
if ! curl -s --max-time 5 "$URL" > /dev/null; then
    echo "$(date): No response from $URL. Restarting Lic Service"
    sudo /root/ablecloud-crm/service_stop_script.sh
    sleep 2
    sudo /root/ablecloud-crm/service_start_script.sh
else
    echo "$(date): $URL is healthy."
fi
------------------------------------------


2. web-health-check.service
파일경로 : /etc/systemd/system/web-health-check.service

------------------------------------------
[Unit]
Description=Web Health Check Service
Wants=web-health-check.timer

[Service]
Type=oneshot
ExecStart=/usr/local/bin/web-health-check.sh
------------------------------------------


3. web-health-check.timer
파일경로 : /etc/systemd/system/web-health-check.timer

------------------------------------------
[Unit]
Description=Run Web Health Check every 10 seconds

[Timer]
OnBootSec=10
OnUnitActiveSec=60
AccuracySec=1s
Persistent=true

[Install]
WantedBy=timers.target
------------------------------------------