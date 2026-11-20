export const DEFAULT_SETTINGS = {
  site_name: "Mubest Digital",
  logo_url: "/assets/mubest-digital-logo.svg",
  favicon_url: "/assets/favicon.svg",
  about_image_url: "",
  contact_email: "",
  phone: "",
  whatsapp: "",
  location: "Working with businesses worldwide",
  seo_title: "Mubest Digital — Digital work that moves business forward",
  seo_description: "Mubest Digital helps businesses build better websites, improve customer journeys and create digital work that moves them forward.",
  social_instagram: "",
  social_linkedin: "",
  social_facebook: "",
  social_tiktok: "",
  color_ink: "#17191f",
  color_blue: "#4563f5",
  color_lime: "#b9e769",
  color_paper: "#f5f3ee",
  font_heading: "Manrope",
  font_body: "Inter",
  layout_sections: {},
  hero_video_enabled: true,
  hero_video_url: "",
  hero_poster_url: "",
  availability_enabled: false,
  availability_text: "Available for select new projects",
  show_home_services: true,
  show_home_work: true,
  show_home_process: true,
  show_home_about: true,
  show_home_faq: true,
  show_home_testimonials: true,
  show_home_cta: true,
  nav_home_label: "Home",
  nav_about_label: "About",
  nav_services_label: "Services",
  nav_portfolio_label: "Portfolio",
  nav_contact_label: "Contact",
  header_cta_label: "Start a project",
  header_cta_url: "/contact/",
  announcement_enabled: false,
  announcement_text: "",
  announcement_link_label: "Learn more",
  announcement_url: "/contact/",
  footer_tagline: "Digital work, thoughtfully brought to life. Websites, marketing and creative support for businesses ready to move forward.",
  footer_note: "Built with intention. Designed for what’s next.",
  footer_cta_label: "Tell me about your project",
  seo_image_url: ""
};

export const DEFAULT_PAGES = {
  home: {
    hero_kicker: "Independent digital creative partner",
    hero_title: "Digital work that moves your business forward.",
    hero_description: "From websites and ecommerce experiences to email marketing and creative content, I help businesses turn good ideas into digital work that works.",
    hero_primary_label: "Explore my work",
    hero_primary_url: "/portfolio/",
    hero_secondary_label: "Let's talk about your project",
    hero_secondary_url: "/contact/",
    intro_eyebrow: "A thoughtful digital partner",
    intro_heading: "Good work starts with a clear idea.",
    intro_copy_1: "Every business has a different next step. Sometimes it is a better website. Sometimes it is a smarter email journey, a more useful online store or content that gives people a reason to pay attention.",
    intro_copy_2: "Mubest Digital brings those skills together, so you can move from scattered tasks to a more considered digital experience.",
    services_eyebrow: "What I can help with",
    services_heading: "Different skills. One connected experience.",
    services_description: "Practical digital support across the places where customers discover, experience and remember your business.",
    portfolio_eyebrow: "Selected work",
    portfolio_heading: "Built with purpose. Made to be experienced.",
    portfolio_description: "A look at selected ecommerce and digital experience projects. Each project starts with understanding what the business needs to make easier.",
    process_eyebrow: "A straightforward process",
    process_heading: "Let's make the next step clear.",
    process_description: "Good collaboration should feel organized from the first conversation to the final handover.",
    about_eyebrow: "The person behind the work",
    about_heading: "One point of contact. A wider set of digital skills.",
    about_description: "I'm Mubest. I work across websites, ecommerce, email marketing and creative production, bringing practical thinking and careful execution to each project.",
    cta_eyebrow: "Your next step starts here",
    cta_heading: "Have something good in mind?",
    cta_button: "Let's talk about it"
  },
  about: {
    hero_eyebrow: "A little about Mubest",
    hero_title: "Good digital work is a mix of clear thinking and careful making.",
    hero_description: "I'm Mubest, an independent digital creative professional helping businesses improve how they show up, connect with customers and move ideas forward.",
    intro_eyebrow: "The thinking behind the work",
    intro_heading: "Make the digital side of your business work better.",
    intro_copy_1: "I'm interested in the details that shape a customer's experience: the first page they land on, the product they consider, the email they receive and the content that helps them understand what a business offers.",
    intro_copy_2: "That is why my work spans website design, ecommerce, email marketing, video editing, publishing support and advertising. These are different disciplines, but they often meet around one shared goal: making it easier for a business to communicate value and serve its customers.",
    intro_copy_3: "I approach each project by understanding what needs to change, choosing a practical direction and paying attention to the details that make the final work useful.",
    values_eyebrow: "How I approach projects",
    values_heading: "Thoughtful work. Without the unnecessary noise.",
    values_description: "Clear communication and a considered process help keep the work focused from the first conversation to delivery."
  },
  services: {
    hero_eyebrow: "Services",
    hero_title: "Digital support for the work that matters.",
    hero_description: "Choose a focused service or bring a few connected needs together. We will shape the scope around your business and the outcome you want.",
    section_eyebrow: "What I can help with",
    section_heading: "Find the support that fits your next step.",
    section_description: "Each service starts with understanding what you need and agreeing on the work before delivery."
  },
  portfolio: {
    hero_eyebrow: "Portfolio",
    hero_title: "Selected work, built around real business needs.",
    hero_description: "A selection of ecommerce and digital experience projects. The work is varied, but the focus stays the same: make the experience clearer, more useful and easier to move through.",
    section_eyebrow: "A selection of projects",
    section_heading: "Different businesses. Different digital challenges.",
    section_description: "Explore the live projects below. For a deeper discussion of scope, process and related work, get in touch."
  },
  contact: {
    hero_eyebrow: "Contact",
    hero_title: "Tell me what you're looking to make happen.",
    hero_description: "Share a little about your business, the project and what you would like to improve. We can take it from there.",
    section_eyebrow: "Start a conversation",
    section_heading: "Good projects begin with a clear conversation.",
    section_description: "You do not need to have every detail figured out. A short overview of what you need is enough to start discussing the right approach."
  }
};

export const DEFAULT_SERVICES = [
  { slug:"websites", title:"Website design & development", summary:"Thoughtful websites, landing pages and ecommerce experiences designed to look clear and work smoothly.", description:"Build or improve a website that makes your offer easier to understand and your customer journey easier to follow. From service websites and landing pages to ecommerce storefronts.", tag:"Websites · Shopify · Landing pages", icon:"website", deliverables:["Website design and redesign","Shopify and ecommerce storefronts","Landing pages and conversion-focused layouts","Website updates and UX improvements"], sort_order:1, status:"published" },
  { slug:"email", title:"Klaviyo email marketing", summary:"Campaigns and automated flows that welcome customers, build relationships and support repeat sales.", description:"Give your email channel a clear structure, from the first welcome message to campaigns that keep customers connected to your brand.", tag:"Klaviyo · Email flows · Campaigns", icon:"email", deliverables:["Klaviyo account and list setup","Welcome, abandoned cart and post-purchase flows","Email campaign design and setup","Segmentation and performance improvements"], sort_order:2, status:"published" },
  { slug:"video", title:"Video editing & content creation", summary:"Engaging short-form videos, promotional edits and content shaped for the platform and audience.", description:"Turn raw footage and ideas into clear, engaging content for your brand, products and social channels.", tag:"Short-form video · Promotional content", icon:"video", deliverables:["Reels, TikToks and YouTube Shorts","Promotional and product videos","Social media content editing","Captions, pacing and platform formatting"], sort_order:3, status:"published" },
  { slug:"ecommerce", title:"Ecommerce & Etsy support", summary:"Store setup, product listings, customer journeys and practical improvements for online selling.", description:"Improve the way your products are presented and managed across online selling platforms, with practical support for setup and store operations.", tag:"Ecommerce · Etsy · Product listings", icon:"ecommerce", deliverables:["Etsy shop setup and optimization","Product listing creation and improvement","Shopify store support","Product, inventory and store workflow improvements"], sort_order:4, status:"published" },
  { slug:"publishing", title:"Book editing & publishing support", summary:"Editorial and production support to help authors prepare clearer, more polished books.", description:"Support authors through the editorial and production details that help a manuscript become a more polished book.", tag:"Editing · Proofreading · Book formatting", icon:"book", deliverables:["Manuscript editing and proofreading","Book and ebook formatting","KDP and IngramSpark preparation","Indexing and publishing setup support"], sort_order:5, status:"published" },
  { slug:"ads", title:"Ads & campaign management", summary:"Campaign planning, setup and optimization focused on reaching the right people and learning what works.", description:"Plan and manage paid campaigns with attention to the audience, offer, creative and performance signals that guide the next decision.", tag:"Paid campaigns · Optimization", icon:"ads", deliverables:["Campaign setup and structure","Audience and creative coordination","Campaign monitoring and optimization","Performance review and next-step recommendations"], sort_order:6, status:"published" }
];

export const DEFAULT_PORTFOLIO = [
  { slug:"hobbry", title:"Hobbry", category:"Shopify · Storefront design", excerpt:"A considered ecommerce storefront experience.", description:"Shopify storefront design and presentation.", project_url:"https://hobbry.com/", cover_image:"", gallery:[], featured:true, sort_order:1, status:"published" },
  { slug:"berrymae", title:"Berrymae", category:"Shopify · Storefront design", excerpt:"A clean, customer-friendly online store.", description:"Shopify storefront design and customer experience.", project_url:"https://berrymae.com/", cover_image:"", gallery:[], featured:true, sort_order:2, status:"published" },
  { slug:"arteescorp", title:"Arteescorp", category:"Ecommerce · Product customization", excerpt:"A product-personalization experience for ecommerce.", description:"An ecommerce product-customization experience.", project_url:"https://arteescorp.com/", cover_image:"", gallery:[], featured:true, sort_order:3, status:"published" }
];

export const DEFAULT_FAQS = [
  { question:"Can I hire you for just one service?", answer:"Yes. You can engage Mubest Digital for a single project or a specific service. We will agree on the scope and deliverables before work begins.", sort_order:1, status:"published" },
  { question:"Do you work with businesses in different industries?", answer:"Yes. The right approach depends on your audience, platform and goals. Share a little about your business and we can discuss what makes sense.", sort_order:2, status:"published" },
  { question:"How do we get started?", answer:"Send a project enquiry with a short description of what you need. I will review it and we can discuss the best next step.", sort_order:3, status:"published" }
];
