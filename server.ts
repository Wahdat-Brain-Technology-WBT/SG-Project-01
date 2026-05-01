import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import sequelize, { Product, Customer, Order, OrderItem, Ledger, User, Employee, Production, Attendance } from "./src/models.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GoogleGenAI, Type } from "@google/genai";

const JWT_SECRET = process.env.JWT_SECRET || "sheen-ghazy-secret-key-2026";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Global Timeout Middleware (30 seconds)
  app.use((req, res, next) => {
    res.setTimeout(30000, () => {
      console.warn(`[TIMEOUT] Request timed out: ${req.method} ${req.url}`);
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request Timeout' });
      }
    });
    next();
  });

  // Sync Database
  console.log('[DATABASE] Attempting to connect...');
  try {
    await sequelize.authenticate();
    console.log(`[DATABASE] Connected successfully. Dialect: ${sequelize.getDialect()}`);

    console.log('[DATABASE] Syncing schema...');
    await sequelize.sync({ alter: true });
    console.log('[DATABASE] Synced successfully.');

    // Seed initial products if empty
    const productCount = await Product.count();
    if (productCount === 0) {
      console.log('[DATABASE] Seeding initial products...');
      await Product.bulkCreate([
        { name: "نل شیران یزد", category: "ساده", size: "20", qty_per_carton: 50, current_price: 95, stock_quantity: 1000 },
        { name: "نل شیران یزد", category: "ساده", size: "25", qty_per_carton: 30, current_price: 128, stock_quantity: 1000 },
        { name: "نل شیران یزد", category: "ساده", size: "32", qty_per_carton: 20, current_price: 200, stock_quantity: 1000 },
        { name: "نل شیران یزد", category: "ساده", size: "40", qty_per_carton: 13, current_price: 310, stock_quantity: 1000 },
        { name: "نل اس پی جی", category: "ساده", size: "25", qty_per_carton: 30, current_price: 145, stock_quantity: 1000 },
        { name: "نل اس پی جی", category: "ساده", size: "32", qty_per_carton: 20, current_price: 230, stock_quantity: 1000 },
        { name: "سامی ساده یزد", category: "ساده", size: "25", qty_per_carton: 500, current_price: 5, stock_quantity: 5000 },
        { name: "سامی ساده یزد", category: "ساده", size: "32", qty_per_carton: 300, current_price: 7, stock_quantity: 5000 },
        { name: "زانو خم ساده یزد", category: "ساده", size: "25", qty_per_carton: 300, current_price: 6, stock_quantity: 5000 },
        { name: "زانو خم ساده یزد", category: "ساده", size: "32", qty_per_carton: 180, current_price: 11, stock_quantity: 5000 },
        { name: "سه راه ساده یزد", category: "ساده", size: "25", qty_per_carton: 200, current_price: 7, stock_quantity: 5000 },
        { name: "سه راه ساده یزد", category: "ساده", size: "32", qty_per_carton: 150, current_price: 12, stock_quantity: 5000 },
        { name: "زانو خم چوری دار یزد", category: "چوری دار", size: "25x1/2", qty_per_carton: 200, current_price: 25, stock_quantity: 2000 },
        { name: "زانو خم چوری دار یزد", category: "چوری دار", size: "25x3/4", qty_per_carton: 120, current_price: 45, stock_quantity: 2000 },
        { name: "سامی داخل چوری یزد", category: "چوری دار", size: "25x1/2", qty_per_carton: 250, current_price: 25, stock_quantity: 2000 },
        { name: "سامی بیرون چوری یزد", category: "چوری دار", size: "25x1/2", qty_per_carton: 250, current_price: 27, stock_quantity: 2000 },
        { name: "وال چرخی یزد", category: "چوری دار", size: "25", qty_per_carton: 60, current_price: 140, stock_quantity: 1000 },
      ]);
      console.log('[DATABASE] Seeded initial products.');
    }

    const userCount = await User.count();
    if (userCount === 0) {
      console.log('[DATABASE] Seeding admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password_hash: hashedPassword,
        role: 'CEO_SUPERADMIN'
      });
      console.log('[DATABASE] Seeded admin user.');
    }
  } catch (error: any) {
    console.error('[DATABASE] Initialization error:', error.message);
  }

  // Auth Middleware
  function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: "No token provided" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  }

  // --- API ROUTES WITH ERROR HANDLING ---

  app.get("/api/db-status", authenticateToken, async (req, res) => {
    try {
      await sequelize.authenticate();
      res.json({
        status: 'connected',
        dialect: sequelize.getDialect(),
        database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'
      });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user: any = await User.findOne({ where: { username } });
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است" });
      }
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
      res.json({ token, role: user.role });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products", authenticateToken, async (req, res) => {
    try {
      const products = await Product.findAll({ order: [['createdAt', 'DESC']] });
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/products", authenticateToken, async (req, res) => {
    try {
      console.log('[PRODUCTS] Creating product:', req.body);
      const product = await Product.create(req.body);
      res.json(product);
    } catch (error: any) {
      console.error('[PRODUCTS] Create error:', error.message);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ error: "محصول یافت نشد" });
      await product.update(req.body);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ error: "محصول یافت نشد" });
      await product.destroy();
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const orders = await Order.findAll({ include: [Customer, OrderItem] });
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders/:id/confirm", authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const order: any = await Order.findByPk(req.params.id, { include: [OrderItem], transaction });
      if (!order) throw new Error("سفارش یافت نشد");
      if (order.status !== 'PENDING') throw new Error("سفارش قبلاً تایید شده است");

      for (const item of order.OrderItems) {
        const product: any = await Product.findByPk(item.ProductId, { transaction });
        if (!product) throw new Error(`محصول ${item.ProductId} یافت نشد`);
        if (product.stock_quantity < item.quantity) {
          throw new Error(`موجودی ناکافی برای محصول ${product.name}`);
        }
        await product.decrement('stock_quantity', { by: item.quantity, transaction });
      }

      order.status = 'COMPLETED';
      await order.save({ transaction });

      await Ledger.create({
        type: 'INCOME',
        department: 'GENERAL',
        amount: order.total_amount,
        description: `فروش سفارش #${order.id}`,
        date: new Date(),
        order_id: order.id
      }, { transaction });

      const customer: any = await Customer.findByPk(order.CustomerId, { transaction });
      if (customer) {
        await customer.increment('total_spent', { by: order.total_amount, transaction });
      }

      await transaction.commit();
      res.json(order);
    } catch (error: any) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/orders/direct", authenticateToken, async (req, res) => {
    const { CustomerId, items } = req.body;
    const transaction = await sequelize.transaction();
    try {
      const order: any = await Order.create({
        CustomerId,
        status: 'COMPLETED',
        total_amount: 0
      }, { transaction });

      let totalAmount = 0;
      for (const item of items) {
        const product: any = await Product.findByPk(item.ProductId, { transaction });
        if (!product) throw new Error(`محصول ${item.ProductId} یافت نشد`);
        if (product.stock_quantity < item.quantity) {
          throw new Error(`موجودی ناکافی برای ${product.name}`);
        }
        await product.decrement('stock_quantity', { by: item.quantity, transaction });
        await OrderItem.create({
          OrderId: order.id,
          ProductId: product.id,
          quantity: item.quantity,
          unit_price: item.unit_price || product.current_price
        }, { transaction });
        totalAmount += (item.unit_price || product.current_price) * item.quantity;
      }
      order.total_amount = totalAmount;
      await order.save({ transaction });
      await Ledger.create({
        type: 'INCOME',
        department: 'GENERAL',
        amount: totalAmount,
        description: `فروش مستقیم (فاکتور #${order.id})`,
        date: new Date(),
        order_id: order.id
      }, { transaction });
      const customer: any = await Customer.findByPk(CustomerId, { transaction });
      if (customer) {
        await customer.increment('total_spent', { by: totalAmount, transaction });
      }
      await transaction.commit();
      res.json({ success: true, orderId: order.id });
    } catch (error: any) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/ledger", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'CEO_SUPERADMIN') return res.sendStatus(403);
      const entries = await Ledger.findAll({ order: [['date', 'DESC']], limit: 200 });
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ledger", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'CEO_SUPERADMIN') return res.sendStatus(403);
    try {
      const entry = await Ledger.create({ ...req.body, date: new Date() });
      res.json(entry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/customers", authenticateToken, async (req, res) => {
    try {
      const customers = await Customer.findAll({ order: [['createdAt', 'DESC']] });
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/employees", authenticateToken, async (req: any, res) => {
    try {
      const employees = await Employee.findAll({ include: [Attendance] });
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/employees", authenticateToken, async (req: any, res) => {
    try {
      const employee = await Employee.create(req.body);
      res.json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  const getKabulTime = () => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kabul',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(new Date());
  };

  app.post("/api/attendance", authenticateToken, async (req: any, res) => {
    try {
      const { EmployeeId, status, date } = req.body;
      const time = getKabulTime();
      const [attendance, created] = await Attendance.findOrCreate({
        where: { EmployeeId, date },
        defaults: { status, time }
      });
      if (!created) {
        attendance.set('status', status);
        attendance.set('time', time);
        await attendance.save();
      }
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/attendance/quick", authenticateToken, async (req: any, res) => {
    try {
      const { date } = req.body;
      const time = getKabulTime();
      const employees = await Employee.findAll();
      for (const emp of employees) {
        const [attendance, created] = await Attendance.findOrCreate({
          where: { EmployeeId: (emp as any).id, date },
          defaults: { status: 'PRESENT', time }
        });
        if (!created && attendance.get('status') !== 'PRESENT') {
          attendance.set('status', 'PRESENT');
          attendance.set('time', time);
          await attendance.save();
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/production", authenticateToken, async (req, res) => {
    try {
      const production = await Production.findAll({ include: [Product], order: [['date', 'DESC']] });
      res.json(production);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/production", authenticateToken, async (req, res) => {
    try {
      const prod = await Production.create(req.body);
      const product = await Product.findByPk(req.body.ProductId);
      if (product) await product.increment('stock_quantity', { by: req.body.quantity_produced });
      res.json(prod);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/public/products", async (req, res) => {
    try {
      const products = await Product.findAll({ order: [['createdAt', 'DESC']] });
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/public/orders", async (req, res) => {
    const { fullName, whatsappNumber, address, items } = req.body;
    const transaction = await sequelize.transaction();
    try {
      let [customer]: any = await Customer.findOrCreate({
        where: { whatsapp_number: whatsappNumber },
        defaults: { full_name: fullName, address },
        transaction
      });
      let totalAmount = 0;
      const order: any = await Order.create({ CustomerId: customer.id, status: 'PENDING' }, { transaction });
      for (const item of items) {
        const product: any = await Product.findByPk(item.productId, { transaction });
        if (!product) throw new Error(`محصول ${item.productId} یافت نشد`);
        await OrderItem.create({ OrderId: order.id, ProductId: product.id, quantity: item.quantity, unit_price: product.current_price }, { transaction });
        totalAmount += product.current_price * item.quantity;
      }
      order.total_amount = totalAmount;
      await order.save({ transaction });
      await transaction.commit();
      res.json({ success: true, orderId: order.id });
    } catch (error: any) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  });

  // Mock /api/chat endpoint for the preview environment
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({ reply: "کلید دسترسی هوش مصنوعی تنظیم نشده است." });
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are the official Smart Sales Assistant for SHEEN GHAZY BABA PVC Piping Company.
Your default language is Dari, but you must reply in the language the user speaks (Dari, Pashto, or English).
Be polite, professional, and concise.`;

      let formattedHistory = [];
      if (history && Array.isArray(history)) {
        formattedHistory = history.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error('Chat error:', error);
      res.json({ reply: "متاسفانه برقراری ارتباط با چت هوشمند مقدور نیست (خطای سرور). لطفاً از طریق شماره تماس واتساپ با ما در ارتباط باشید." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
