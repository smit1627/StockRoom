const app=require("./app"),env=require("./config/env");app.listen(env.PORT,"0.0.0.0",()=>console.log(`Inventory API listening on port ${env.PORT}`));
