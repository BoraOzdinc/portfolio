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
    slug: "melsashopp-dashboard",
    title: "MelsaShopp Dashboard",
    description:
      "Operations dashboard for small Bambu-based 3D print businesses",
    longDescription:
      "MelsaShopp Dashboard brings the day-to-day workflow of a small print farm into one system. Teams can manage products and variants, create customer orders, map print files to sellable outputs, plan batches from real demand and stock gaps, monitor Bambu printers with live status and AMS visibility, and move finished orders through packing and shipping. The result is a clearer path from incoming order to shipped package, with less guesswork and fewer disconnected tools.",
    tags: [
      "Next.js 15",
      "TypeScript",
      "tRPC v11",
      "Drizzle ORM",
      "PostgreSQL",
      "MQTT",
      "AWS S3",
      "Better Auth",
      "Tailwind CSS",
    ],
    image: assetUrl("melsashopp/1.png"),
    link: "",
    features: [
      "Product and variant catalog with pricing estimator, SKU generation, stock tracking, and print-file bindings",
      "Customer and order management with status-based queues, search and filtering, and bulk internal label printing",
      "Demand-driven production planning that surfaces stock shortfalls, open order demand, and suggested batch targets",
      "Batch management with linked orders, printer assignments, AMS tray mapping, print-job review, and yield entry",
      "Live Bambu printer fleet dashboard with camera feeds, telemetry, incidents, AMS and external spool visibility, and print controls",
      "Scanner-based packing and shipping workstation for moving orders from packing to label creation to carrier handoff",
      "BasitKargo shipment creation with status syncing, label handling, and customer and product sync",
      "Sticker designer with live preview, reusable templates, PDF output, and direct label printing",
    ],
    role: "Designed and built the dashboard end to end, shaping the workflow from catalog and order intake through production planning, printer operations, packing, and shipping.",
    screenshots: [
      {
        image: assetUrl("melsashopp/1.png"),
        title: "Dashboard Overview",
        description:
          "The main dashboard brings the core operational picture into one frame, with attention items, order flow, production state, printer alerts, recent activity, and quick actions visible at once. It is the clearest single-screen summary of the product as an operations hub.",
      },
      {
        image: assetUrl("melsashopp/2.png"),
        title: "Orders Queue",
        description:
          "The orders view organizes day-to-day work into a clear queue with search, filters, status markers, customer details, and fast access to the next action. It gives the team a practical overview of what is waiting, what is moving, and what needs attention first.",
      },
      {
        image: assetUrl("melsashopp/2.png"),
        title: "New Order Flow",
        description:
          "The order creation flow shows that the dashboard handles intake as well as tracking. Customer selection, product and variant picking, quantities, pricing, notes, and live totals all come together in one guided workflow.",
      },
      {
        image: assetUrl("melsashopp/3.png"),
        title: "Product Detail and Print Setup",
        description:
          "Product detail ties the commercial catalog to production reality. Variants, pricing inputs, stock context, and print-file mappings live together so sellable outputs stay connected to the exact files and settings the team needs to produce them.",
      },
      {
        image: assetUrl("melsashopp/5.png"),
        title: "Production Planning",
        description:
          "Planning surfaces open demand, stock gaps, in-production quantities, and the next recommended batches to run. Instead of guessing what to print next, the team can build around real shortages and outstanding order demand.",
      },
      {
        title: "Batch Detail",
        description:
          "Batch detail is the execution layer between planning and printer output. It brings together target quantities, linked orders, assigned machines, tray mapping, review steps, and yield tracking so operators can manage a run from setup through completion.",
      },
      {
        image: assetUrl("melsashopp/4.png"),
        title: "Printer Fleet and Controls",
        description:
          "This combined view communicates both monitoring and control. Operators can see live printer status, progress, cameras, AMS context, and incidents, while also understanding that print setup and machine actions happen from the same operational surface.",
      },
      {
        title: "Packing and Shipping Workstation",
        description:
          "The workstation closes the loop from production to fulfillment. With scanner-driven order handling, packing actions, shipment creation, and label output in one flow, the team can move finished orders to carrier handoff without bouncing between tools.",
      },
      {
        title: "Sticker Designer",
        description:
          "The sticker designer adds a reusable labeling tool with live preview, template controls, PDF output, and print actions. It is a strong supporting capability even though it sits outside the core order-to-production workflow.",
      },
    ],
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
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
