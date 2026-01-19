import { T as TSS_SERVER_FUNCTION, g as getServerFnById, c as createServerFn } from "../server.js";
const createSsrRpc = (functionId, importer) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    const serverFn = await getServerFnById(functionId);
    return serverFn(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const getSessions = createServerFn({
  method: "GET"
}).handler(createSsrRpc("ad6eeb84811df52eebb1cfc8f7bf200bc622506b4c6ce5cdde66c0dae0c9e6f3"));
const getSession = createServerFn({
  method: "GET"
}).handler(createSsrRpc("3e1f35775f699a8089bc6d510c4b03455b3fd1cba241bad3e4fe50d994fbda49"));
const getTranscript = createServerFn({
  method: "GET"
}).handler(createSsrRpc("cc944ffcc7a5a6aac7c3e979333a83e0bede32cf5f6039b21ebbf4fbbac9ec02"));
export {
  getSession as a,
  getTranscript as b,
  getSessions as g
};
