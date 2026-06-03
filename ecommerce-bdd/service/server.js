// An in-memory e-commerce API so the BDD suite has realistic flows to drive:
// auth, profile, products, cart, checkout, orders, password reset, addresses.
// Plain Node http, no dependencies, no database. Token based sessions: login
// returns a token, and the cart/profile/orders/addresses/checkout routes need
// it as a Bearer token. Exported as createServer() so tests run it in process.
import http from "node:http";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function send(res, status, body) {
  if (body === undefined) {
    res.writeHead(status);
    return res.end();
  }
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        resolve(null);
      }
    });
  });
}

export function createServer() {
  const users = [];
  let nextUserId = 1;
  const tokens = new Map(); // token -> userId
  let tokenSeq = 1;

  const products = [
    { id: 1, name: "Mechanical Keyboard", price: 25 },
    { id: 2, name: "Wireless Mouse", price: 15 },
    { id: 3, name: "27 inch Monitor", price: 200 },
    { id: 4, name: "USB-C Hub", price: 40 },
  ];

  const carts = new Map(); // userId -> Map(productId -> quantity)
  const orders = []; // { id, userId, items, total, status }
  let nextOrderId = 1;
  const addresses = []; // { id, userId, line, city }
  let nextAddressId = 1;

  // Seed one known account for the plain login scenarios.
  users.push({ id: nextUserId++, name: "Demo", email: "demo@example.com", password: "Secret123" });

  function userIdFromAuth(req) {
    const header = req.headers["authorization"] || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;
    return tokens.has(match[1]) ? tokens.get(match[1]) : null;
  }

  function cartFor(userId) {
    if (!carts.has(userId)) carts.set(userId, new Map());
    return carts.get(userId);
  }

  function cartView(userId) {
    const cart = cartFor(userId);
    const items = [];
    let total = 0;
    for (const [productId, quantity] of cart) {
      const product = products.find((p) => p.id === productId);
      const subtotal = product.price * quantity;
      total += subtotal;
      items.push({ productId, name: product.name, price: product.price, quantity, subtotal });
    }
    return { items, total };
  }

  function validCard(card) {
    if (!card) return false;
    return /^\d{16}$/.test(String(card.number || "")) &&
      /^\d{3}$/.test(String(card.cvc || "")) &&
      /^\d{2}\/\d{2}$/.test(String(card.expiry || ""));
  }

  return http.createServer(async (req, res) => {
    const { method } = req;
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;

    // ----- public auth -----

    if (method === "POST" && path === "/register") {
      const body = await readJson(req);
      if (!body) return send(res, 400, { error: "invalid JSON body" });
      if (!body.name) return send(res, 400, { error: "name is required" });
      if (!body.email || !EMAIL.test(body.email)) return send(res, 400, { error: "a valid email is required" });
      if (!body.password) return send(res, 400, { error: "password is required" });
      if (users.some((u) => u.email === body.email)) return send(res, 409, { error: "email already exists" });
      const user = { id: nextUserId++, name: body.name, email: body.email, password: body.password };
      users.push(user);
      return send(res, 201, { id: user.id, name: user.name, email: user.email });
    }

    if (method === "POST" && path === "/login") {
      const body = await readJson(req);
      const user = users.find((u) => u.email === (body && body.email));
      if (!user || user.password !== body.password) {
        return send(res, 401, { error: "invalid username or password" });
      }
      const token = `tok-${tokenSeq++}`;
      tokens.set(token, user.id);
      return send(res, 200, { token, user: { id: user.id, name: user.name, email: user.email } });
    }

    if (method === "POST" && path === "/password-reset") {
      const body = await readJson(req);
      const user = users.find((u) => u.email === (body && body.email));
      if (!user) return send(res, 404, { error: "no account is registered with that email" });
      return send(res, 200, { message: "password reset email sent" });
    }

    // ----- public products -----

    if (method === "GET" && path === "/products") {
      const search = (url.searchParams.get("search") || "").toLowerCase();
      const data = search
        ? products.filter((p) => p.name.toLowerCase().includes(search))
        : products;
      return send(res, 200, { data, count: data.length });
    }

    const productMatch = path.match(/^\/products\/([^/]+)$/);
    if (method === "GET" && productMatch) {
      if (!/^\d+$/.test(productMatch[1])) return send(res, 400, { error: "id must be a number" });
      const product = products.find((p) => p.id === Number(productMatch[1]));
      if (!product) return send(res, 404, { error: "product not found" });
      return send(res, 200, product);
    }

    // ----- everything below needs a token -----

    const userId = userIdFromAuth(req);
    const needsAuth = ["/profile", "/logout", "/cart", "/checkout", "/orders", "/addresses"].some(
      (prefix) => path === prefix || path.startsWith(prefix + "/")
    );
    if (needsAuth && userId === null) return send(res, 401, { error: "unauthorized" });

    if (method === "GET" && path === "/profile") {
      const user = users.find((u) => u.id === userId);
      return send(res, 200, { id: user.id, name: user.name, email: user.email });
    }

    if (method === "POST" && path === "/logout") {
      for (const [token, id] of tokens) if (id === userId) tokens.delete(token);
      return send(res, 200, { redirectTo: "/login" });
    }

    if (method === "POST" && path === "/cart/items") {
      const body = await readJson(req);
      const product = products.find((p) => p.id === Number(body && body.productId));
      if (!product) return send(res, 404, { error: "product not found" });
      const quantity = Number(body.quantity) > 0 ? Number(body.quantity) : 1;
      const cart = cartFor(userId);
      cart.set(product.id, (cart.get(product.id) || 0) + quantity);
      return send(res, 201, cartView(userId));
    }

    if (method === "GET" && path === "/cart") {
      return send(res, 200, cartView(userId));
    }

    const cartItemMatch = path.match(/^\/cart\/items\/([^/]+)$/);
    if (cartItemMatch) {
      const productId = Number(cartItemMatch[1]);
      const cart = cartFor(userId);
      if (!cart.has(productId)) return send(res, 404, { error: "item not in cart" });
      if (method === "PATCH") {
        const body = await readJson(req);
        const quantity = Number(body && body.quantity);
        if (!(quantity > 0)) return send(res, 400, { error: "quantity must be greater than 0" });
        cart.set(productId, quantity);
        return send(res, 200, cartView(userId));
      }
      if (method === "DELETE") {
        cart.delete(productId);
        return send(res, 200, cartView(userId));
      }
    }

    if (method === "POST" && path === "/checkout") {
      const body = await readJson(req);
      const view = cartView(userId);
      if (view.items.length === 0) return send(res, 400, { error: "cart is empty" });
      if (!validCard(body && body.card)) return send(res, 402, { error: "payment rejected" });
      const order = { id: nextOrderId++, userId, items: view.items, total: view.total, status: "paid" };
      orders.push(order);
      cartFor(userId).clear();
      return send(res, 200, { orderId: order.id, status: order.status, total: order.total });
    }

    if (method === "GET" && path === "/orders") {
      const data = orders.filter((o) => o.userId === userId);
      return send(res, 200, { data, count: data.length });
    }

    const orderMatch = path.match(/^\/orders\/([^/]+)$/);
    if (method === "GET" && orderMatch) {
      const order = orders.find((o) => o.id === Number(orderMatch[1]) && o.userId === userId);
      if (!order) return send(res, 404, { error: "order not found" });
      return send(res, 200, order);
    }

    if (method === "POST" && path === "/addresses") {
      const body = await readJson(req);
      if (!body || !body.line || !body.city) return send(res, 400, { error: "line and city are required" });
      const address = { id: nextAddressId++, userId, line: body.line, city: body.city };
      addresses.push(address);
      return send(res, 201, { id: address.id, line: address.line, city: address.city });
    }

    if (method === "GET" && path === "/addresses") {
      const data = addresses
        .filter((a) => a.userId === userId)
        .map((a) => ({ id: a.id, line: a.line, city: a.city }));
      return send(res, 200, { data, count: data.length });
    }

    const addressMatch = path.match(/^\/addresses\/([^/]+)$/);
    if (addressMatch) {
      const id = Number(addressMatch[1]);
      const address = addresses.find((a) => a.id === id && a.userId === userId);
      if (method === "PATCH") {
        if (!address) return send(res, 404, { error: "address not found" });
        const body = await readJson(req);
        if (body && body.line) address.line = body.line;
        if (body && body.city) address.city = body.city;
        return send(res, 200, { id: address.id, line: address.line, city: address.city });
      }
      if (method === "DELETE") {
        if (!address) return send(res, 404, { error: "address not found" });
        addresses.splice(addresses.indexOf(address), 1);
        return send(res, 204);
      }
    }

    return send(res, 404, { error: "not found" });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT || 8080;
  createServer().listen(port, () => console.log(`shop service on ${port}`));
}
