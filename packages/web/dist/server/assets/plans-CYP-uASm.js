import { c as createSsrRpc } from "./createSsrRpc-CVg2UDl0.js";
import { c as createServerFn } from "../server.js";
const getPlans = createServerFn({
  method: "GET"
}).handler(createSsrRpc("02f2634e2d29bb66556ea859fdb4dd40c962defee00971c7ad724454be68fb6e"));
const getPlan = createServerFn({
  method: "GET"
}).handler(createSsrRpc("a186dc17780a3a9b52a89fc8d49499e923dd202d120c2f377a43984df1de9bb1"));
export {
  getPlan as a,
  getPlans as g
};
