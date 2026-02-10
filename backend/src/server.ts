import { env } from "./lib/env";
import { createApp } from "./app";

const app = createApp();

app.listen(Number(env.PORT), () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
