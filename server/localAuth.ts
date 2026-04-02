import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import type { Express } from "express";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "admin@yoosuf.mv";
const ADMIN_ID = "local-admin";

export async function seedAdminUser() {
  const password = process.env.ADMIN_PASSWORD || "Admin@2024";
  const existing = await db.select().from(users).where(eq(users.id, ADMIN_ID));
  if (existing.length === 0) {
    const hashed = await bcrypt.hash(password, 12);
    await db.insert(users).values({
      id: ADMIN_ID,
      email: ADMIN_EMAIL,
      firstName: "Admin",
      isAdmin: true,
      password: hashed,
    });
    console.log(`[auth] Admin user created: ${ADMIN_EMAIL}`);
  } else {
    // Only re-hash if ADMIN_PASSWORD env var is set (i.e. password was intentionally changed)
    if (process.env.ADMIN_PASSWORD) {
      const hashed = await bcrypt.hash(password, 12);
      await db.update(users)
        .set({ password: hashed, isAdmin: true, updatedAt: new Date() })
        .where(eq(users.id, ADMIN_ID));
      console.log(`[auth] Admin password updated from ADMIN_PASSWORD env var`);
    }
  }
}

export function setupLocalAuth(app: Express) {
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
        if (!user || !user.password) return done(null, false, { message: "Invalid email or password" });
        if (!user.isAdmin) return done(null, false, { message: "Not authorized" });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return done(null, false, { message: "Invalid email or password" });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  // Login endpoint
  app.post("/api/admin/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = user;
        return res.json(safeUser);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/admin/logout", (req, res) => {
    req.logout(() => {
      res.json({ ok: true });
    });
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { password: _, ...safeUser } = req.user as any;
    res.json(safeUser);
  });
}

export const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
