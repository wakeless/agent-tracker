import * as crypto from "node:crypto";
const createMiddleware = (options, __opts) => {
  const resolvedOptions = {
    type: "request",
    ...__opts || options
  };
  return {
    options: resolvedOptions,
    middleware: (middleware) => {
      return createMiddleware(
        {},
        Object.assign(resolvedOptions, { middleware })
      );
    },
    inputValidator: (inputValidator) => {
      return createMiddleware(
        {},
        Object.assign(resolvedOptions, { inputValidator })
      );
    },
    client: (client) => {
      return createMiddleware(
        {},
        Object.assign(resolvedOptions, { client })
      );
    },
    server: (server) => {
      return createMiddleware(
        {},
        Object.assign(resolvedOptions, { server })
      );
    }
  };
};
function dedupeSerializationAdapters(deduped, serializationAdapters) {
  for (let i = 0, len = serializationAdapters.length; i < len; i++) {
    const current = serializationAdapters[i];
    if (!deduped.has(current)) {
      deduped.add(current);
      if (current.extends) {
        dedupeSerializationAdapters(deduped, current.extends);
      }
    }
  }
}
const createStart = (getOptions) => {
  return {
    getOptions: async () => {
      const options = await getOptions();
      if (options.serializationAdapters) {
        const deduped = /* @__PURE__ */ new Set();
        dedupeSerializationAdapters(
          deduped,
          options.serializationAdapters
        );
        options.serializationAdapters = Array.from(deduped);
      }
      return options;
    },
    createMiddleware
  };
};
function getServerConfig() {
  {
    return {
      auth: {
        enabled: true,
        username: "admin",
        password: generateRandomPassword()
      },
      tls: {
        enabled: false
      },
      port: 3e3,
      host: "localhost",
      basePath: "/"
    };
  }
}
function generateRandomPassword(length = 16) {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}
function parseCredential(credential) {
  const colonIndex = credential.indexOf(":");
  if (colonIndex === -1) {
    return null;
  }
  return {
    username: credential.slice(0, colonIndex),
    password: credential.slice(colonIndex + 1)
  };
}
function validateBasicAuth(authHeader, config) {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }
  const base64Credentials = authHeader.slice("Basic ".length);
  let credentials;
  try {
    credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  } catch {
    return false;
  }
  const parsed = parseCredential(credentials);
  if (!parsed) {
    return false;
  }
  const providedHash = crypto.createHash("sha256").update(`${parsed.username}:${parsed.password}`).digest();
  const expectedHash = crypto.createHash("sha256").update(`${config.username}:${config.password}`).digest();
  return crypto.timingSafeEqual(providedHash, expectedHash);
}
const basicAuthMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next, request }) => {
    const config = getServerConfig();
    if (!config.auth.enabled) {
      return next();
    }
    const authHeader = request.headers.get("authorization");
    if (!validateBasicAuth(authHeader, config.auth)) {
      return new Response("Authentication Required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Agent Tracker"',
          "Content-Type": "text/plain"
        }
      });
    }
    return next();
  }
);
const startInstance = createStart(() => ({
  requestMiddleware: [basicAuthMiddleware]
}));
export {
  startInstance
};
