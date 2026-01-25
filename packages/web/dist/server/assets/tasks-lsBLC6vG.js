import { c as createSsrRpc } from "./createSsrRpc-CVg2UDl0.js";
import { c as createServerFn } from "../server.js";
const getTaskSummaries = createServerFn({
  method: "GET"
}).handler(createSsrRpc("0587b41053374c52926570f3181752716da6ab43b5a3dfecc4784e8d2d07bed2"));
const getTasksForConversation = createServerFn({
  method: "GET"
}).handler(createSsrRpc("86ba43f8fc73ef9aac25b2640582873705569218c018298b70cc130cae503bd0"));
export {
  getTasksForConversation as a,
  getTaskSummaries as g
};
