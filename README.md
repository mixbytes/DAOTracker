💎 DAO Tracker
========================

## Add fullnode url into config (blockchainUrl)
 
```
vim src/environments/environment.prod.ts
```

## Build and start

```
docker build -t dao-front .
docker run --rm --name dao-front -p 8080:8080 -d dao-front npm start
```
