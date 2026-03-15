lets connect the db, i have created the MONGODB_URI in .env

lets use this 
backend/
├── src/
│   ├── config/
│   │   ├── env.ts                 # Environment variables validation
│   │   ├── db.ts                   # Database connection (MongoDB/PostgreSQL)
│   │   ├── redis.ts                # Redis connection for caching
│   │   ├── socket.ts               # Socket.IO configuration
│   │   └── logger.ts               # Winston logger configuration
│   │
│   ├── types/
│   │   ├── index.ts                # Global type definitions
│   │   ├── user.types.ts           # User-related types
│   │   ├── product.types.ts        # Product-related types
│   │   ├── sale.types.ts           # Sale-related types
│   │   ├── tenant.types.ts         # Tenant-related types
│   │   └── api.types.ts            # API request/response types
│   │
│   ├── constants/
│   │   ├── roles.ts                # User roles constants
│   │   ├── permissions.ts          # Permission constants
│   │   ├── status.ts               # Order/Product status
│   │   ├── tax.ts                   # Tax-related constants
│   │   └── errors.ts                # Error messages and codes
│   │
│   ├── models/
│   │   ├── Tenant.ts
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── Category.ts              # Product categories
│   │   ├── Sale.ts
│   │   ├── SaleItem.ts              # Individual sale items
│   │   ├── Purchase.ts
│   │   ├── PurchaseItem.ts          # Individual purchase items
│   │   ├── TaxRule.ts
│   │   ├── Customer.ts              # Customer management
│   │   ├── Supplier.ts              # Supplier management
│   │   ├── Inventory.ts             # Inventory tracking
│   │   ├── Payment.ts               # Payment transactions
│   │   ├── AuditLog.ts              # Audit logging
│   │   └── Notification.ts          # System notifications
│   │
│   ├── middleware/
│   │   ├── authMiddleware.ts        # JWT authentication
│   │   ├── tenantMiddleware.ts      # Multi-tenant isolation
│   │   ├── roleMiddleware.ts        # Role-based access
│   │   ├── permissionMiddleware.ts  # Permission-based access
│   │   ├── validationMiddleware.ts  # Request validation
│   │   ├── rateLimiter.ts           # Rate limiting
│   │   ├── cacheMiddleware.ts       # Response caching
│   │   ├── auditMiddleware.ts       # Audit logging
│   │   ├── uploadMiddleware.ts      # File upload handling
│   │   └── errorHandler.ts
│   │
│   ├── validators/
│   │   ├── auth.validator.ts        # Login/register validation
│   │   ├── product.validator.ts     # Product CRUD validation
│   │   ├── sale.validator.ts        # Sale validation
│   │   ├── purchase.validator.ts    # Purchase validation
│   │   ├── user.validator.ts        # User management validation
│   │   └── report.validator.ts      # Report query validation
│   │
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── dashboardController.ts
│   │   ├── productController.ts
│   │   ├── categoryController.ts
│   │   ├── posController.ts
│   │   ├── salesController.ts
│   │   ├── purchaseController.ts
│   │   ├── taxController.ts
│   │   ├── reportController.ts
│   │   ├── customerController.ts
│   │   ├── supplierController.ts
│   │   ├── inventoryController.ts
│   │   ├── userController.ts
│   │   ├── tenantController.ts
│   │   ├── notificationController.ts
│   │   └── auditController.ts
│   │
│   ├── routes/
│   │   ├── v1/                      # API versioning
│   │   │   ├── authRoutes.ts
│   │   │   ├── dashboardRoutes.ts
│   │   │   ├── productRoutes.ts
│   │   │   ├── categoryRoutes.ts
│   │   │   ├── posRoutes.ts
│   │   │   ├── salesRoutes.ts
│   │   │   ├── purchaseRoutes.ts
│   │   │   ├── taxRoutes.ts
│   │   │   ├── reportRoutes.ts
│   │   │   ├── customerRoutes.ts
│   │   │   ├── supplierRoutes.ts
│   │   │   ├── inventoryRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   ├── tenantRoutes.ts
│   │   │   ├── notificationRoutes.ts
│   │   │   └── auditRoutes.ts
│   │   └── index.ts                  # Route aggregator
│   │
│   ├── services/
│   │   ├── authService.ts
│   │   ├── tenantService.ts
│   │   ├── userService.ts
│   │   ├── productService.ts
│   │   ├── categoryService.ts
│   │   ├── saleService.ts
│   │   ├── purchaseService.ts
│   │   ├── taxService.ts
│   │   ├── reportService.ts
│   │   ├── dashboardService.ts
│   │   ├── customerService.ts
│   │   ├── supplierService.ts
│   │   ├── inventoryService.ts
│   │   ├── notificationService.ts
│   │   ├── auditService.ts
│   │   ├── emailService.ts           # Email notifications
│   │   ├── smsService.ts             # SMS notifications
│   │   ├── exportService.ts          # Data export (PDF/Excel)
│   │   ├── cacheService.ts            # Redis caching logic
│   │   ├── queueService.ts            # Bull/Redis queue
│   │   └── socketEvents.ts
│   │
│   ├── workers/
│   │   ├── emailWorker.ts            # Background email processing
│   │   ├── reportWorker.ts            # Report generation worker
│   │   ├── backupWorker.ts            # Database backup worker
│   │   ├── notificationWorker.ts      # Push notification worker
│   │   └── index.ts                   # Worker orchestrator
│   │
│   ├── events/
│   │   ├── handlers/
│   │   │   ├── sale.handler.ts        # Sale event handlers
│   │   │   ├── inventory.handler.ts   # Inventory event handlers
│   │   │   ├── user.handler.ts        # User event handlers
│   │   │   └── notification.handler.ts # Notification event handlers
│   │   ├── listeners/
│   │   │   ├── sale.listener.ts
│   │   │   ├── inventory.listener.ts
│   │   │   └── user.listener.ts
│   │   └── emitter.ts                 # Event emitter setup
│   │
│   ├── utils/
│   │   ├── jwt.ts                      # JWT utilities
│   │   ├── password.ts                  # Password hashing
│   │   ├── pagination.ts                # Pagination helpers
│   │   ├── dateRange.ts                 # Date range utilities
│   │   ├── response.ts                  # Standard API response
│   │   ├── logger.ts                    # Logging utility
│   │   ├── encryption.ts                # Data encryption
│   │   ├── fileUpload.ts                # File handling
│   │   ├── currency.ts                  # Currency formatting
│   │   ├── calculator.ts                # Tax/price calculations
│   │   ├── helpers.ts                   # General helpers
│   │   └── constants.ts
│   │
│   ├── templates/
│   │   ├── emails/
│   │   │   ├── welcome.html
│   │   │   ├── invoice.html
│   │   │   ├── receipt.html
│   │   │   └── report.html
│   │   └── reports/
│   │       ├── sales-report.pdf
│   │       └── inventory-report.pdf
│   │
│   ├── app.ts
│   └── server.ts
│

├── logs/
│   ├── error.log
│   ├── combined.log
│   └── audit.log
│
├── uploads/                             # User uploaded files
│   ├── products/
│   ├── invoices/
│   └── profiles/
│
├── .env.example
├── .env.test
├── .gitignore
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
├── .editorconfig
├── nodemon.json
└── README.md


| Model        | Key refs                       | Notes                            |
| ------------ | ------------------------------ | -------------------------------- |
| Tenant       | –                              | Root org entity                  |
| User         | tenant                         | Role, status                     |
| Category     | tenant                         | Product grouping                 |
| Product      | tenant, category, taxRule      | SKU, pricing                     |
| Customer     | tenant                         | POS customers                    |
| Supplier     | tenant                         | Vendors                          |
| TaxRule      | tenant                         | Per-tenant tax config            |
| Sale         | tenant, customer, user         | Sale header                      |
| SaleItem     | tenant, sale, product          | Line items                       |
| Purchase     | tenant, supplier, user         | Purchase header                  |
| PurchaseItem | tenant, purchase, product      | Purchase lines                   |
| Inventory    | tenant, product                | Stock snapshot per product       |
| Payment      | tenant, sale                   | Payment records                  |
| AuditLog     | tenant, user, entity, entityId | Audit trail                      |
| Notification | tenant, user                   | User-facing/system notifications |