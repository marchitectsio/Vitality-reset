import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { stripeWebhookHandler } from "./billing";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import bcrypt from "bcrypt";

async function seedAdminUser() {
  try {
    const adminEmail = "marti@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = "Marti Shaw";
    
    if (!adminPassword) {
      log("ADMIN_PASSWORD not set, skipping admin user seed");
      return;
    }
    
    const existingUser = await storage.getUserByEmail(adminEmail);
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await storage.createUser({
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
      });
      log(`Admin user created: ${adminEmail}`);
    } else {
      log(`Admin user already exists: ${adminEmail}`);
    }
  } catch (error) {
    log(`Admin seeding skipped or failed: ${error}`);
  }
}

const app = express();

// Stripe webhooks need the raw body, so this must come before express.json()
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await seedAdminUser();
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
