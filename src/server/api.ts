import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db';
import { User, OrderStatus } from '../types';
import { sanitizeHtml } from '../utils/sanitizeHtml';

export const apiRouter = Router();

// Middleware: Extract user from Bearer Token
export interface AuthenticatedRequest extends Request {
  user?: User;
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

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

// Auth guards
const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role === 'customer') {
    return res.status(403).json({ error: 'Access denied: Administrative privileges required' });
  }
  next();
};

const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role === 'super_admin' || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: 'Access denied: Insufficient permissions for this action' });
  };
};

// ==========================================
// 1. AUTH & SETUP ENDPOINTS
// ==========================================

// Check if initial Super Admin setup is needed
apiRouter.get('/admin/setup-status', (req: Request, res: Response) => {
  const hasSuperAdmin = db.hasSuperAdmin();
  res.json({ setupRequired: !hasSuperAdmin });
});

// Initial Super Admin setup (only permitted once)
apiRouter.post('/admin/setup', (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Name, valid email, and a password of at least 8 characters are required.' });
    }

    const admin = db.createSuperAdmin({ name, email, phone: phone || '', password });
    const token = db.generateToken(admin);
    res.status(201).json({ user: admin, token, message: 'Super Admin account initialized successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to setup admin account' });
  }
});

// Customer Registration
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password || password.length < 6) {
      return res.status(400).json({ error: 'Please provide full name, email, phone number, and a password (min 6 chars).' });
    }

    const user = db.registerCustomer({ name, email, phone, password });
    const token = db.generateToken(user);
    res.status(201).json({ user, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// In-memory brute force protection for login
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

const checkLoginRateLimit = (key: string): boolean => {
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

const clearLoginAttempts = (key: string) => {
  loginAttempts.delete(key);
};

// Login (Customer or Admin) with rate limiting
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.email || req.body.username || req.body.adminId || req.body.phone;
    const { password } = req.body;
    if (!rawIdentifier || !password) {
      return res.status(400).json({ error: 'Admin ID / Email / Phone and password are required' });
    }

    const identifier = String(rawIdentifier).trim();
    const clientIp = req.ip || req.socket.remoteAddress || 'client';
    const rateLimitKey = `${clientIp}_${identifier.toLowerCase()}`;
    if (!checkLoginRateLimit(rateLimitKey)) {
      return res.status(429).json({ error: 'Too many failed login attempts. Please wait 5 minutes before retrying.' });
    }

    const { user, token } = db.authenticateUser(identifier, password);
    clearLoginAttempts(rateLimitKey);
    res.json({ user, token });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
});

// Forgot Password: intentionally unavailable until a real email delivery provider is configured.
// Never return reset tokens through a public API response.
apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body || {};
  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }
  return res.status(503).json({
    error: 'Password reset is temporarily unavailable because secure email delivery has not been configured. Please contact the store administrator.'
  });
});

// Reset Password with Token
apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Valid token and new password (min 6 characters) required' });
  }
  const success = db.resetPasswordWithToken(token, newPassword);
  if (!success) {
    return res.status(400).json({ error: 'Invalid or expired password reset token' });
  }
  res.json({ message: 'Password reset successfully. You can now sign in.' });
});

// Change Password for authenticated user
apiRouter.put('/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Current password and new password (min 6 characters) required' });
  }
  try {
    db.changeUserPassword(req.user!.id, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update Customer Profile (name & phone)
apiRouter.put('/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, phone } = req.body;
  try {
    const updated = db.updateUserProfile(req.user!.id, { name, phone });
    res.json({ user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Current user profile
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// Update Customer Addresses
apiRouter.put('/auth/addresses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { addresses } = req.body;
    if (!Array.isArray(addresses)) {
      return res.status(400).json({ error: 'Addresses must be an array' });
    }
    const updated = db.updateUserAddresses(req.user!.id, addresses);
    res.json({ user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 2. STOREFRONT & PRODUCTS
// ==========================================

// Get public products (Strict Rule: only admin-created items are returned)
apiRouter.get('/products', (req: Request, res: Response) => {
  try {
    const { category, brand, search, inStock, sort } = req.query;
    const products = db.getProducts({
      categorySlug: category as string,
      brandSlug: brand as string,
      search: search as string,
      inStockOnly: inStock === 'true',
      sort: sort as any,
      includeArchived: false
    });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product details + reviews
apiRouter.get('/products/:id', (req: Request, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product || product.isArchived) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const reviews = db.getProductReviews(product.id);
  res.json({ product, reviews });
});

// Categories & Brands
apiRouter.get('/categories', (req: Request, res: Response) => {
  res.json(db.getCategories());
});

apiRouter.get('/brands', (req: Request, res: Response) => {
  res.json(db.getBrands());
});

// Validate Coupon
apiRouter.post('/coupons/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Coupon code required' });
  }
  const coupon = db.getCoupon(code);
  if (!coupon) {
    return res.status(404).json({ valid: false, error: 'Invalid or expired coupon code' });
  }
  if (subtotal && subtotal < coupon.minOrderAmount) {
    return res.status(400).json({
      valid: false,
      error: `Minimum order value for this coupon is ৳ ${coupon.minOrderAmount}`
    });
  }

  let discount = coupon.discountValue;
  if (coupon.discountType === 'percentage' && subtotal) {
    discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  }

  res.json({ valid: true, coupon, discount });
});

// Store Settings (Public info like contact, showroom address, shipping rates)
apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json(db.getSettings());
});

// ==========================================
// 3. CHECKOUT & ORDERS
// ==========================================

// Create Order (Server-Side Price and Stock Verification)
apiRouter.post('/orders/checkout', (req: AuthenticatedRequest, res: Response) => {
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
      return res.status(400).json({ error: 'Missing required order fields.' });
    }

    const order = db.checkoutOrder({
      customerId: req.user?.id,
      customerName,
      customerEmail: customerEmail || req.user?.email || '',
      customerPhone,
      deliveryAddress,
      items,
      couponCode,
      deliveryMethod: deliveryMethod || 'inside_dhaka',
      paymentMethod,
      paymentDetails,
      notes
    });

    res.status(201).json({ order, message: 'Order placed successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Checkout failed' });
  }
});

// Public Track Order (Order Number + Phone)
apiRouter.get('/orders/track', (req: Request, res: Response) => {
  const { orderNumber, phone } = req.query;
  if (!orderNumber || !phone) {
    return res.status(400).json({ error: 'Both order number and phone number are required for verification.' });
  }

  const order = db.getOrderById(orderNumber as string);
  if (!order || order.customerPhone.replace(/[\s\-]/g, '') !== (phone as string).replace(/[\s\-]/g, '')) {
    return res.status(404).json({ error: 'No order matched with the provided details.' });
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

// Customer Isolated Orders (Strict Customer Isolation)
apiRouter.get('/customer/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const orders = db.getOrders({ customerId: req.user!.id });
  res.json(orders);
});

// Customer Request Cancel (Only permitted if pending or confirmed)
apiRouter.post('/customer/orders/:id/cancel', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied: You can only cancel your own orders.' });
    }

    if (order.orderStatus !== 'pending' && order.orderStatus !== 'confirmed') {
      return res.status(400).json({ error: 'Orders can only be cancelled before they enter processing/dispatch.' });
    }

    const { reason } = req.body;
    const updated = db.updateOrderStatus(order.id, 'cancelled', req.user!, reason || 'Cancelled by customer');
    res.json({ order: updated, message: 'Order has been cancelled.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Submit Customer Support Enquiry
apiRouter.post('/support', (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    const msg = db.addSupportMessage({ name, email, phone: phone || '', subject: subject || 'General Enquiry', message });
    res.status(201).json({ message: 'Support message received. We will contact you soon.', id: msg.id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record enquiry' });
  }
});

// Submit Product Review
apiRouter.post('/reviews', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating || !comment) {
      return res.status(400).json({ error: 'Product ID, rating (1-5), and review text required.' });
    }
    const review = db.addReview({
      productId,
      customerId: req.user!.id,
      customerName: req.user!.name,
      rating: Number(rating),
      comment
    });
    res.status(201).json({ message: 'Review submitted for moderation.', review });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 4. ADMIN PANEL PROTECTED ENDPOINTS
// ==========================================

// Dashboard Metrics
apiRouter.get('/admin/dashboard', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getDashboardMetrics());
});

// Admin Products (List with archived items)
apiRouter.get('/admin/products', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const products = db.getProducts({ includeArchived: true });
  res.json(products);
});

// Create Product (Strict Rule: Administrator explicitly adds authentic products)
apiRouter.post(
  '/admin/products',
  requireRole('super_admin', 'product_manager'),
  (req: AuthenticatedRequest, res: Response) => {
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

      if (!sku || !nameEn || !nameBn || !categoryId || !brandId || typeof sellingPrice !== 'number') {
        return res.status(400).json({ error: 'Please provide SKU, English & Bengali names, Category, Brand, and Selling Price.' });
      }

      const product = db.createProduct(
        {
          sku,
          nameEn,
          nameBn,
          slug: slug || '',
          categoryId,
          brandId,
          costPrice: Number(costPrice) || 0,
          sellingPrice: Number(sellingPrice),
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
          stockQuantity: Number(stockQuantity) || 0,
          lowStockThreshold: Number(lowStockThreshold) || 3,
          isArchived: false,
          isFeatured: Boolean(isFeatured),
          warranty: warranty || '',
          returnPolicy: returnPolicy || '',
          descriptionEn: sanitizeHtml(descriptionEn || descriptionBn || ''),
          descriptionBn: sanitizeHtml(descriptionBn || descriptionEn || ''),
          specifications: Array.isArray(specifications) ? specifications : [],
          images: Array.isArray(images) && images.length > 0 ? images : []
        },
        req.user!
      );

      res.status(201).json({ product, message: 'Product successfully added to catalog.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Edit Product
apiRouter.put(
  '/admin/products/:id',
  requireRole('super_admin', 'product_manager'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const updateData = { ...req.body };
      if (typeof updateData.descriptionEn === 'string') {
        updateData.descriptionEn = sanitizeHtml(updateData.descriptionEn);
      }
      if (typeof updateData.descriptionBn === 'string') {
        updateData.descriptionBn = sanitizeHtml(updateData.descriptionBn);
      }
      const updated = db.updateProduct(req.params.id, updateData, req.user!);
      res.json({ product: updated, message: 'Product updated.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Delete/Archive Product
apiRouter.delete(
  '/admin/products/:id',
  requireRole('super_admin'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const deleted = db.deleteProduct(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Product not found' });
      res.json({ message: 'Product deleted successfully.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Toggle Product Archive Status
apiRouter.put(
  '/admin/products/:id/archive',
  requireRole('super_admin', 'product_manager'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const product = db.toggleProductArchive(req.params.id);
      res.json({ product, message: `Product is now ${product.isArchived ? 'archived' : 'active'}` });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Inventory Stock Adjustment (with required reason & audit log)
apiRouter.post(
  '/admin/inventory/adjust',
  requireRole('super_admin', 'inventory_manager'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { productId, changeType, quantity, reason } = req.body;
      if (!productId || !changeType || typeof quantity !== 'number' || !reason) {
        return res.status(400).json({ error: 'Product ID, change type, quantity, and a documented reason are required.' });
      }

      const result = db.adjustStock(productId, changeType, quantity, reason, req.user!);
      res.json({ message: 'Inventory adjusted successfully.', ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Inventory Audit Logs
apiRouter.get('/admin/inventory/logs', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getInventoryLogs());
});

// Admin Orders
apiRouter.get('/admin/orders', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status, search } = req.query;
  const orders = db.getOrders({
    status: status as OrderStatus,
    search: search as string
  });
  res.json(orders);
});

// Admin Update Order Status & Courier Info
apiRouter.put(
  '/admin/orders/:id/status',
  requireRole('super_admin', 'order_manager'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, note, trackingNumber, courierName } = req.body;
      if (!status) return res.status(400).json({ error: 'Status is required' });

      const updated = db.updateOrderStatus(
        req.params.id,
        status,
        req.user!,
        note,
        trackingNumber,
        courierName
      );
      res.json({ order: updated, message: 'Order status updated' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Admin Verify Payment
apiRouter.put(
  '/admin/orders/:id/payment',
  requireRole('super_admin', 'order_manager'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { paymentStatus } = req.body;
      if (!paymentStatus) return res.status(400).json({ error: 'paymentStatus is required' });

      const updated = db.updatePaymentStatus(req.params.id, paymentStatus, req.user!);
      res.json({ order: updated, message: 'Payment status updated' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Admin Category Management
apiRouter.get('/admin/categories', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getAllCategoriesAdmin());
});

apiRouter.post(
  '/admin/categories',
  requireRole('super_admin', 'product_manager'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { nameEn, nameBn, slug, icon, displayOrder, isActive } = req.body;
      if (!nameEn || !nameBn) return res.status(400).json({ error: 'Category names required' });
      const cat = db.createCategory({
        nameEn,
        nameBn,
        slug: slug || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: icon || 'Folder',
        displayOrder: Number(displayOrder) || 1,
        isActive: isActive !== false
      });
      res.status(201).json(cat);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

apiRouter.delete(
  '/admin/categories/:id',
  requireRole('super_admin', 'product_manager'),
  (req: AuthenticatedRequest, res: Response) => {
    const deleted = db.deleteCategory(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  }
);

// Admin Brand Management
apiRouter.post(
  '/admin/brands',
  requireRole('super_admin', 'product_manager'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, slug } = req.body;
      if (!name) return res.status(400).json({ error: 'Brand name required' });
      const brand = db.createBrand({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      });
      res.status(201).json(brand);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

apiRouter.delete(
  '/admin/brands/:id',
  requireRole('super_admin', 'product_manager'),
  (req: AuthenticatedRequest, res: Response) => {
    const deleted = db.deleteBrand(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Brand not found' });
    res.json({ message: 'Brand deleted' });
  }
);

// Admin Coupon Management
apiRouter.get('/admin/coupons', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getAllCoupons());
});

apiRouter.post(
  '/admin/coupons',
  requireRole('super_admin', 'product_manager'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { code, discountType, discountValue, minOrderAmount, maxDiscount, expiryDate } = req.body;
      if (!code || !discountValue || !expiryDate) {
        return res.status(400).json({ error: 'Code, discount value, and expiry date required' });
      }
      const coupon = db.createCoupon({
        code,
        discountType: discountType || 'fixed',
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        expiryDate,
        isActive: true
      });
      res.status(201).json(coupon);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

apiRouter.put(
  '/admin/coupons/:id/toggle',
  requireRole('super_admin', 'product_manager'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const coupon = db.toggleCouponStatus(req.params.id);
      res.json(coupon);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

apiRouter.delete(
  '/admin/coupons/:id',
  requireRole('super_admin', 'product_manager'),
  (req: AuthenticatedRequest, res: Response) => {
    const deleted = db.deleteCoupon(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ message: 'Coupon deleted' });
  }
);

// Admin Staff Management (Only Super Admin / Owner)
apiRouter.get('/admin/staff', requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getAllStaff());
});

apiRouter.post('/admin/staff', requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, role, password } = req.body;
    if (!name || !email || !role || !password || password.length < 8) {
      return res.status(400).json({ error: 'All fields and password (min 8 chars) required' });
    }
    const staff = db.createStaffMember({ name, email, phone: phone || '', role, password });
    res.status(201).json(staff);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Admin Review Moderation
apiRouter.get('/admin/reviews', requireRole('super_admin', 'customer_support'), (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getAllReviewsAdmin());
});

apiRouter.put(
  '/admin/reviews/:id',
  requireRole('super_admin', 'customer_support'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status } = req.body;
      const review = db.updateReviewStatus(req.params.id, status);
      res.json(review);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Admin Support Messages
apiRouter.get('/admin/support', requireRole('super_admin', 'customer_support'), (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSupportMessages());
});

apiRouter.put(
  '/admin/support/:id/reply',
  requireRole('super_admin', 'customer_support'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { replyText } = req.body;
      if (!replyText) return res.status(400).json({ error: 'Reply text required' });
      const msg = db.replySupportMessage(req.params.id, replyText);
      res.json(msg);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Admin Store Settings Update
apiRouter.put('/admin/settings', requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Admin Export Database Backup
apiRouter.get('/admin/backup', requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getRawDatabaseBackup());
});
