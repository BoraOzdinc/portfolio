export interface Screenshot {
  image?: string;
  title: string;
  description: string;
}

export interface Project {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  tags: string[];
  image: string;
  link: string;
  features: string[];
  role: string;
  screenshots?: Screenshot[];
}

const projectImageModules = import.meta.glob("../assets/**/*", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function assetUrl(path: string): string {
  const imageUrl = projectImageModules[`../assets/${path}`];

  if (!imageUrl) {
    throw new Error(`Missing project asset: ${path}`);
  }

  return imageUrl;
}

export const projects: Project[] = [
  {
    slug: "melsashopp-dashboard",
    title: "MelsaShopp",
    description:
      "E-commerce store and operations dashboard for 3D printers, filament, and spare parts",
    longDescription:
      "MelsaShopp started as an internal dashboard for tracking orders, customers, and shipments, and grew into a live e-commerce business. Today one Next.js app runs both the public storefront at melsashopp.com and the operator dashboard behind it. Customers browse the catalog, check out as guests or with an account, pay through PayTR, and follow, cancel, or return their orders on their own. Operators handle fulfillment, BasitKargo shipping labels, returns and refunds, and official GİB e-Arşiv invoices from the same panel, while scheduled jobs reconcile payments, sync cargo status, and deliver e-mail in the background.",
    tags: [
      "Next.js 15",
      "React 19",
      "TypeScript",
      "tRPC v11",
      "Drizzle ORM",
      "PostgreSQL",
      "Better Auth",
      "PayTR",
      "GİB e-Arşiv",
      "BasitKargo",
      "Resend",
      "Redis",
      "Sentry",
      "Tailwind CSS",
    ],
    image: assetUrl("melsashopp/storefront.png"),
    link: "https://melsashopp.com",
    features: [
      "Public storefront with categories, collections, typo-tolerant search, variant picking, wishlist, and verified reviews",
      "Guest and account checkout with PayTR iFrame payments, where an order is only created once the signed payment callback confirms the money",
      "Payment reconciliation and refund jobs that recover dropped payment forms and never turn collected money into a rejected order",
      "GİB e-Arşiv invoicing with an hourly queue and batch signing, where one SMS code approves every pending invoice",
      "BasitKargo shipping with label creation, idempotent retries, status syncing, and return labels",
      "Item-level returns and self-service cancellations, with inspection, suggested refunds, and stock and ledger updates",
      "Transactional e-mail through a Resend outbox with idempotent retries and delivery webhooks",
      "CI deploys to a VPS with database backups, migrations tested on a copy first, health checks, and cron monitoring",
    ],
    role: "Designed, built, and run the whole product, from the storefront and checkout to the payment, invoicing, and cargo integrations, the operator dashboard, and the deployment pipeline behind them.",
    screenshots: [
      {
        image: assetUrl("melsashopp/search.png"),
        title: "Search and Filters",
        description:
          "Typo-tolerant search runs across product names, brands, and stock codes, with category, brand, price, and spec filters alongside. Prices include VAT, and materials like PLA and PETG are listed first by default, since they are what most customers come for.",
      },
      {
        image: assetUrl("melsashopp/product.png"),
        title: "Product Detail",
        description:
          "Each product page shows its gallery, variants with live stock status, stock codes, reviews, and Markdown descriptions. Picking a variant updates the price and availability right away.",
      },
      {
        image: assetUrl("melsashopp/cart-drawer.png"),
        title: "Add to Cart",
        description:
          "Adding a product opens a cart drawer instead of leaving the page, so customers can keep browsing or go straight to payment. Prices are checked again on the server before payment, so a stale page never sets the price.",
      },
      {
        image: assetUrl("melsashopp/checkout.png"),
        title: "Payment-First Checkout",
        description:
          "Guests and signed-in customers share one checkout. Submitting it only holds stock and campaign budget for the session, and the order is created once PayTR's signed callback confirms the payment. If anything goes wrong after the money is collected, the order is flagged for an operator instead of being rejected, and regression tests guard that rule.",
      },
      {
        image: assetUrl("melsashopp/dash-overview.png"),
        title: "Dashboard Overview",
        description:
          "The operator dashboard opens on what needs doing today: active orders, payments still to collect, parcels waiting for a shipping label, and the most recent orders, with shortcuts into each queue.",
      },
      {
        image: assetUrl("melsashopp/dash-orders.png"),
        title: "Order Queues",
        description:
          "Orders are split into work queues such as action needed, ready to ship, label printed, awaiting payment, and returns. Selecting an order opens a side panel with its next step, so operators can work through a queue without leaving the list.",
      },
      {
        image: assetUrl("melsashopp/dash-order-detail.png"),
        title: "Order Detail",
        description:
          "Each order shows its progress from payment to delivery, the items with VAT and discounts, every PayTR payment attempt with its reference, and a timeline of what happened when. Customer details are blurred here for privacy.",
      },
      {
        image: assetUrl("melsashopp/dash-order-return.png"),
        title: "Returns and Refunds",
        description:
          "Customers can cancel an order or return specific items from their account. A return moves through request, approval, pickup, inspection, and refund. Inspection records the stock decision and a suggested refund amount, and the refund itself goes back to the card through PayTR.",
      },
      {
        image: assetUrl("melsashopp/dash-invoices.png"),
        title: "Invoices with One SMS Code",
        description:
          "Order invoices wait in a queue until the parcel is handed to the carrier. An admin requests a single SMS code that creates and signs every pending invoice on the GİB portal, unfinished drafts are cleaned up automatically, and invoices that miss the legal seven-day window are never signed.",
      },
      {
        image: assetUrl("melsashopp/dash-product-edit.png"),
        title: "Product Editor",
        description:
          "Products are set up in four steps: product type, variants and pricing, specs, and store publishing. The product type decides how cost is calculated, and a live summary flags what is still missing before a product can go on sale.",
      },
      {
        image: assetUrl("melsashopp/dash-store-health.png"),
        title: "Store Readiness Check",
        description:
          "Before taking orders, a checklist confirms that products are published, all legal documents are live, and payments, shipping, and invoicing are configured, with a link to fix each item that is still missing.",
      },
    ],
  },
  {
    slug: "arcura",
    title: "Arcura",
    description:
      "Dental surgical planning platform for orthodontists and oral surgeons",
    longDescription:
      "A specialized case management platform where dental professionals submit patient data - DICOM scans, intraoral scans, and clinical photos - and receive precision surgical plans, 3D-printable surgical guides, and video analysis reports. The platform handles the full lifecycle of a clinical case, from submission through admin review, pricing, payment confirmation, and final delivery of planning artifacts.",
    tags: [
      "Next.js 15",
      "React 19",
      "TypeScript",
      "tRPC",
      "Drizzle ORM",
      "PostgreSQL",
      "AWS S3",
    ],
    image: assetUrl("arcura/1.png"),
    link: "https://arcuradigital.com",
    features: [
      "7-step guided case submission wizard with per-step validation and file uploads up to 10 GB via S3 multipart uploads",
      "Guest case tracking via unique tracking codes with OTP-based email verification",
      "Admin dashboard with tabbed case detail view, status workflow management, and per-case chat",
      "Secure file delivery with server-authenticated, time-limited presigned download URLs",
      "Role-based access control with public, protected, and admin procedure tiers via tRPC",
      "VIP clinic invitation system with expiring onboarding links and Better Auth integration",
      "Full audit trail recording every case status transition with timestamps and actors",
    ],
    role: "Designed and implemented the entire platform end to end - database schema, tRPC API layer, file upload and download infrastructure, authentication flows, admin dashboard, case submission wizard, and public tracking interface.",
    screenshots: [
      {
        image: assetUrl("arcura/2.png"),
        title: "Case Submission Wizard",
        description:
          "A guided, multi-step form that walks dental professionals through creating a new case. Each step collects specific information - patient details, treatment preferences, and clinical files - with inline validation so errors are caught before moving forward. Large files like DICOM scans and intraoral STL models are uploaded directly to cloud storage using chunked multipart uploads, keeping the experience smooth even for files up to 10 GB.",
      },
      {
        image: assetUrl("arcura/3.png"),
        title: "Guest Case Tracking",
        description:
          "Clinics that submit cases without creating an account receive a unique tracking code. Entering the code and verifying ownership via a one-time email passcode reveals a read-only status page showing the current phase of the case, any messages from the planning team, and download links once deliverables are ready. This flow removes the need for guest users to manage credentials while still protecting case data.",
      },
      {
        image: assetUrl("arcura/4.png"),
        title: "Admin Dashboard - Case List",
        description:
          "The internal operations view gives administrators a filterable, sortable overview of every submitted case. Each row surfaces key details - clinic name, submission date, current status, and assigned priority - so the team can triage work at a glance. Status badges use color coding to highlight cases that need attention.",
      },
      {
        image: assetUrl("arcura/5.png"),
        title: "Admin Case Detail - Tabbed View",
        description:
          "Drilling into a single case opens a tabbed interface that organizes all case-related information: submitted files, treatment parameters, pricing and payment status, status history, and a per-case chat thread. Administrators can advance the case through its workflow stages, attach deliverables, and communicate with the submitting clinic from one screen without losing context.",
      },
    ],
  },
  {
    slug: "inventory-ark",
    title: "Inventory Ark",
    description:
      "Organization-based inventory and order operations dashboard for e-commerce teams",
    longDescription:
      "Inventory Ark is a web app for running day-to-day commerce operations inside a shared organization workspace. Teams can create and organize products with barcodes, pricing, VAT, images, and category-specific attributes; track stock across multiple storages; keep customer records with shipping and billing addresses; create manual orders; and build packaged sell orders tied to specific customers and addresses. After an order is created, staff can move each package through fulfillment states such as created, picking, shipped, delivered, and returned, including cargo provider and tracking details. The platform also includes role-based team management, invitation handling, and secure sign-in with magic codes or passkeys.",
    tags: [
      "React",
      "TanStack Router",
      "TanStack Start",
      "tRPC",
      "Drizzle ORM",
      "libSQL/Turso",
      "AWS (SST v3)",
      "OpenAuth.js",
      "Tailwind CSS",
      "Zustand",
      "Recharts",
      "dnd-kit",
      "Framer Motion",
    ],
    image: assetUrl("invark/1.png"),
    link: "https://inventoryark.com",
    features: [
      "Organization workspaces with member invites, notifications, and role-based permissions",
      "Product catalog with categories, custom attributes, barcodes, pricing, VAT, and image galleries",
      "Multi-storage stock visibility and stock allocation by storage",
      "Customer records with contact info, saved addresses, and pay/debt balance tracking",
      "Package-based sell order creation with customer and address selection",
      "Fulfillment workflow for picking, shipping, delivery, returns, and package status history",
      "Manual order entry with a cart-style interface for fast staff-created orders",
      "Magic-code and passkey authentication, plus a customer-facing order tracking page",
    ],
    role: "Built the platform end to end, covering the organization-based data model, product and stock flows, customer and packaged order operations, role and invite management, passwordless authentication, and the React frontend on top of a tRPC + Drizzle stack.",
  },
  {
    slug: "aslident-dental-clinic",
    title: "Aslident Dental Clinic",
    description: "A modern, responsive website for a dental clinic",
    longDescription:
      "A comprehensive website built for Aslident Dental Clinic, featuring a modern design with responsive layouts that work seamlessly across all devices. The site showcases the clinic's services, team, and facilities with an emphasis on user experience and accessibility.",
    tags: ["Vite", "AWS S3", "React", "Responsive"],
    image: assetUrl("aslident.png"),
    link: "https://aslident.com.tr",
    features: [
      "Fully responsive design optimized for mobile, tablet, and desktop",
      "Fast loading with Vite build optimization",
      "Deployed on AWS S3 with CloudFront CDN",
      "SEO-optimized structure and metadata",
    ],
    role: "Led the frontend development, translating design mockups into a fully functional and responsive website. Handled deployment and hosting configuration on AWS.",
  },
  {
    slug: "data-crispy",
    title: "Data Crispy",
    description:
      "AI-powered chat platform for querying and visualizing business data",
    longDescription:
      "An AI-powered data analytics SaaS that lets teams query their business data through natural language chat. Users connect data sources via Fivetran, then ask Crispy - the AI assistant - questions in plain English. Crispy resolves the right tables using vector search, generates and executes BigQuery SQL, and returns results as interactive charts rendered inline in the chat. The platform includes subscription tiers via Polar, persistent chat history, and support for multiple data source connectors.",
    tags: [
      "Next.js 15",
      "TypeScript",
      "tRPC v11",
      "Drizzle ORM",
      "PostgreSQL",
      "Google AI (Gemini)",
      "Vercel AI SDK",
      "LangChain",
      "BigQuery",
      "Fivetran",
      "Polar",
      "Chart.js",
      "Recharts",
      "Tailwind CSS",
    ],
    image: assetUrl("datacrispy/1.png"),
    link: "",
    features: [
      "Crispy AI chat interface - ask questions in plain English and receive SQL-powered answers with inline chart responses",
      "Automatic chart rendering - bar, line, pie, and table outputs chosen based on query result shape",
      "Semantic table search using vector embeddings to identify the right BigQuery tables for each question",
      "BigQuery SQL generation, execution, and result streaming via Vercel AI SDK",
      "Fivetran data connector integration - sync data from 300+ sources into the user's warehouse",
      "Subscription tiers with usage limits managed via Polar",
      "Persistent chat history with session management and query replay",
      "Multi-workspace support with per-workspace data source and schema configuration",
    ],
    role: "Built the full-stack platform - tRPC API, BigQuery integration, vector search pipeline, AI chat orchestration with LangChain and Gemini, chart rendering layer, Fivetran connector setup, and the Next.js frontend.",
    screenshots: [
      {
        image: assetUrl("datacrispy/1.png"),
        title: "AI Chat Interface",
        description:
          "The main chat view presents a conversation thread where users type questions in plain English. Crispy responds with a combination of explanatory text and rendered chart components - bar charts, line graphs, pie charts, or data tables - depending on the shape of the query result. Each response shows the underlying SQL so users can understand and verify what was run.",
      },
      {
        image: assetUrl("datacrispy/2.png"),
        title: "Chart & Data Visualizations",
        description:
          "Chart responses are interactive - users can hover for tooltips, toggle series, and expand to full-screen. The rendering layer selects the most appropriate chart type based on the result schema: time-series data becomes a line chart, categorical comparisons become bar charts, and proportion data becomes pie or donut charts. Raw tabular results are also available as a fallback.",
      },
      {
        image: assetUrl("datacrispy/3.png"),
        title: "Fivetran Data Connectors",
        description:
          "Users connect their data sources through a Fivetran integration panel that lists available connectors across CRMs, databases, ad platforms, and SaaS tools. Once a connector is set up and syncing, its tables become available to Crispy for querying. Sync status, last run time, and schema previews are surfaced directly in the dashboard.",
      },
    ],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
