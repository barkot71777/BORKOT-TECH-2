// server.ts
import "dotenv/config";
import express from "express";
import path2 from "path";
import { fileURLToPath } from "url";
import fs2 from "fs";

// src/server/api.ts
import { Router } from "express";

// src/server/db.ts
import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
var DATA_DIR = path.resolve(process.env.BORKOT_DATA_DIR || path.join(process.cwd(), "data"));
var DB_FILE = path.join(DATA_DIR, "borkot_tech.db.json");
var BACKUP_DIR = path.join(DATA_DIR, "backups");
var MAX_AUTOMATIC_BACKUPS = 10;
var configuredJwtSecret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && (!configuredJwtSecret || configuredJwtSecret.length < 32 || configuredJwtSecret.includes("replace_with_a_long_random_secret"))) {
  throw new Error("A strong JWT_SECRET of at least 32 characters is required in production. Generate a random secret and configure it in the hosting environment.");
}
var JWT_SECRET = configuredJwtSecret || crypto.randomBytes(32).toString("hex");
var DEFAULT_SETTINGS = {
  storeNameEn: "Borkot Tech",
  storeNameBn: "\u09AC\u09B0\u0995\u09A4 \u099F\u09C7\u0995",
  phone: "",
  email: "",
  showroomAddressEn: "",
  showroomAddressBn: "",
  shippingInsideDhaka: 0,
  shippingOutsideDhaka: 0,
  freeShippingThreshold: 0,
  bkashMerchantNumber: "",
  nagadMerchantNumber: "",
  rocketMerchantNumber: "",
  bankDetails: "",
  allowCod: true,
  warrantyPolicyEn: "",
  warrantyPolicyBn: "",
  returnPolicyEn: "",
  returnPolicyBn: "\u09AA\u09A3\u09CD\u09AF \u0997\u09CD\u09B0\u09B9\u09A3\u09C7\u09B0 \u09AA\u09B0 \u09E9 \u09A6\u09BF\u09A8\u09C7\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7 \u0995\u09CB\u09A8\u09CB \u09A4\u09CD\u09B0\u09C1\u099F\u09BF (DOA) \u09A7\u09B0\u09BE \u09AA\u09A1\u09BC\u09B2\u09C7 \u0986\u09B8\u09B2 \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C\u09BF\u0982 \u09B8\u09B9 \u0985\u0995\u09CD\u09B7\u09A4 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09AF\u09BC \u09B0\u09BF\u09AA\u09CD\u09B2\u09C7\u09B8\u09AE\u09C7\u09A8\u09CD\u099F \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964 \u09AB\u09BF\u099C\u09BF\u0995\u09CD\u09AF\u09BE\u09B2 \u09A1\u09CD\u09AF\u09BE\u09AE\u09C7\u099C \u09AC\u09BE \u09AC\u09BE\u09B0\u09CD\u09A8 \u0993\u09AF\u09BC\u09BE\u09B0\u09C7\u09A8\u09CD\u099F\u09BF\u09B0 \u0986\u0993\u09A4\u09BE\u09AD\u09C1\u0995\u09CD\u09A4 \u09A8\u09AF\u09BC\u0964"
};
var INITIAL_CATEGORIES = [
  { id: "cat-desktop", nameEn: "Desktop & Custom PC", nameBn: "\u09A1\u09C7\u09B8\u09CD\u0995\u099F\u09AA \u0993 \u0995\u09BE\u09B8\u09CD\u099F\u09AE \u09AA\u09BF\u09B8\u09BF", slug: "desktop-pc", icon: "Cpu", displayOrder: 1, isActive: true },
  { id: "cat-laptop", nameEn: "Laptops & Ultrabooks", nameBn: "\u09B2\u09CD\u09AF\u09BE\u09AA\u099F\u09AA \u0993 \u09A8\u09CB\u099F\u09AC\u09C1\u0995", slug: "laptops", icon: "Laptop", displayOrder: 2, isActive: true },
  { id: "cat-gpu", nameEn: "Graphics Cards (GPU)", nameBn: "\u0997\u09CD\u09B0\u09BE\u09AB\u09BF\u0995\u09CD\u09B8 \u0995\u09BE\u09B0\u09CD\u09A1", slug: "graphics-cards", icon: "MonitorPlay", displayOrder: 3, isActive: true },
  { id: "cat-cpu-mobo", nameEn: "Processors & Motherboards", nameBn: "\u09AA\u09CD\u09B0\u09B8\u09C7\u09B8\u09B0 \u0993 \u09AE\u09BE\u09A6\u09BE\u09B0\u09AC\u09CB\u09B0\u09CD\u09A1", slug: "cpu-motherboard", icon: "Microchip", displayOrder: 4, isActive: true },
  { id: "cat-ram-storage", nameEn: "RAM & NVMe SSD Storage", nameBn: "\u09B0\u200D\u09CD\u09AF\u09BE\u09AE \u0993 \u098F\u09B8\u098F\u09B8\u09A1\u09BF \u09B8\u09CD\u099F\u09CB\u09B0\u09C7\u099C", slug: "ram-storage", icon: "HardDrive", displayOrder: 5, isActive: true },
  { id: "cat-monitor", nameEn: "Monitors & Displays", nameBn: "\u09AE\u09A8\u09BF\u099F\u09B0 \u0993 \u09A1\u09BF\u09B8\u09AA\u09CD\u09B2\u09C7", slug: "monitors", icon: "Monitor", displayOrder: 6, isActive: true },
  { id: "cat-peripherals", nameEn: "Keyboards, Mice & Audio", nameBn: "\u0995\u09C0\u09AC\u09CB\u09B0\u09CD\u09A1, \u09AE\u09BE\u0989\u09B8 \u0993 \u0985\u09A1\u09BF\u0993", slug: "peripherals", icon: "Headphones", displayOrder: 7, isActive: true },
  { id: "cat-cooling-power", nameEn: "Cases, Power & Cooling", nameBn: "\u0995\u09C7\u09B8\u09BF\u0982, \u09AA\u09BE\u0993\u09AF\u09BC\u09BE\u09B0 \u0993 \u0995\u09C1\u09B2\u09BE\u09B0", slug: "power-cooling", icon: "Fan", displayOrder: 8, isActive: true },
  { id: "cat-gaming-gear", nameEn: "Gaming Chairs & Setup", nameBn: "\u0997\u09C7\u09AE\u09BF\u0982 \u099A\u09C7\u09AF\u09BC\u09BE\u09B0 \u0993 \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u09B8\u09C7\u09B8\u09B0\u09BF\u099C", slug: "gaming-gear", icon: "Gamepad2", displayOrder: 9, isActive: true }
];
var INITIAL_BRANDS = [
  { id: "brand-asus", name: "ASUS ROG", slug: "asus-rog" },
  { id: "brand-msi", name: "MSI Gaming", slug: "msi" },
  { id: "brand-gigabyte", name: "Gigabyte AORUS", slug: "gigabyte" },
  { id: "brand-intel", name: "Intel", slug: "intel" },
  { id: "brand-amd", name: "AMD Ryzen", slug: "amd" },
  { id: "brand-corsair", name: "Corsair", slug: "corsair" },
  { id: "brand-logitech", name: "Logitech G", slug: "logitech-g" },
  { id: "brand-razer", name: "Razer", slug: "razer" },
  { id: "brand-samsung", name: "Samsung", slug: "samsung" }
];
var DatabaseEngine = class {
  constructor() {
    // --- PASSWORD RESET & USER PROFILE ---
    this.passwordResetTokens = /* @__PURE__ */ new Map();
    this.ensureDataDir();
    this.db = this.loadDatabase();
  }
  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }
  loadDatabase() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          // Strict Product Catalog Rule: products only contain admin created items
          products: parsed.products || [],
          categories: parsed.categories || INITIAL_CATEGORIES,
          brands: parsed.brands || INITIAL_BRANDS,
          orders: parsed.orders || [],
          inventoryLogs: parsed.inventoryLogs || [],
          coupons: (parsed.coupons || []).filter((coupon) => coupon.code !== "BORKOT500"),
          reviews: parsed.reviews || [],
          supportMessages: parsed.supportMessages || [],
          settings: {
            ...parsed.settings || DEFAULT_SETTINGS,
            shippingInsideDhaka: parsed.settings?.shippingInsideDhaka === 60 ? 0 : parsed.settings?.shippingInsideDhaka ?? DEFAULT_SETTINGS.shippingInsideDhaka,
            shippingOutsideDhaka: parsed.settings?.shippingOutsideDhaka === 120 ? 0 : parsed.settings?.shippingOutsideDhaka ?? DEFAULT_SETTINGS.shippingOutsideDhaka,
            freeShippingThreshold: parsed.settings?.freeShippingThreshold === 5e4 ? 0 : parsed.settings?.freeShippingThreshold ?? DEFAULT_SETTINGS.freeShippingThreshold,
            phone: parsed.settings?.phone === "+880 1711-000000" ? "" : parsed.settings?.phone ?? DEFAULT_SETTINGS.phone,
            email: parsed.settings?.email === "sales@borkottech.com.bd" ? "" : parsed.settings?.email ?? DEFAULT_SETTINGS.email,
            showroomAddressEn: parsed.settings?.showroomAddressEn === "Shop #804, Level 8, Multiplan Computer City Center, New Elephant Road, Dhaka-1205, Bangladesh" ? "" : parsed.settings?.showroomAddressEn ?? DEFAULT_SETTINGS.showroomAddressEn,
            showroomAddressBn: parsed.settings?.showroomAddressBn === "\u09A6\u09CB\u0995\u09BE\u09A8 #\u09EE\u09E6\u09EA, \u09B2\u09C7\u09AD\u09C7\u09B2 \u09EE, \u09AE\u09BE\u09B2\u09CD\u099F\u09BF\u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u09A8 \u0995\u09AE\u09CD\u09AA\u09BF\u0989\u099F\u09BE\u09B0 \u09B8\u09BF\u099F\u09BF \u09B8\u09C7\u09A8\u09CD\u099F\u09BE\u09B0, \u09A8\u09BF\u0989 \u098F\u09B2\u09BF\u09AB\u09CD\u09AF\u09BE\u09A8\u09CD\u099F \u09B0\u09CB\u09A1, \u09A2\u09BE\u0995\u09BE-\u09E7\u09E8\u09E6\u09EB, \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6" ? "" : parsed.settings?.showroomAddressBn ?? DEFAULT_SETTINGS.showroomAddressBn,
            bkashMerchantNumber: parsed.settings?.bkashMerchantNumber === "01711000000 (Merchant)" ? "" : parsed.settings?.bkashMerchantNumber ?? DEFAULT_SETTINGS.bkashMerchantNumber,
            nagadMerchantNumber: parsed.settings?.nagadMerchantNumber === "01911000000 (Merchant)" ? "" : parsed.settings?.nagadMerchantNumber ?? DEFAULT_SETTINGS.nagadMerchantNumber,
            rocketMerchantNumber: parsed.settings?.rocketMerchantNumber === "01811000000-8" ? "" : parsed.settings?.rocketMerchantNumber ?? DEFAULT_SETTINGS.rocketMerchantNumber,
            bankDetails: parsed.settings?.bankDetails === "City Bank Ltd, Account: Borkot Tech BD, A/C: 1102938475001, Elephant Road Branch" ? "" : parsed.settings?.bankDetails ?? DEFAULT_SETTINGS.bankDetails,
            warrantyPolicyEn: parsed.settings?.warrantyPolicyEn?.startsWith("All products purchased from Borkot Tech carry official manufacturer") ? "" : parsed.settings?.warrantyPolicyEn ?? DEFAULT_SETTINGS.warrantyPolicyEn,
            warrantyPolicyBn: parsed.settings?.warrantyPolicyBn?.startsWith("\u09AC\u09B0\u0995\u09A4 \u099F\u09C7\u0995 \u09A5\u09C7\u0995\u09C7 \u0995\u09CD\u09B0\u09AF\u09BC\u0995\u09C3\u09A4 \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u09AA\u09A3\u09CD\u09AF\u09C7") ? "" : parsed.settings?.warrantyPolicyBn ?? DEFAULT_SETTINGS.warrantyPolicyBn,
            returnPolicyEn: parsed.settings?.returnPolicyEn?.startsWith("Hardware components can be replaced within 3 days") ? "" : parsed.settings?.returnPolicyEn ?? DEFAULT_SETTINGS.returnPolicyEn,
            returnPolicyBn: parsed.settings?.returnPolicyBn?.startsWith("\u09AA\u09A3\u09CD\u09AF \u0997\u09CD\u09B0\u09B9\u09A3\u09C7\u09B0 \u09AA\u09B0 \u09E9 \u09A6\u09BF\u09A8\u09C7\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7") ? "" : parsed.settings?.returnPolicyBn ?? DEFAULT_SETTINGS.returnPolicyBn
          }
        };
      } catch (err) {
        const quarantinePath = `${DB_FILE}.unreadable-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`;
        try {
          fs.copyFileSync(DB_FILE, quarantinePath);
        } catch (copyErr) {
          console.error("Could not preserve unreadable database file:", copyErr);
        }
        console.error(`Database file could not be read. Original preserved at ${quarantinePath}. Startup stopped to prevent data loss.`, err);
        throw new Error(`Existing database is unreadable; refusing to initialize an empty database. Check ${DB_FILE} and restore a verified backup.`);
      }
    }
    const freshDb = {
      users: [],
      products: [],
      categories: INITIAL_CATEGORIES,
      brands: INITIAL_BRANDS,
      orders: [],
      inventoryLogs: [],
      coupons: [],
      reviews: [],
      supportMessages: [],
      settings: DEFAULT_SETTINGS
    };
    this.persist(freshDb);
    return freshDb;
  }
  persist(dataToSave) {
    this.ensureDataDir();
    const target = dataToSave || this.db;
    const json = JSON.stringify(target, null, 2);
    const tempFile = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
    try {
      if (fs.existsSync(DB_FILE)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        const backupFile = path.join(BACKUP_DIR, `borkot_tech.db.${stamp}.json`);
        fs.copyFileSync(DB_FILE, backupFile);
        const backups = fs.readdirSync(BACKUP_DIR).filter((name) => /^borkot_tech\.db\..+\.json$/.test(name)).sort();
        while (backups.length > MAX_AUTOMATIC_BACKUPS) {
          const oldest = backups.shift();
          if (oldest) fs.unlinkSync(path.join(BACKUP_DIR, oldest));
        }
      }
      fs.writeFileSync(tempFile, json, { encoding: "utf-8", flag: "wx" });
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {
      }
      console.error("Critical: Failed to persist database. The current database was not intentionally reset:", err);
      throw err;
    }
  }
  // --- CRYPTO & AUTH HELPERS ---
  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1e4, 64, "sha512").toString("hex");
    return { hash, salt };
  }
  verifyPassword(password, hash, salt) {
    const testHash = crypto.pbkdf2Sync(password, salt, 1e4, 64, "sha512").toString("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
    } catch {
      return false;
    }
  }
  generateToken(user) {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1e3
        // 7 days
      })
    ).toString("base64url");
    const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
    return `${header}.${payload}.${signature}`;
  }
  verifyToken(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;
      const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
      }
      const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
      if (decoded.exp && decoded.exp < Date.now()) {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }
  // --- ADMIN INITIAL SETUP CHECK ---
  hasSuperAdmin() {
    return this.db.users.some((u) => u.role === "super_admin");
  }
  createSuperAdmin(data) {
    if (this.hasSuperAdmin()) {
      throw new Error("A Super Admin already exists for Borkot Tech.");
    }
    const { hash, salt } = this.hashPassword(data.password);
    const user = {
      id: `admin-${Date.now()}`,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      role: "super_admin",
      addresses: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      passwordHash: hash,
      salt
    };
    this.db.users.push(user);
    this.persist();
    const { passwordHash, salt: _, ...safeUser } = user;
    return safeUser;
  }
  // --- USER AUTHENTICATION & PROFILE ---
  registerCustomer(data) {
    const existing = this.db.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase().trim());
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }
    const { hash, salt } = this.hashPassword(data.password);
    const user = {
      id: `cust-${Date.now()}`,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      role: "customer",
      addresses: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      passwordHash: hash,
      salt
    };
    this.db.users.push(user);
    this.persist();
    const { passwordHash, salt: _, ...safeUser } = user;
    return safeUser;
  }
  authenticateUser(email, password) {
    const user = this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      throw new Error("Invalid email address or password.");
    }
    const isValid = this.verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      throw new Error("Invalid email address or password.");
    }
    const { passwordHash, salt, ...safeUser } = user;
    const token = this.generateToken(safeUser);
    return { user: safeUser, token };
  }
  getUserById(id) {
    const user = this.db.users.find((u) => u.id === id);
    if (!user) return null;
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }
  updateUserAddresses(userId, addresses) {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found.");
    user.addresses = addresses;
    this.persist();
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }
  getAllStaff() {
    return this.db.users.filter((u) => u.role !== "customer").map(({ passwordHash, salt, ...safeUser }) => safeUser);
  }
  createStaffMember(data) {
    const existing = this.db.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase().trim());
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }
    const { hash, salt } = this.hashPassword(data.password);
    const staffUser = {
      id: `staff-${Date.now()}`,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      role: data.role,
      addresses: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      passwordHash: hash,
      salt
    };
    this.db.users.push(staffUser);
    this.persist();
    const { passwordHash, salt: _, ...safeUser } = staffUser;
    return safeUser;
  }
  // --- PRODUCTS (STRICT CATALOG RULE COMPLIANCE) ---
  getProducts(params) {
    let list = this.db.products;
    if (!params?.includeArchived) {
      list = list.filter((p) => !p.isArchived);
    }
    if (params?.categorySlug) {
      const cat = this.db.categories.find((c) => c.slug === params.categorySlug || c.id === params.categorySlug);
      if (cat) {
        list = list.filter((p) => p.categoryId === cat.id);
      }
    }
    if (params?.brandSlug) {
      const brand = this.db.brands.find((b) => b.slug === params.brandSlug || b.id === params.brandSlug);
      if (brand) {
        list = list.filter((p) => p.brandId === brand.id);
      }
    }
    if (params?.inStockOnly) {
      list = list.filter((p) => p.stockQuantity > 0);
    }
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (p) => p.nameEn.toLowerCase().includes(q) || p.nameBn.includes(q) || p.sku.toLowerCase().includes(q) || p.specifications.some((s) => s.value.toLowerCase().includes(q) || s.key.toLowerCase().includes(q))
      );
    }
    if (params?.sort === "price_low") {
      list = [...list].sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (params?.sort === "price_high") {
      list = [...list].sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }
  getProductById(id) {
    return this.db.products.find((p) => p.id === id || p.slug === id) || null;
  }
  createProduct(data, adminUser) {
    const existingSku = this.db.products.find((p) => p.sku.toUpperCase() === data.sku.toUpperCase());
    if (existingSku) {
      throw new Error(`A product with SKU "${data.sku}" already exists.`);
    }
    const newProduct = {
      ...data,
      id: `prod-${Date.now()}`,
      sku: data.sku.toUpperCase().trim(),
      slug: data.slug || data.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.db.products.push(newProduct);
    if (newProduct.stockQuantity > 0) {
      this.logInventoryMovement({
        productId: newProduct.id,
        productSku: newProduct.sku,
        productName: newProduct.nameEn,
        adminId: adminUser.id,
        adminName: adminUser.name,
        changeType: "stock_in",
        quantityChange: newProduct.stockQuantity,
        stockBefore: 0,
        stockAfter: newProduct.stockQuantity,
        reason: "Initial stock intake on product creation"
      });
    }
    this.persist();
    return newProduct;
  }
  updateProduct(id, data, adminUser) {
    const index = this.db.products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Product not found.");
    const current = this.db.products[index];
    if (data.sku && data.sku.toUpperCase() !== current.sku.toUpperCase()) {
      const existingSku = this.db.products.find((p) => p.id !== id && p.sku.toUpperCase() === data.sku.toUpperCase());
      if (existingSku) {
        throw new Error(`A product with SKU "${data.sku}" already exists.`);
      }
    }
    if (typeof data.stockQuantity === "number" && data.stockQuantity !== current.stockQuantity) {
      const diff = data.stockQuantity - current.stockQuantity;
      this.logInventoryMovement({
        productId: current.id,
        productSku: current.sku,
        productName: current.nameEn,
        adminId: adminUser.id,
        adminName: adminUser.name,
        changeType: "manual_adjustment",
        quantityChange: diff,
        stockBefore: current.stockQuantity,
        stockAfter: data.stockQuantity,
        reason: "Admin updated product stock count"
      });
    }
    const updated = {
      ...current,
      ...data,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.db.products[index] = updated;
    this.persist();
    return updated;
  }
  deleteProduct(id) {
    const index = this.db.products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.db.products.splice(index, 1);
    this.persist();
    return true;
  }
  // --- INVENTORY MANAGEMENT & AUDIT LOGS ---
  adjustStock(productId, changeType, quantityChange, reason, adminUser) {
    const product = this.db.products.find((p) => p.id === productId);
    if (!product) throw new Error("Product not found.");
    const stockBefore = product.stockQuantity;
    let stockAfter = stockBefore;
    if (changeType === "stock_in") {
      stockAfter += Math.abs(quantityChange);
    } else if (changeType === "stock_out") {
      stockAfter -= Math.abs(quantityChange);
    } else {
      stockAfter = stockBefore + quantityChange;
    }
    if (stockAfter < 0) {
      throw new Error(`Stock adjustment would result in negative inventory (${stockAfter}). Minimum allowed is 0.`);
    }
    product.stockQuantity = stockAfter;
    product.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const log = this.logInventoryMovement({
      productId: product.id,
      productSku: product.sku,
      productName: product.nameEn,
      adminId: adminUser.id,
      adminName: adminUser.name,
      changeType,
      quantityChange,
      stockBefore,
      stockAfter,
      reason
    });
    this.persist();
    return { product, log };
  }
  logInventoryMovement(data) {
    const log = {
      ...data,
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.db.inventoryLogs.unshift(log);
    return log;
  }
  getInventoryLogs(limit = 100) {
    return this.db.inventoryLogs.slice(0, limit);
  }
  // --- CATEGORIES & BRANDS ---
  getCategories() {
    return this.db.categories.filter((c) => c.isActive);
  }
  getAllCategoriesAdmin() {
    return this.db.categories;
  }
  createCategory(data) {
    const cat = {
      ...data,
      id: `cat-${Date.now()}`
    };
    this.db.categories.push(cat);
    this.persist();
    return cat;
  }
  updateCategory(id, data) {
    const index = this.db.categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Category not found");
    this.db.categories[index] = { ...this.db.categories[index], ...data };
    this.persist();
    return this.db.categories[index];
  }
  getBrands() {
    return this.db.brands;
  }
  createBrand(data) {
    const brand = {
      ...data,
      id: `brand-${Date.now()}`
    };
    this.db.brands.push(brand);
    this.persist();
    return brand;
  }
  // --- COUPONS ---
  getCoupon(code) {
    const c = this.db.coupons.find((cp) => cp.code.toUpperCase() === code.toUpperCase().trim() && cp.isActive);
    if (!c) return null;
    if (new Date(c.expiryDate).getTime() < Date.now()) return null;
    return c;
  }
  getAllCoupons() {
    return this.db.coupons;
  }
  createCoupon(data) {
    const coupon = {
      ...data,
      id: `coup-${Date.now()}`,
      code: data.code.toUpperCase().trim(),
      usageCount: 0
    };
    this.db.coupons.push(coupon);
    this.persist();
    return coupon;
  }
  // --- ORDER CHECKOUT (SAFE CONCURRENCY & STOCK RESERVATION) ---
  checkoutOrder(orderData) {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error("Shopping cart cannot be empty.");
    }
    const orderItems = [];
    let subtotal = 0;
    for (const item of orderData.items) {
      const product = this.db.products.find((p) => p.id === item.productId && !p.isArchived);
      if (!product) {
        throw new Error(`Product with ID "${item.productId}" is not available in store.`);
      }
      if (product.stockQuantity < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.nameEn}". Requested: ${item.quantity}, Available: ${product.stockQuantity}`
        );
      }
      const itemTotal = product.sellingPrice * item.quantity;
      subtotal += itemTotal;
      orderItems.push({
        productId: product.id,
        sku: product.sku,
        nameEn: product.nameEn,
        nameBn: product.nameBn,
        price: product.sellingPrice,
        quantity: item.quantity,
        image: product.images[0] || ""
      });
    }
    let discount = 0;
    if (orderData.couponCode) {
      const coupon = this.getCoupon(orderData.couponCode);
      if (coupon && subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === "percentage") {
          discount = Math.round(subtotal * coupon.discountValue / 100);
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }
        coupon.usageCount += 1;
      }
    }
    let deliveryCharge = this.db.settings.shippingOutsideDhaka;
    if (orderData.deliveryMethod === "inside_dhaka" || orderData.deliveryAddress.division.toLowerCase() === "dhaka") {
      deliveryCharge = this.db.settings.shippingInsideDhaka;
    }
    if (orderData.deliveryMethod === "express") {
      deliveryCharge = this.db.settings.shippingInsideDhaka;
    }
    if (this.db.settings.freeShippingThreshold > 0 && subtotal >= this.db.settings.freeShippingThreshold) {
      deliveryCharge = 0;
    }
    const totalAmount = Math.max(0, subtotal - discount + deliveryCharge);
    const orderNumber = `BT-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const newOrderId = `order-${Date.now()}`;
    for (const item of orderData.items) {
      const product = this.db.products.find((p) => p.id === item.productId);
      const stockBefore = product.stockQuantity;
      product.stockQuantity -= item.quantity;
      product.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.logInventoryMovement({
        productId: product.id,
        productSku: product.sku,
        productName: product.nameEn,
        adminId: orderData.customerId || "system",
        adminName: orderData.customerName,
        changeType: "order_reserve",
        quantityChange: -item.quantity,
        stockBefore,
        stockAfter: product.stockQuantity,
        reason: `Reserved for customer order ${orderNumber}`,
        orderId: newOrderId
      });
    }
    const newOrder = {
      id: newOrderId,
      orderNumber,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      deliveryAddress: orderData.deliveryAddress,
      items: orderItems,
      subtotal,
      discount,
      deliveryCharge,
      totalAmount,
      couponCode: orderData.couponCode,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentMethod === "cod" ? "pending" : orderData.paymentDetails?.transactionId ? "pending" : "pending",
      paymentDetails: orderData.paymentDetails,
      orderStatus: "pending",
      notes: orderData.notes,
      auditLog: [
        {
          status: "pending",
          updatedBy: "Customer",
          note: `Order placed via website. Payment: ${orderData.paymentMethod.toUpperCase()}`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.db.orders.unshift(newOrder);
    this.persist();
    return newOrder;
  }
  // --- ORDER MANAGEMENT ---
  getOrders(params) {
    let list = this.db.orders;
    if (params?.customerId) {
      list = list.filter((o) => o.customerId === params.customerId);
    }
    if (params?.status) {
      list = list.filter((o) => o.orderStatus === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (o) => o.orderNumber.toLowerCase().includes(q) || o.customerPhone.includes(q) || o.customerName.toLowerCase().includes(q)
      );
    }
    return list;
  }
  getOrderById(idOrNumber) {
    return this.db.orders.find((o) => o.id === idOrNumber || o.orderNumber === idOrNumber) || null;
  }
  updateOrderStatus(orderId, newStatus, adminUser, note, trackingNumber, courierName) {
    const order = this.db.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");
    const previousStatus = order.orderStatus;
    if (previousStatus === newStatus) return order;
    if (newStatus === "cancelled" && previousStatus !== "cancelled") {
      for (const item of order.items) {
        const product = this.db.products.find((p) => p.id === item.productId);
        if (product) {
          const stockBefore = product.stockQuantity;
          product.stockQuantity += item.quantity;
          product.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          this.logInventoryMovement({
            productId: product.id,
            productSku: product.sku,
            productName: product.nameEn,
            adminId: adminUser.id,
            adminName: adminUser.name,
            changeType: "order_cancel_return",
            quantityChange: item.quantity,
            stockBefore,
            stockAfter: product.stockQuantity,
            reason: `Restored stock from cancelled order ${order.orderNumber}`
          });
        }
      }
    }
    order.orderStatus = newStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courierName) order.courierName = courierName;
    order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    order.auditLog.push({
      status: newStatus,
      updatedBy: adminUser.name,
      note: note || `Order status updated to ${newStatus}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.persist();
    return order;
  }
  updatePaymentStatus(orderId, paymentStatus, adminUser) {
    const order = this.db.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");
    order.paymentStatus = paymentStatus;
    order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    order.auditLog.push({
      status: order.orderStatus,
      updatedBy: adminUser.name,
      note: `Payment status updated to ${paymentStatus.toUpperCase()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.persist();
    return order;
  }
  // --- REVIEWS & SUPPORT ---
  addReview(data) {
    const review = {
      ...data,
      id: `rev-${Date.now()}`,
      status: "pending",
      // Requires admin moderation
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.db.reviews.push(review);
    this.persist();
    return review;
  }
  getProductReviews(productId) {
    return this.db.reviews.filter((r) => r.productId === productId && r.status === "approved");
  }
  getAllReviewsAdmin() {
    return this.db.reviews;
  }
  updateReviewStatus(reviewId, status) {
    const review = this.db.reviews.find((r) => r.id === reviewId);
    if (!review) throw new Error("Review not found");
    review.status = status;
    this.persist();
    return review;
  }
  addSupportMessage(data) {
    const msg = {
      ...data,
      id: `msg-${Date.now()}`,
      status: "unread",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.db.supportMessages.push(msg);
    this.persist();
    return msg;
  }
  getSupportMessages() {
    return this.db.supportMessages;
  }
  replySupportMessage(id, replyText) {
    const msg = this.db.supportMessages.find((m) => m.id === id);
    if (!msg) throw new Error("Support message not found");
    msg.status = "replied";
    msg.replyText = replyText;
    this.persist();
    return msg;
  }
  createPasswordResetToken(email) {
    const user = this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) return null;
    const token = crypto.randomBytes(32).toString("hex");
    this.passwordResetTokens.set(token, {
      userId: user.id,
      expires: Date.now() + 1e3 * 60 * 30
      // 30 minutes
    });
    return token;
  }
  resetPasswordWithToken(token, newPassword) {
    const entry = this.passwordResetTokens.get(token);
    if (!entry || entry.expires < Date.now()) {
      return false;
    }
    const user = this.db.users.find((u) => u.id === entry.userId);
    if (!user) return false;
    const { hash, salt } = this.hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    this.passwordResetTokens.delete(token);
    this.persist();
    return true;
  }
  changeUserPassword(userId, oldPassword, newPassword) {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    if (!this.verifyPassword(oldPassword, user.passwordHash, user.salt)) {
      throw new Error("Current password is incorrect");
    }
    const { hash, salt } = this.hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    this.persist();
    return true;
  }
  updateUserProfile(userId, data) {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    if (data.name) user.name = data.name.trim();
    if (data.phone) user.phone = data.phone.trim();
    this.persist();
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }
  toggleProductArchive(id) {
    const product = this.db.products.find((p) => p.id === id);
    if (!product) throw new Error("Product not found");
    product.isArchived = !product.isArchived;
    product.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.persist();
    return product;
  }
  deleteCategory(id) {
    const idx = this.db.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.db.categories.splice(idx, 1);
    this.persist();
    return true;
  }
  deleteBrand(id) {
    const idx = this.db.brands.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this.db.brands.splice(idx, 1);
    this.persist();
    return true;
  }
  deleteCoupon(id) {
    const idx = this.db.coupons.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.db.coupons.splice(idx, 1);
    this.persist();
    return true;
  }
  toggleCouponStatus(id) {
    const coupon = this.db.coupons.find((c) => c.id === id);
    if (!coupon) throw new Error("Coupon not found");
    coupon.isActive = !coupon.isActive;
    this.persist();
    return coupon;
  }
  // --- STORE SETTINGS ---
  getSettings() {
    return this.db.settings;
  }
  updateSettings(settings) {
    this.db.settings = { ...this.db.settings, ...settings };
    this.persist();
    return this.db.settings;
  }
  // --- DIAGNOSTICS & DASHBOARD METRICS ---
  getDashboardMetrics() {
    const products = this.db.products;
    const orders = this.db.orders;
    const users = this.db.users;
    const totalSales = orders.filter((o) => o.orderStatus !== "cancelled").reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrders = orders.filter((o) => o.orderStatus === "pending").length;
    const processingOrders = orders.filter((o) => o.orderStatus === "processing" || o.orderStatus === "confirmed").length;
    const lowStockCount = products.filter((p) => !p.isArchived && p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length;
    const outOfStockCount = products.filter((p) => !p.isArchived && p.stockQuantity === 0).length;
    return {
      totalProducts: products.length,
      activeProducts: products.filter((p) => !p.isArchived).length,
      lowStockCount,
      outOfStockCount,
      totalOrders: orders.length,
      pendingOrders,
      processingOrders,
      totalSales,
      totalCustomers: users.filter((u) => u.role === "customer").length,
      recentOrders: orders.slice(0, 10),
      recentLogs: this.db.inventoryLogs.slice(0, 10)
    };
  }
  getRawDatabaseBackup() {
    return { ...this.db };
  }
};
var db = new DatabaseEngine();

// src/utils/sanitizeHtml.ts
import DOMPurify from "dompurify";
function serverSanitize(html) {
  let clean = html;
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  clean = clean.replace(/<\/?(iframe|object|embed|applet|form|input|button|textarea|meta|link|base)\b[^>]*>/gi, "");
  clean = clean.replace(/\s+on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");
  clean = clean.replace(/href\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, 'href="#"');
  clean = clean.replace(/href\s*=\s*(?:'vbscript:[^']*'|"vbscript:[^"]*"|vbscript:[^\s>]+)/gi, 'href="#"');
  clean = clean.replace(/href\s*=\s*(?:'data:[^']*'|"data:[^"]*"|data:[^\s>]+)/gi, 'href="#"');
  return clean;
}
function sanitizeHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== "string") {
    return "";
  }
  if (typeof window !== "undefined" && typeof DOMPurify?.sanitize === "function") {
    try {
      const sanitized = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "p",
          "br",
          "hr",
          "strong",
          "b",
          "em",
          "i",
          "u",
          "s",
          "strike",
          "ul",
          "ol",
          "li",
          "blockquote",
          "pre",
          "code",
          "a",
          "span",
          "div",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td"
        ],
        ALLOWED_ATTR: ["href", "target", "rel", "class", "title"],
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "style"]
      });
      if (typeof document !== "undefined") {
        const doc = new DOMParser().parseFromString(sanitized, "text/html");
        const links = doc.querySelectorAll("a");
        links.forEach((link) => {
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer nofollow");
        });
        return doc.body.innerHTML;
      }
      return sanitized;
    } catch {
      return serverSanitize(rawHtml);
    }
  }
  return serverSanitize(rawHtml);
}

// src/server/api.ts
var apiRouter = Router();
var authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return next();
  }
  const decoded = db.verifyToken(token);
  if (decoded) {
    const user = db.getUserById(decoded.id);
    if (user) {
      req.user = user;
    }
  }
  next();
};
apiRouter.use(authenticateToken);
var requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};
var requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role === "customer") {
    return res.status(403).json({ error: "Access denied: Administrative privileges required" });
  }
  next();
};
var requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user.role === "super_admin" || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: "Access denied: Insufficient permissions for this action" });
  };
};
apiRouter.get("/admin/setup-status", (req, res) => {
  const hasSuperAdmin = db.hasSuperAdmin();
  res.json({ setupRequired: !hasSuperAdmin });
});
apiRouter.post("/admin/setup", (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ error: "Name, valid email, and a password of at least 8 characters are required." });
    }
    const admin = db.createSuperAdmin({ name, email, phone: phone || "", password });
    const token = db.generateToken(admin);
    res.status(201).json({ user: admin, token, message: "Super Admin account initialized successfully." });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to setup admin account" });
  }
});
apiRouter.post("/auth/register", (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password || password.length < 6) {
      return res.status(400).json({ error: "Please provide full name, email, phone number, and a password (min 6 chars)." });
    }
    const user = db.registerCustomer({ name, email, phone, password });
    const token = db.generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json({ error: err.message || "Registration failed" });
  }
});
var loginAttempts = /* @__PURE__ */ new Map();
var MAX_ATTEMPTS = 5;
var WINDOW_MS = 5 * 60 * 1e3;
var checkLoginRateLimit = (key) => {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || record.resetTime < now) {
    loginAttempts.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }
  record.count += 1;
  return true;
};
var clearLoginAttempts = (key) => {
  loginAttempts.delete(key);
};
apiRouter.post("/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const clientIp = req.ip || req.socket.remoteAddress || "client";
    const rateLimitKey = `${clientIp}_${email.toLowerCase().trim()}`;
    if (!checkLoginRateLimit(rateLimitKey)) {
      return res.status(429).json({ error: "Too many failed login attempts. Please wait 5 minutes before retrying." });
    }
    const { user, token } = db.authenticateUser(email, password);
    clearLoginAttempts(rateLimitKey);
    res.json({ user, token });
  } catch (err) {
    res.status(401).json({ error: err.message || "Invalid credentials" });
  }
});
apiRouter.post("/auth/forgot-password", (req, res) => {
  const { email } = req.body || {};
  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }
  return res.status(503).json({
    error: "Password reset is temporarily unavailable because secure email delivery has not been configured. Please contact the store administrator."
  });
});
apiRouter.post("/auth/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Valid token and new password (min 6 characters) required" });
  }
  const success = db.resetPasswordWithToken(token, newPassword);
  if (!success) {
    return res.status(400).json({ error: "Invalid or expired password reset token" });
  }
  res.json({ message: "Password reset successfully. You can now sign in." });
});
apiRouter.put("/auth/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Current password and new password (min 6 characters) required" });
  }
  try {
    db.changeUserPassword(req.user.id, currentPassword, newPassword);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.put("/auth/profile", requireAuth, (req, res) => {
  const { name, phone } = req.body;
  try {
    const updated = db.updateUserProfile(req.user.id, { name, phone });
    res.json({ user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
apiRouter.put("/auth/addresses", requireAuth, (req, res) => {
  try {
    const { addresses } = req.body;
    if (!Array.isArray(addresses)) {
      return res.status(400).json({ error: "Addresses must be an array" });
    }
    const updated = db.updateUserAddresses(req.user.id, addresses);
    res.json({ user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.get("/products", (req, res) => {
  try {
    const { category, brand, search, inStock, sort } = req.query;
    const products = db.getProducts({
      categorySlug: category,
      brandSlug: brand,
      search,
      inStockOnly: inStock === "true",
      sort,
      includeArchived: false
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
apiRouter.get("/products/:id", (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product || product.isArchived) {
    return res.status(404).json({ error: "Product not found" });
  }
  const reviews = db.getProductReviews(product.id);
  res.json({ product, reviews });
});
apiRouter.get("/categories", (req, res) => {
  res.json(db.getCategories());
});
apiRouter.get("/brands", (req, res) => {
  res.json(db.getBrands());
});
apiRouter.post("/coupons/validate", (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Coupon code required" });
  }
  const coupon = db.getCoupon(code);
  if (!coupon) {
    return res.status(404).json({ valid: false, error: "Invalid or expired coupon code" });
  }
  if (subtotal && subtotal < coupon.minOrderAmount) {
    return res.status(400).json({
      valid: false,
      error: `Minimum order value for this coupon is \u09F3 ${coupon.minOrderAmount}`
    });
  }
  let discount = coupon.discountValue;
  if (coupon.discountType === "percentage" && subtotal) {
    discount = Math.round(subtotal * coupon.discountValue / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  }
  res.json({ valid: true, coupon, discount });
});
apiRouter.get("/settings", (req, res) => {
  res.json(db.getSettings());
});
apiRouter.post("/orders/checkout", (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      items,
      couponCode,
      deliveryMethod,
      paymentMethod,
      paymentDetails,
      notes
    } = req.body;
    if (!customerName || !customerPhone || !deliveryAddress || !items || !paymentMethod) {
      return res.status(400).json({ error: "Missing required order fields." });
    }
    const order = db.checkoutOrder({
      customerId: req.user?.id,
      customerName,
      customerEmail: customerEmail || req.user?.email || "",
      customerPhone,
      deliveryAddress,
      items,
      couponCode,
      deliveryMethod: deliveryMethod || "inside_dhaka",
      paymentMethod,
      paymentDetails,
      notes
    });
    res.status(201).json({ order, message: "Order placed successfully." });
  } catch (err) {
    res.status(400).json({ error: err.message || "Checkout failed" });
  }
});
apiRouter.get("/orders/track", (req, res) => {
  const { orderNumber, phone } = req.query;
  if (!orderNumber || !phone) {
    return res.status(400).json({ error: "Both order number and phone number are required for verification." });
  }
  const order = db.getOrderById(orderNumber);
  if (!order || order.customerPhone.replace(/[\s\-]/g, "") !== phone.replace(/[\s\-]/g, "")) {
    return res.status(404).json({ error: "No order matched with the provided details." });
  }
  res.json({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    items: order.items,
    totalAmount: order.totalAmount,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    deliveryAddress: order.deliveryAddress,
    auditLog: order.auditLog,
    createdAt: order.createdAt
  });
});
apiRouter.get("/customer/orders", requireAuth, (req, res) => {
  const orders = db.getOrders({ customerId: req.user.id });
  res.json(orders);
});
apiRouter.post("/customer/orders/:id/cancel", requireAuth, (req, res) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.customerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied: You can only cancel your own orders." });
    }
    if (order.orderStatus !== "pending" && order.orderStatus !== "confirmed") {
      return res.status(400).json({ error: "Orders can only be cancelled before they enter processing/dispatch." });
    }
    const { reason } = req.body;
    const updated = db.updateOrderStatus(order.id, "cancelled", req.user, reason || "Cancelled by customer");
    res.json({ order: updated, message: "Order has been cancelled." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.post("/support", (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }
    const msg = db.addSupportMessage({ name, email, phone: phone || "", subject: subject || "General Enquiry", message });
    res.status(201).json({ message: "Support message received. We will contact you soon.", id: msg.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to record enquiry" });
  }
});
apiRouter.post("/reviews", requireAuth, (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating || !comment) {
      return res.status(400).json({ error: "Product ID, rating (1-5), and review text required." });
    }
    const review = db.addReview({
      productId,
      customerId: req.user.id,
      customerName: req.user.name,
      rating: Number(rating),
      comment
    });
    res.status(201).json({ message: "Review submitted for moderation.", review });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.get("/admin/dashboard", requireAdmin, (req, res) => {
  res.json(db.getDashboardMetrics());
});
apiRouter.get("/admin/products", requireAdmin, (req, res) => {
  const products = db.getProducts({ includeArchived: true });
  res.json(products);
});
apiRouter.post(
  "/admin/products",
  requireRole("super_admin", "product_manager"),
  (req, res) => {
    try {
      const {
        sku,
        nameEn,
        nameBn,
        slug,
        categoryId,
        brandId,
        costPrice,
        sellingPrice,
        originalPrice,
        stockQuantity,
        lowStockThreshold,
        warranty,
        returnPolicy,
        descriptionEn,
        descriptionBn,
        specifications,
        images,
        isFeatured
      } = req.body;
      if (!sku || !nameEn || !nameBn || !categoryId || !brandId || typeof sellingPrice !== "number") {
        return res.status(400).json({ error: "Please provide SKU, English & Bengali names, Category, Brand, and Selling Price." });
      }
      const product = db.createProduct(
        {
          sku,
          nameEn,
          nameBn,
          slug: slug || "",
          categoryId,
          brandId,
          costPrice: Number(costPrice) || 0,
          sellingPrice: Number(sellingPrice),
          originalPrice: originalPrice ? Number(originalPrice) : void 0,
          stockQuantity: Number(stockQuantity) || 0,
          lowStockThreshold: Number(lowStockThreshold) || 3,
          isArchived: false,
          isFeatured: Boolean(isFeatured),
          warranty: warranty || "",
          returnPolicy: returnPolicy || "",
          descriptionEn: sanitizeHtml(descriptionEn || descriptionBn || ""),
          descriptionBn: sanitizeHtml(descriptionBn || descriptionEn || ""),
          specifications: Array.isArray(specifications) ? specifications : [],
          images: Array.isArray(images) && images.length > 0 ? images : []
        },
        req.user
      );
      res.status(201).json({ product, message: "Product successfully added to catalog." });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
apiRouter.put(
  "/admin/products/:id",
  requireRole("super_admin", "product_manager"),
  (req, res) => {
    try {
      const updateData = { ...req.body };
      if (typeof updateData.descriptionEn === "string") {
        updateData.descriptionEn = sanitizeHtml(updateData.descriptionEn);
      }
      if (typeof updateData.descriptionBn === "string") {
        updateData.descriptionBn = sanitizeHtml(updateData.descriptionBn);
      }
      const updated = db.updateProduct(req.params.id, updateData, req.user);
      res.json({ product: updated, message: "Product updated." });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
apiRouter.delete(
  "/admin/products/:id",
  requireRole("super_admin"),
  (req, res) => {
    try {
      const deleted = db.deleteProduct(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Product not found" });
      res.json({ message: "Product deleted successfully." });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
apiRouter.put(
  "/admin/products/:id/archive",
  requireRole("super_admin", "product_manager"),
  (req, res) => {
    try {
      const product = db.toggleProductArchive(req.params.id);
      res.json({ product, message: `Product is now ${product.isArchived ? "archived" : "active"}` });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
apiRouter.post(
  "/admin/inventory/adjust",
  requireRole("super_admin", "inventory_manager"),
  (req, res) => {
    try {
      const { productId, changeType, quantity, reason } = req.body;
      if (!productId || !changeType || typeof quantity !== "number" || !reason) {
        return res.status(400).json({ error: "Product ID, change type, quantity, and a documented reason are required." });
      }
      const result = db.adjustStock(productId, changeType, quantity, reason, req.user);
      res.json({ message: "Inventory adjusted successfully.", ...result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
apiRouter.get("/admin/inventory/logs", requireAdmin, (req, res) => {
  res.json(db.getInventoryLogs());
});
apiRouter.get("/admin/orders", requireAdmin, (req, res) => {
  const { status, search } = req.query;
  const orders = db.getOrders({
    status,
    search
  });
  res.json(orders);
});
apiRouter.put(
  "/admin/orders/:id/status",
  requireRole("super_admin", "order_manager"),
  (req, res) => {
    try {
      const { status, note, trackingNumber, courierName } = req.body;
      if (!status) return res.status(400).json({ error: "Status is required" });
      const updated = db.updateOrderStatus(
        req.params.id,
        status,
        req.user,
        note,
        trackingNumber,
        courierName
      );
      res.json({ order: updated, message: "Order status updated" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
apiRouter.put(
  "/admin/orders/:id/payment",
  requireRole("super_admin", "order_manager"),
  (req, res) => {
    try {
      const { paymentStatus } = req.body;
      if (!paymentStatus) return res.status(400).json({ error: "paymentStatus is required" });
      const updated = db.updatePaymentStatus(req.params.id, paymentStatus, req.user);
      res.json({ order: updated, message: "Payment status updated" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
apiRouter.get("/admin/categories", requireAdmin, (req, res) => {
  res.json(db.getAllCategoriesAdmin());
});
apiRouter.post(
  "/admin/categories",
  requireRole("super_admin", "product_manager"),
  (req, res) => {
    try {
      const { nameEn, nameBn, slug, icon, displayOrder, isActive } = req.body;
      if (!nameEn || !nameBn) return res.status(400).json({ error: "Category names required" });
      const cat = db.createCategory({
        nameEn,
        nameBn,
        slug: slug || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        icon: icon || "Folder",
        displayOrder: Number(displayOrder) || 1,
        isActive: isActive !== false
      });
      res.status(201).json(cat);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
apiRouter.delete(
  "/admin/categories/:id",
  requireRole("super_admin", "product_manager"),
  (req, res) => {
    const deleted = db.deleteCategory(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Category not found" });
    res.json({ message: "Category deleted" });
  }
);
apiRouter.post(
  "/admin/brands",
  requireRole("super_admin", "product_manager"),
  (req, res) => {
    try {
      const { name, slug } = req.body;
      if (!name) return res.status(400).json({ error: "Brand name required" });
      const brand = db.createBrand({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      });
      res.status(201).json(brand);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
apiRouter.delete(
  "/admin/brands/:id",
  requireRole("super_admin", "product_manager"),
  (req, res) => {
    const deleted = db.deleteBrand(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Brand not found" });
    res.json({ message: "Brand deleted" });
  }
);
apiRouter.get("/admin/coupons", requireAdmin, (req, res) => {
  res.json(db.getAllCoupons());
});
apiRouter.post(
  "/admin/coupons",
  requireRole("super_admin", "product_manager"),
  (req, res) => {
    try {
      const { code, discountType, discountValue, minOrderAmount, maxDiscount, expiryDate } = req.body;
      if (!code || !discountValue || !expiryDate) {
        return res.status(400).json({ error: "Code, discount value, and expiry date required" });
      }
      const coupon = db.createCoupon({
        code,
        discountType: discountType || "fixed",
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : void 0,
        expiryDate,
        isActive: true
      });
      res.status(201).json(coupon);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
apiRouter.put(
  "/admin/coupons/:id/toggle",
  requireRole("super_admin", "product_manager"),
  (req, res) => {
    try {
      const coupon = db.toggleCouponStatus(req.params.id);
      res.json(coupon);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
apiRouter.delete(
  "/admin/coupons/:id",
  requireRole("super_admin", "product_manager"),
  (req, res) => {
    const deleted = db.deleteCoupon(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Coupon not found" });
    res.json({ message: "Coupon deleted" });
  }
);
apiRouter.get("/admin/staff", requireRole("super_admin"), (req, res) => {
  res.json(db.getAllStaff());
});
apiRouter.post("/admin/staff", requireRole("super_admin"), (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    if (!name || !email || !role || !password || password.length < 8) {
      return res.status(400).json({ error: "All fields and password (min 8 chars) required" });
    }
    const staff = db.createStaffMember({ name, email, phone: phone || "", role, password });
    res.status(201).json(staff);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.get("/admin/reviews", requireRole("super_admin", "customer_support"), (req, res) => {
  res.json(db.getAllReviewsAdmin());
});
apiRouter.put(
  "/admin/reviews/:id",
  requireRole("super_admin", "customer_support"),
  (req, res) => {
    try {
      const { status } = req.body;
      const review = db.updateReviewStatus(req.params.id, status);
      res.json(review);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
apiRouter.get("/admin/support", requireRole("super_admin", "customer_support"), (req, res) => {
  res.json(db.getSupportMessages());
});
apiRouter.put(
  "/admin/support/:id/reply",
  requireRole("super_admin", "customer_support"),
  (req, res) => {
    try {
      const { replyText } = req.body;
      if (!replyText) return res.status(400).json({ error: "Reply text required" });
      const msg = db.replySupportMessage(req.params.id, replyText);
      res.json(msg);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
apiRouter.put("/admin/settings", requireRole("super_admin"), (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.get("/admin/backup", requireRole("super_admin"), (req, res) => {
  res.json(db.getRawDatabaseBackup());
});

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  const isProd = process.env.NODE_ENV === "production";
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      service: "Borkot Tech API",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.use("/api", apiRouter);
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        host: "0.0.0.0"
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      const indexFile = path2.resolve(distPath, "index.html");
      if (fs2.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send("Application build not found. Please build the project.");
      }
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Borkot Tech] Server running on http://0.0.0.0:${PORT}`);
  });
  const shutdown = () => {
    console.log("[Borkot Tech] Shutting down server...");
    server.close(() => {
      console.log("[Borkot Tech] Server closed cleanly.");
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
startServer().catch((err) => {
  console.error("[Borkot Tech] Critical error during server startup:", err);
  process.exit(1);
});
