#/bin/bash

DB_USER="user"
DB_PASS="Ablecloud1!"
DB_NAME="licenses"
DB_USER_NAME="keycloak"
BACKUP_DIR="/opt/mysql_backup"
DATE=$(date +"%Y-%m-%d")

mkdir -p $BACKUP_DIR

mysqldump --user=$DB_USER --password=$DB_PASS $DB_NAME > $BACKUP_DIR/$DB_NAME-$DATE.sql --single-transaction --quick --no-tablespaces
gzip $BACKUP_DIR/$DB_NAME-$DATE.sql

mysqldump --user=$DB_USER --password=$DB_PASS $DB_USER_NAME > $BACKUP_DIR/$DB_USER_NAME-$DATE.sql --single-transaction --quick --no-tablespaces
gzip $BACKUP_DIR/$DB_USER_NAME-$DATE.sql

find $BACKUP_DIR -type f -name "*.gz" -mtime +7 -delete



# crontab(매일 1시마다 백업. backup_script.sh 파일권한 확인)
# crontab -e
# 0 1 * * * /opt/mysql_backup.sh >> /opt/mysql_backup.log 2>&1