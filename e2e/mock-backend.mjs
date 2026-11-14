import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_BACKEND_PORT ?? 4100);

const USERS = {
  "admin@imaf.com": {
    id: 1,
    email: "admin@imaf.com",
    role: "admin",
    token: "e2e-token-admin",
  },
  "estudiante@imaf.com": {
    id: 2,
    email: "estudiante@imaf.com",
    role: "estudiante",
    token: "e2e-token-estudiante",
  },
};

const TOKENS = new Map(Object.values(USERS).map((user) => [user.token, user]));

function responderJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function usuarioPublico(usuario) {
  return { id: usuario.id, email: usuario.email, role: usuario.role };
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const metodo = req.method ?? "GET";

  if (metodo === "GET" && url.pathname === "/health") {
    return responderJson(res, 200, { ok: true });
  }

  if (metodo === "POST" && url.pathname === "/api/login") {
    let crudo = "";
    req.on("data", (chunk) => (crudo += chunk));
    req.on("end", () => {
      let cuerpo = {};
      try {
        cuerpo = JSON.parse(crudo);
      } catch {
        cuerpo = {};
      }
      const usuario = USERS[cuerpo.email];
      if (!usuario || cuerpo.password !== "password123") {
        return responderJson(res, 422, {
          message: "Las credenciales son incorrectas.",
        });
      }
      return responderJson(res, 200, {
        user: usuarioPublico(usuario),
        token: usuario.token,
      });
    });
    return;
  }

  if (metodo === "GET" && url.pathname === "/api/me") {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const usuario = TOKENS.get(token);
    if (!usuario) {
      return responderJson(res, 401, { message: "Unauthenticated." });
    }
    return responderJson(res, 200, usuarioPublico(usuario));
  }

  if (metodo === "POST" && url.pathname === "/api/logout") {
    res.writeHead(204);
    return res.end();
  }

  return responderJson(res, 404, { message: "Not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`mock backend en http://127.0.0.1:${PORT}`);
});
