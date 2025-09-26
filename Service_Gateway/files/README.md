제품 마운트 경로

curl
mount -t nfs 10.10.0.203:/volume1/images/ABLESTACK-ISO /root/ablecloud-crm/Service_Gateway/files/iso

mount -t nfs 10.10.0.203:/volume1/images/AddOn /root/ablecloud-crm/Service_Gateway/files/addon

mount -t nfs 10.10.0.203:"/volume1/images/OS-Template/Mold Cloud Images" /root/ablecloud-crm/Service_Gateway/files/template

fstab
10.10.0.203:/volume1/images/ABLESTACK-ISO /root/ablecloud-crm/Service_Gateway/files/iso nfs defaults 0 0

10.10.0.203:/volume1/images/AddOn /root/ablecloud-crm/Service_Gateway/files/addon nfs defaults 0 0

10.10.0.203:”/volume1/images/OS-Template/Mold Cloud Images" /root/ablecloud-crm/Service_Gateway/files/template nfs defaults 0 0