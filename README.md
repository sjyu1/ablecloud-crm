# ablecloud-crm

## 프로젝트 구조

- keycloak : 인증 서버(포트 8080)
- Service_Gateway : crm 프론트엔드 프로젝트(포트 3000)
- Service_License : 라이센스 백엔드 프로젝트(포트 3001)

## 서비스 실행

- Service_Gateway : crm 프론트엔드 프로젝트(포트 3000)

    npm install 또는 npm audit fix --force
    npm run dev (개발모드. product 모드: npm run build -> npm run start)


    - 버전정보
    node    v18.20.4
    next    v15.2.1

- Service_License : 라이센스 백엔드 프로젝트(포트 3001)

    npm install 또는 npm audit fix --force
    npm run start:dev   (개발모드.)

    - 버전정보
    node    v18.20.4
    nest    v11.0.5

- DBMS : MySql

    - 버전정보
    MySql   v8.0.41