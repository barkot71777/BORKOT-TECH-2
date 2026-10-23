import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Product,
  Category,
  Brand,
  Order,
  InventoryLog,
  Coupon,
  ProductReview,
  SupportMessage,
  StoreSettings,
  OrderStatus,
  BangladeshAddress
} from '../types';

interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  products: Product[];
  categories: Category[];
  brands: Brand[];
  orders: Order[];
  inventoryLogs: InventoryLog[];
  coupons: Coupon[];
  reviews: ProductReview[];
  supportMessages: SupportMessage[];
  settings: StoreSettings;
}

// Keep the data directory configurable so deployments can mount a persistent disk.
// On ordinary local development it remains <project-root>/data.
const DATA_DIR = path.resolve(process.env.BORKOT_DATA_DIR || path.join(process.cwd(), 'data'));
const DB_FILE = path.join(DATA_DIR, 'borkot_tech.db.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const MAX_AUTOMATIC_BACKUPS = 10;
const configuredJwtSecret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && (!configuredJwtSecret || configuredJwtSecret.length < 32 || configuredJwtSecret.includes('replace_with_a_long_random_secret'))) {
  throw new Error('A strong JWT_SECRET of at least 32 characters is required in production. Generate a random secret and configure it in the hosting environment.');
}
const JWT_SECRET = configuredJwtSecret || crypto.randomBytes(32).toString('hex');

// Default initial store configuration for Bangladesh market
const DEFAULT_SETTINGS: StoreSettings = {
  storeNameEn: 'Borkot Tech',
  storeNameBn: 'বরকত টেক',
  phone: '',
  email: '',
  showroomAddressEn: '',
  showroomAddressBn: '',
  shippingInsideDhaka: 0,
  shippingOutsideDhaka: 0,
  freeShippingThreshold: 0,
  bkashMerchantNumber: '',
  nagadMerchantNumber: '',
  rocketMerchantNumber: '',
  bankDetails: '',
  allowCod: true,
  warrantyPolicyEn: '',
  warrantyPolicyBn: '',
  returnPolicyEn: '',
  returnPolicyBn: 'পণ্য গ্রহণের পর ৩ দিনের মধ্যে কোনো ত্রুটি (DOA) ধরা পড়লে আসল প্যাকেজিং সহ অক্ষত অবস্থায় রিপ্লেসমেন্ট প্রদান করা হয়। ফিজিক্যাল ড্যামেজ বা বার্ন ওয়ারেন্টির আওতাভুক্ত নয়।'
};

// Initial standard categories (empty of fake products per strict rule)
const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-desktop', nameEn: 'Desktop & Custom PC', nameBn: 'ডেস্কটপ ও কাস্টম পিসি', slug: 'desktop-pc', icon: 'Cpu', displayOrder: 1, isActive: true },
  { id: 'cat-laptop', nameEn: 'Laptops & Ultrabooks', nameBn: 'ল্যাপটপ ও নোটবুক', slug: 'laptops', icon: 'Laptop', displayOrder: 2, isActive: true },
  { id: 'cat-gpu', nameEn: 'Graphics Cards (GPU)', nameBn: 'গ্রাফিক্স কার্ড', slug: 'graphics-cards', icon: 'MonitorPlay', displayOrder: 3, isActive: true },
  { id: 'cat-cpu-mobo', nameEn: 'Processors & Motherboards', nameBn: 'প্রসেসর ও মাদারবোর্ড', slug: 'cpu-motherboard', icon: 'Microchip', displayOrder: 4, isActive: true },
  { id: 'cat-ram-storage', nameEn: 'RAM & NVMe SSD Storage', nameBn: 'র‍্যাম ও এসএসডি স্টোরেজ', slug: 'ram-storage', icon: 'HardDrive', displayOrder: 5, isActive: true },
  { id: 'cat-monitor', nameEn: 'Monitors & Displays', nameBn: 'মনিটর ও ডিসপ্লে', slug: 'monitors', icon: 'Monitor', displayOrder: 6, isActive: true },
  { id: 'cat-peripherals', nameEn: 'Keyboards, Mice & Audio', nameBn: 'কীবোর্ড, মাউস ও অডিও', slug: 'peripherals', icon: 'Headphones', displayOrder: 7, isActive: true },
  { id: 'cat-cooling-power', nameEn: 'Cases, Power & Cooling', nameBn: 'কেসিং, পাওয়ার ও কুলার', slug: 'power-cooling', icon: 'Fan', displayOrder: 8, isActive: true },
  { id: 'cat-gaming-gear', nameEn: 'Gaming Chairs & Setup', nameBn: 'গেমিং চেয়ার ও অ্যাক্সেসরিজ', slug: 'gaming-gear', icon: 'Gamepad2', displayOrder: 9, isActive: true }
];

// Initial standard brands
const INITIAL_BRANDS: Brand[] = [
  { id: 'brand-asus', name: 'ASUS ROG', slug: 'asus-rog' },
  { id: 'brand-msi', name: 'MSI Gaming', slug: 'msi' },
  { id: 'brand-gigabyte', name: 'Gigabyte AORUS', slug: 'gigabyte' },
  { id: 'brand-intel', name: 'Intel', slug: 'intel' },
  { id: 'brand-amd', name: 'AMD Ryzen', slug: 'amd' },
  { id: 'brand-corsair', name: 'Corsair', slug: 'corsair' },
  { id: 'brand-logitech', name: 'Logitech G', slug: 'logitech-g' },
  { id: 'brand-razer', name: 'Razer', slug: 'razer' },
  { id: 'brand-samsung', name: 'Samsung', slug: 'samsung' }
];

class DatabaseEngine {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.db = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          // Strict Product Catalog Rule: products only contain admin created items
          products: parsed.products || [],
          categories: parsed.categories || INITIAL_CATEGORIES,
          brands: parsed.brands || INITIAL_BRANDS,
          orders: parsed.orders || [],
          inventoryLogs: parsed.inventoryLogs || [],
          coupons: (parsed.coupons || []).filter((coupon: Coupon) => coupon.code !== 'BORKOT500'),
          reviews: parsed.reviews || [],
          supportMessages: parsed.supportMessages || [],
          settings: {
            ...(parsed.settings || DEFAULT_SETTINGS),
            shippingInsideDhaka: parsed.settings?.shippingInsideDhaka === 60 ? 0 : (parsed.settings?.shippingInsideDhaka ?? DEFAULT_SETTINGS.shippingInsideDhaka),
            shippingOutsideDhaka: parsed.settings?.shippingOutsideDhaka === 120 ? 0 : (parsed.settings?.shippingOutsideDhaka ?? DEFAULT_SETTINGS.shippingOutsideDhaka),
            freeShippingThreshold: parsed.settings?.freeShippingThreshold === 50000 ? 0 : (parsed.settings?.freeShippingThreshold ?? DEFAULT_SETTINGS.freeShippingThreshold),
            phone: parsed.settings?.phone === '+880 1711-000000' ? '' : (parsed.settings?.phone ?? DEFAULT_SETTINGS.phone),
            email: parsed.settings?.email === 'sales@borkottech.com.bd' ? '' : (parsed.settings?.email ?? DEFAULT_SETTINGS.email),
            showroomAddressEn: parsed.settings?.showroomAddressEn === 'Shop #804, Level 8, Multiplan Computer City Center, New Elephant Road, Dhaka-1205, Bangladesh' ? '' : (parsed.settings?.showroomAddressEn ?? DEFAULT_SETTINGS.showroomAddressEn),
            showroomAddressBn: parsed.settings?.showroomAddressBn === 'দোকান #৮০৪, লেভেল ৮, মাল্টিপ্ল্যান কম্পিউটার সিটি সেন্টার, নিউ এলিফ্যান্ট রোড, ঢাকা-১২০৫, বাংলাদেশ' ? '' : (parsed.settings?.showroomAddressBn ?? DEFAULT_SETTINGS.showroomAddressBn),
            bkashMerchantNumber: parsed.settings?.bkashMerchantNumber === '01711000000 (Merchant)' ? '' : (parsed.settings?.bkashMerchantNumber ?? DEFAULT_SETTINGS.bkashMerchantNumber),
            nagadMerchantNumber: parsed.settings?.nagadMerchantNumber === '01911000000 (Merchant)' ? '' : (parsed.settings?.nagadMerchantNumber ?? DEFAULT_SETTINGS.nagadMerchantNumber),
            rocketMerchantNumber: parsed.settings?.rocketMerchantNumber === '01811000000-8' ? '' : (parsed.settings?.rocketMerchantNumber ?? DEFAULT_SETTINGS.rocketMerchantNumber),
            bankDetails: parsed.settings?.bankDetails === 'City Bank Ltd, Account: Borkot Tech BD, A/C: 1102938475001, Elephant Road Branch' ? '' : (parsed.settings?.bankDetails ?? DEFAULT_SETTINGS.bankDetails),
            warrantyPolicyEn: parsed.settings?.warrantyPolicyEn?.startsWith('All products purchased from Borkot Tech carry official manufacturer') ? '' : (parsed.settings?.warrantyPolicyEn ?? DEFAULT_SETTINGS.warrantyPolicyEn),
            warrantyPolicyBn: parsed.settings?.warrantyPolicyBn?.startsWith('বরকত টেক থেকে ক্রয়কৃত প্রতিটি পণ্যে') ? '' : (parsed.settings?.warrantyPolicyBn ?? DEFAULT_SETTINGS.warrantyPolicyBn),
            returnPolicyEn: parsed.settings?.returnPolicyEn?.startsWith('Hardware components can be replaced within 3 days') ? '' : (parsed.settings?.returnPolicyEn ?? DEFAULT_SETTINGS.returnPolicyEn),
            returnPolicyBn: parsed.settings?.returnPolicyBn?.startsWith('পণ্য গ্রহণের পর ৩ দিনের মধ্যে') ? '' : (parsed.settings?.returnPolicyBn ?? DEFAULT_SETTINGS.returnPolicyBn)
          }
        };
      } catch (err) {
        // Never silently replace an unreadable database with an empty one. Preserve it
        // and stop startup so the owner can recover from a backup without losing data.
        const quarantinePath = `${DB_FILE}.unreadable-${new Date().toISOString().replace(/[:.]/g, '-')}`;
        try { fs.copyFileSync(DB_FILE, quarantinePath); } catch (copyErr) {
          console.error('Could not preserve unreadable database file:', copyErr);
        }
        console.error(`Database file could not be read. Original preserved at ${quarantinePath}. Startup stopped to prevent data loss.`, err);
        throw new Error(`Existing database is unreadable; refusing to initialize an empty database. Check ${DB_FILE} and restore a verified backup.`);
      }
    }

    // Initialize fresh database
    // IMPORTANT: Per strict rule, products array is initialized empty []
    const freshDb: DatabaseSchema = {
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

  private persist(dataToSave?: DatabaseSchema) {
    // All operations here are synchronous, so a re-entrancy flag is unnecessary.
    // The old flag silently discarded a save if another save happened while it was set.
    this.ensureDataDir();
    const target = dataToSave || this.db;
    const json = JSON.stringify(target, null, 2);
    const tempFile = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
    try {
      // Preserve the last known-good database before replacing it. Keep a bounded
      // rolling set of backups to support recovery from accidental edits/deletes.
      if (fs.existsSync(DB_FILE)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_DIR, `borkot_tech.db.${stamp}.json`);
        fs.copyFileSync(DB_FILE, backupFile);
        const backups = fs.readdirSync(BACKUP_DIR)
          .filter((name) => /^borkot_tech\.db\..+\.json$/.test(name))
          .sort();
        while (backups.length > MAX_AUTOMATIC_BACKUPS) {
          const oldest = backups.shift();
          if (oldest) fs.unlinkSync(path.join(BACKUP_DIR, oldest));
        }
      }
      fs.writeFileSync(tempFile, json, { encoding: 'utf-8', flag: 'wx' });
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch { /* best effort cleanup */ }
      console.error('Critical: Failed to persist database. The current database was not intentionally reset:', err);
      throw err;
    }
  }

  // --- CRYPTO & AUTH HELPERS ---
  public hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt };
  }

  public verifyPassword(password: string, hash: string, salt: string): boolean {
    const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
    } catch {
      return false;
    }
  }

  public generateToken(user: User): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      })
    ).toString('base64url');
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    return `${header}.${payload}.${signature}`;
  }

  public verifyToken(token: string): { id: string; email: string; name: string; role: string } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
      }

      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
      if (decoded.exp && decoded.exp < Date.now()) {
        return null; // Expired
      }
      return decoded;
    } catch {
      return null;
    }
  }

  // --- ADMIN INITIAL SETUP CHECK ---
  public hasSuperAdmin(): boolean {
    return this.db.users.some(u => u.role === 'super_admin');
  }

  public createSuperAdmin(data: { name: string; email: string; phone: string; password: string }): User {
    if (this.hasSuperAdmin()) {
      throw new Error('A Super Admin already exists for Borkot Tech.');
    }
    const { hash, salt } = this.hashPassword(data.password);
    const user: User & { passwordHash: string; salt: string } = {
      id: `admin-${Date.now()}`,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      role: 'super_admin',
      addresses: [],
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      salt: salt
    };
    this.db.users.push(user);
    this.persist();
    
    // Return sanitized user without hashes
    const { passwordHash, salt: _, ...safeUser } = user;
    return safeUser;
  }

  // --- USER AUTHENTICATION & PROFILE ---
  public registerCustomer(data: { name: string; email: string; phone: string; password: string }): User {
    const existing = this.db.users.find(u => u.email.toLowerCase() === data.email.toLowerCase().trim());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const { hash, salt } = this.hashPassword(data.password);
    const user: User & { passwordHash: string; salt: string } = {
      id: `cust-${Date.now()}`,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      role: 'customer',
      addresses: [],
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      salt: salt
    };

    this.db.users.push(user);
    this.persist();

    const { passwordHash, salt: _, ...safeUser } = user;
    return safeUser;
  }

  public authenticateUser(email: string, password: string): { user: User; token: string } {
    const user = this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      throw new Error('Invalid email address or password.');
    }

    const isValid = this.verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      throw new Error('Invalid email address or password.');
    }

    const { passwordHash, salt, ...safeUser } = user;
    const token = this.generateToken(safeUser);
    return { user: safeUser, token };
  }

  public getUserById(id: string): User | null {
    const user = this.db.users.find(u => u.id === id);
    if (!user) return null;
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }

  public updateUserAddresses(userId: string, addresses: BangladeshAddress[]): User {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    user.addresses = addresses;
    this.persist();
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }

  public getAllStaff(): User[] {
    return this.db.users
      .filter(u => u.role !== 'customer')
      .map(({ passwordHash, salt, ...safeUser }) => safeUser);
  }

  public createStaffMember(data: { name: string; email: string; phone: string; role: any; password: string }): User {
    const existing = this.db.users.find(u => u.email.toLowerCase() === data.email.toLowerCase().trim());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }
    const { hash, salt } = this.hashPassword(data.password);
    const staffUser: User & { passwordHash: string; salt: string } = {
      id: `staff-${Date.now()}`,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      role: data.role,
      addresses: [],
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      salt: salt
    };
    this.db.users.push(staffUser);
    this.persist();
    const { passwordHash, salt: _, ...safeUser } = staffUser;
    return safeUser;
  }

  // --- PRODUCTS (STRICT CATALOG RULE COMPLIANCE) ---
  public getProducts(params?: {
    categorySlug?: string;
    brandSlug?: string;
    search?: string;
    inStockOnly?: boolean;
    sort?: 'newest' | 'price_low' | 'price_high' | 'popular';
    includeArchived?: boolean;
  }): Product[] {
    let list = this.db.products;

    if (!params?.includeArchived) {
      list = list.filter(p => !p.isArchived);
    }

    if (params?.categorySlug) {
      const cat = this.db.categories.find(c => c.slug === params.categorySlug || c.id === params.categorySlug);
      if (cat) {
        list = list.filter(p => p.categoryId === cat.id);
      }
    }

    if (params?.brandSlug) {
      const brand = this.db.brands.find(b => b.slug === params.brandSlug || b.id === params.brandSlug);
      if (brand) {
        list = list.filter(p => p.brandId === brand.id);
      }
    }

    if (params?.inStockOnly) {
      list = list.filter(p => p.stockQuantity > 0);
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(p => 
        p.nameEn.toLowerCase().includes(q) ||
        p.nameBn.includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.specifications.some(s => s.value.toLowerCase().includes(q) || s.key.toLowerCase().includes(q))
      );
    }

    // Sort
    if (params?.sort === 'price_low') {
      list = [...list].sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (params?.sort === 'price_high') {
      list = [...list].sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else {
      // Default: newest
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }

  public getProductById(id: string): Product | null {
    return this.db.products.find(p => p.id === id || p.slug === id) || null;
  }

  public createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, adminUser: User): Product {
    // Check SKU uniqueness
    const existingSku = this.db.products.find(p => p.sku.toUpperCase() === data.sku.toUpperCase());
    if (existingSku) {
      throw new Error(`A product with SKU "${data.sku}" already exists.`);
    }

    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      sku: data.sku.toUpperCase().trim(),
      slug: data.slug || data.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.db.products.push(newProduct);

    // If initial stock > 0, log stock receiving
    if (newProduct.stockQuantity > 0) {
      this.logInventoryMovement({
        productId: newProduct.id,
        productSku: newProduct.sku,
        productName: newProduct.nameEn,
        adminId: adminUser.id,
        adminName: adminUser.name,
        changeType: 'stock_in',
        quantityChange: newProduct.stockQuantity,
        stockBefore: 0,
        stockAfter: newProduct.stockQuantity,
        reason: 'Initial stock intake on product creation'
      });
    }

    this.persist();
    return newProduct;
  }

  public updateProduct(id: string, data: Partial<Product>, adminUser: User): Product {
    const index = this.db.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found.');

    const current = this.db.products[index];

    // Check SKU uniqueness if changed
    if (data.sku && data.sku.toUpperCase() !== current.sku.toUpperCase()) {
      const existingSku = this.db.products.find(p => p.id !== id && p.sku.toUpperCase() === data.sku!.toUpperCase());
      if (existingSku) {
        throw new Error(`A product with SKU "${data.sku}" already exists.`);
      }
    }

    // Check if stock quantity was manually updated directly
    if (typeof data.stockQuantity === 'number' && data.stockQuantity !== current.stockQuantity) {
      const diff = data.stockQuantity - current.stockQuantity;
      this.logInventoryMovement({
        productId: current.id,
        productSku: current.sku,
        productName: current.nameEn,
        adminId: adminUser.id,
        adminName: adminUser.name,
        changeType: 'manual_adjustment',
        quantityChange: diff,
        stockBefore: current.stockQuantity,
        stockAfter: data.stockQuantity,
        reason: 'Admin updated product stock count'
      });
    }

    const updated: Product = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.db.products[index] = updated;
    this.persist();
    return updated;
  }

  public deleteProduct(id: string): boolean {
    const index = this.db.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.db.products.splice(index, 1);
    this.persist();
    return true;
  }

  // --- INVENTORY MANAGEMENT & AUDIT LOGS ---
  public adjustStock(
    productId: string,
    changeType: 'stock_in' | 'stock_out' | 'manual_adjustment',
    quantityChange: number,
    reason: string,
    adminUser: User
  ): { product: Product; log: InventoryLog } {
    const product = this.db.products.find(p => p.id === productId);
    if (!product) throw new Error('Product not found.');

    const stockBefore = product.stockQuantity;
    let stockAfter = stockBefore;

    if (changeType === 'stock_in') {
      stockAfter += Math.abs(quantityChange);
    } else if (changeType === 'stock_out') {
      stockAfter -= Math.abs(quantityChange);
    } else {
      stockAfter = stockBefore + quantityChange;
    }

    if (stockAfter < 0) {
      throw new Error(`Stock adjustment would result in negative inventory (${stockAfter}). Minimum allowed is 0.`);
    }

    product.stockQuantity = stockAfter;
    product.updatedAt = new Date().toISOString();

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

  private logInventoryMovement(data: Omit<InventoryLog, 'id' | 'timestamp'>): InventoryLog {
    const log: InventoryLog = {
      ...data,
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.db.inventoryLogs.unshift(log);
    return log;
  }

  public getInventoryLogs(limit: number = 100): InventoryLog[] {
    return this.db.inventoryLogs.slice(0, limit);
  }

  // --- CATEGORIES & BRANDS ---
  public getCategories(): Category[] {
    return this.db.categories.filter(c => c.isActive);
  }

  public getAllCategoriesAdmin(): Category[] {
    return this.db.categories;
  }

  public createCategory(data: Omit<Category, 'id'>): Category {
    const cat: Category = {
      ...data,
      id: `cat-${Date.now()}`
    };
    this.db.categories.push(cat);
    this.persist();
    return cat;
  }

  public updateCategory(id: string, data: Partial<Category>): Category {
    const index = this.db.categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    this.db.categories[index] = { ...this.db.categories[index], ...data };
    this.persist();
    return this.db.categories[index];
  }

  public getBrands(): Brand[] {
    return this.db.brands;
  }

  public createBrand(data: Omit<Brand, 'id'>): Brand {
    const brand: Brand = {
      ...data,
      id: `brand-${Date.now()}`
    };
    this.db.brands.push(brand);
    this.persist();
    return brand;
  }

  // --- COUPONS ---
  public getCoupon(code: string): Coupon | null {
    const c = this.db.coupons.find(cp => cp.code.toUpperCase() === code.toUpperCase().trim() && cp.isActive);
    if (!c) return null;
    if (new Date(c.expiryDate).getTime() < Date.now()) return null;
    return c;
  }

  public getAllCoupons(): Coupon[] {
    return this.db.coupons;
  }

  public createCoupon(data: Omit<Coupon, 'id' | 'usageCount'>): Coupon {
    const coupon: Coupon = {
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
  public checkoutOrder(orderData: {
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryAddress: BangladeshAddress;
    items: { productId: string; quantity: number }[];
    couponCode?: string;
    deliveryMethod: 'inside_dhaka' | 'outside_dhaka' | 'express';
    paymentMethod: 'cod' | 'bkash' | 'nagad' | 'rocket' | 'bank_transfer';
    paymentDetails?: { transactionId?: string; senderNumber?: string; bankReference?: string };
    notes?: string;
  }): Order {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Shopping cart cannot be empty.');
    }

    // Server-side stock & price verification against authoritative database
    const orderItems: Order['items'] = [];
    let subtotal = 0;

    for (const item of orderData.items) {
      const product = this.db.products.find(p => p.id === item.productId && !p.isArchived);
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
        image: product.images[0] || ''
      });
    }

    // Coupon discount calculation
    let discount = 0;
    if (orderData.couponCode) {
      const coupon = this.getCoupon(orderData.couponCode);
      if (coupon && subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percentage') {
          discount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }
        coupon.usageCount += 1;
      }
    }

    // Delivery charge calculation
    let deliveryCharge = this.db.settings.shippingOutsideDhaka;
    if (orderData.deliveryMethod === 'inside_dhaka' || orderData.deliveryAddress.division.toLowerCase() === 'dhaka') {
      deliveryCharge = this.db.settings.shippingInsideDhaka;
    }
    if (orderData.deliveryMethod === 'express') {
      // Express delivery currently uses the configured inside-Dhaka rate until a separate express rate is added to store settings.
      deliveryCharge = this.db.settings.shippingInsideDhaka;
    }
    if (this.db.settings.freeShippingThreshold > 0 && subtotal >= this.db.settings.freeShippingThreshold) {
      deliveryCharge = 0;
    }

    const totalAmount = Math.max(0, subtotal - discount + deliveryCharge);

    const orderNumber = `BT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrderId = `order-${Date.now()}`;

    // Decrement stock & record inventory logs atomically
    for (const item of orderData.items) {
      const product = this.db.products.find(p => p.id === item.productId)!;
      const stockBefore = product.stockQuantity;
      product.stockQuantity -= item.quantity;
      product.updatedAt = new Date().toISOString();

      this.logInventoryMovement({
        productId: product.id,
        productSku: product.sku,
        productName: product.nameEn,
        adminId: orderData.customerId || 'system',
        adminName: orderData.customerName,
        changeType: 'order_reserve',
        quantityChange: -item.quantity,
        stockBefore,
        stockAfter: product.stockQuantity,
        reason: `Reserved for customer order ${orderNumber}`,
        orderId: newOrderId
      });
    }

    const newOrder: Order = {
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
      paymentStatus: orderData.paymentMethod === 'cod' ? 'pending' : (orderData.paymentDetails?.transactionId ? 'pending' : 'pending'),
      paymentDetails: orderData.paymentDetails,
      orderStatus: 'pending',
      notes: orderData.notes,
      auditLog: [
        {
          status: 'pending',
          updatedBy: 'Customer',
          note: `Order placed via website. Payment: ${orderData.paymentMethod.toUpperCase()}`,
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.db.orders.unshift(newOrder);
    this.persist();
    return newOrder;
  }

  // --- ORDER MANAGEMENT ---
  public getOrders(params?: {
    status?: OrderStatus;
    search?: string;
    customerId?: string;
  }): Order[] {
    let list = this.db.orders;

    if (params?.customerId) {
      list = list.filter(o => o.customerId === params.customerId);
    }

    if (params?.status) {
      list = list.filter(o => o.orderStatus === params.status);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(o => 
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.customerName.toLowerCase().includes(q)
      );
    }

    return list;
  }

  public getOrderById(idOrNumber: string): Order | null {
    return this.db.orders.find(o => o.id === idOrNumber || o.orderNumber === idOrNumber) || null;
  }

  public updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    adminUser: User,
    note?: string,
    trackingNumber?: string,
    courierName?: string
  ): Order {
    const order = this.db.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const previousStatus = order.orderStatus;
    if (previousStatus === newStatus) return order;

    // Handle inventory return on cancellation
    if (newStatus === 'cancelled' && previousStatus !== 'cancelled') {
      for (const item of order.items) {
        const product = this.db.products.find(p => p.id === item.productId);
        if (product) {
          const stockBefore = product.stockQuantity;
          product.stockQuantity += item.quantity;
          product.updatedAt = new Date().toISOString();

          this.logInventoryMovement({
            productId: product.id,
            productSku: product.sku,
            productName: product.nameEn,
            adminId: adminUser.id,
            adminName: adminUser.name,
            changeType: 'order_cancel_return',
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
    order.updatedAt = new Date().toISOString();

    order.auditLog.push({
      status: newStatus,
      updatedBy: adminUser.name,
      note: note || `Order status updated to ${newStatus}`,
      timestamp: new Date().toISOString()
    });

    this.persist();
    return order;
  }

  public updatePaymentStatus(orderId: string, paymentStatus: 'verified' | 'failed' | 'refunded', adminUser: User): Order {
    const order = this.db.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    order.paymentStatus = paymentStatus;
    order.updatedAt = new Date().toISOString();
    order.auditLog.push({
      status: order.orderStatus,
      updatedBy: adminUser.name,
      note: `Payment status updated to ${paymentStatus.toUpperCase()}`,
      timestamp: new Date().toISOString()
    });

    this.persist();
    return order;
  }

  // --- REVIEWS & SUPPORT ---
  public addReview(data: Omit<ProductReview, 'id' | 'createdAt' | 'status'>): ProductReview {
    const review: ProductReview = {
      ...data,
      id: `rev-${Date.now()}`,
      status: 'pending', // Requires admin moderation
      createdAt: new Date().toISOString()
    };
    this.db.reviews.push(review);
    this.persist();
    return review;
  }

  public getProductReviews(productId: string): ProductReview[] {
    return this.db.reviews.filter(r => r.productId === productId && r.status === 'approved');
  }

  public getAllReviewsAdmin(): ProductReview[] {
    return this.db.reviews;
  }

  public updateReviewStatus(reviewId: string, status: 'approved' | 'rejected'): ProductReview {
    const review = this.db.reviews.find(r => r.id === reviewId);
    if (!review) throw new Error('Review not found');
    review.status = status;
    this.persist();
    return review;
  }

  public addSupportMessage(data: Omit<SupportMessage, 'id' | 'status' | 'createdAt'>): SupportMessage {
    const msg: SupportMessage = {
      ...data,
      id: `msg-${Date.now()}`,
      status: 'unread',
      createdAt: new Date().toISOString()
    };
    this.db.supportMessages.push(msg);
    this.persist();
    return msg;
  }

  public getSupportMessages(): SupportMessage[] {
    return this.db.supportMessages;
  }

  public replySupportMessage(id: string, replyText: string): SupportMessage {
    const msg = this.db.supportMessages.find(m => m.id === id);
    if (!msg) throw new Error('Support message not found');
    msg.status = 'replied';
    msg.replyText = replyText;
    this.persist();
    return msg;
  }

  // --- PASSWORD RESET & USER PROFILE ---
  private passwordResetTokens = new Map<string, { userId: string; expires: number }>();

  public createPasswordResetToken(email: string): string | null {
    const user = this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) return null;
    const token = crypto.randomBytes(32).toString('hex');
    this.passwordResetTokens.set(token, {
      userId: user.id,
      expires: Date.now() + 1000 * 60 * 30 // 30 minutes
    });
    return token;
  }

  public resetPasswordWithToken(token: string, newPassword: string): boolean {
    const entry = this.passwordResetTokens.get(token);
    if (!entry || entry.expires < Date.now()) {
      return false;
    }
    const user = this.db.users.find(u => u.id === entry.userId);
    if (!user) return false;

    const { hash, salt } = this.hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    this.passwordResetTokens.delete(token);
    this.persist();
    return true;
  }

  public changeUserPassword(userId: string, oldPassword: string, newPassword: string): boolean {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    if (!this.verifyPassword(oldPassword, user.passwordHash, user.salt)) {
      throw new Error('Current password is incorrect');
    }
    const { hash, salt } = this.hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    this.persist();
    return true;
  }

  public updateUserProfile(userId: string, data: { name?: string; phone?: string }): User {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    if (data.name) user.name = data.name.trim();
    if (data.phone) user.phone = data.phone.trim();
    this.persist();
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }

  public toggleProductArchive(id: string): Product {
    const product = this.db.products.find(p => p.id === id);
    if (!product) throw new Error('Product not found');
    product.isArchived = !product.isArchived;
    product.updatedAt = new Date().toISOString();
    this.persist();
    return product;
  }

  public deleteCategory(id: string): boolean {
    const idx = this.db.categories.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.db.categories.splice(idx, 1);
    this.persist();
    return true;
  }

  public deleteBrand(id: string): boolean {
    const idx = this.db.brands.findIndex(b => b.id === id);
    if (idx === -1) return false;
    this.db.brands.splice(idx, 1);
    this.persist();
    return true;
  }

  public deleteCoupon(id: string): boolean {
    const idx = this.db.coupons.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.db.coupons.splice(idx, 1);
    this.persist();
    return true;
  }

  public toggleCouponStatus(id: string): Coupon {
    const coupon = this.db.coupons.find(c => c.id === id);
    if (!coupon) throw new Error('Coupon not found');
    coupon.isActive = !coupon.isActive;
    this.persist();
    return coupon;
  }

  // --- STORE SETTINGS ---
  public getSettings(): StoreSettings {
    return this.db.settings;
  }

  public updateSettings(settings: Partial<StoreSettings>): StoreSettings {
    this.db.settings = { ...this.db.settings, ...settings };
    this.persist();
    return this.db.settings;
  }

  // --- DIAGNOSTICS & DASHBOARD METRICS ---
  public getDashboardMetrics() {
    const products = this.db.products;
    const orders = this.db.orders;
    const users = this.db.users;

    const totalSales = orders
      .filter(o => o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;
    const processingOrders = orders.filter(o => o.orderStatus === 'processing' || o.orderStatus === 'confirmed').length;
    const lowStockCount = products.filter(p => !p.isArchived && p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length;
    const outOfStockCount = products.filter(p => !p.isArchived && p.stockQuantity === 0).length;

    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => !p.isArchived).length,
      lowStockCount,
      outOfStockCount,
      totalOrders: orders.length,
      pendingOrders,
      processingOrders,
      totalSales,
      totalCustomers: users.filter(u => u.role === 'customer').length,
      recentOrders: orders.slice(0, 10),
      recentLogs: this.db.inventoryLogs.slice(0, 10)
    };
  }

  public getRawDatabaseBackup() {
    return { ...this.db };
  }
}

export const db = new DatabaseEngine();
