export const BLOG_STARTERS = [
  {
    "slug": "klaviyo-abandoned-checkout-flow-guide",
    "title": "How to create an abandoned checkout flow in Klaviyo",
    "description": "A practical checklist for configuring and testing checkout reminders before going live.",
    "category": "Email marketing",
    "service": "abandoned-checkout-flow",
    "body": "Start with the correct event\nAn abandoned checkout flow is intended for people who begin checkout but do not place an order. Confirm your store integration records the checkout-started event in Klaviyo before building the automation. Adding to cart is a different event and can require a separate flow.\n\nBuild the flow\nOpen Flows, create a new flow, and choose the checkout-started metric available in your integration. Add a profile filter that excludes anyone who places an order after entering the flow. Check your store's existing reminder automation to avoid overlapping messages.\n\nPlan the messages\nChoose a delay appropriate to your purchase cycle. A first reminder can focus on the items the shopper left behind, and a later message can answer common buying questions. Avoid claiming a discount unless it is actually available. Use the dynamic checkout details supported by your integration, and preview with a relevant event.\n\nTest before launch\nKeep messages in draft or manual mode while you inspect the trigger, filters, product details and checkout links. Test on mobile and review consent requirements. Once approved, activate the flow and monitor skipped recipients, delivery and conversions.\n\nWhat to measure\nLook at the number of eligible checkout events, delivery, clicks and orders attributed to the flow. Attribution is not proof that every attributed order was caused by the email. Compare performance over a meaningful period before making changes.",
    "source": "https://help.klaviyo.com/hc/en-us/articles/115002779411"
  },
  {
    "slug": "klaviyo-welcome-flow-guide",
    "title": "How to create a welcome email flow in Klaviyo",
    "description": "Plan a subscriber welcome sequence with the right trigger, brand content and testing.",
    "category": "Email marketing",
    "service": "klaviyo-welcome-flow",
    "body": "Choose the signup source\nIdentify the list that receives new subscribers from your approved forms. Make sure the form and list use the consent settings appropriate to your audience. Do not assume every contact in an imported list has opted in.\n\nCreate the sequence\nIn Flows, create a list-triggered welcome flow for the selected list. Plan the first email around delivering the promise made at signup. For later emails, introduce useful product information, brand context and a clear next step. Set delays that suit the expected purchase journey.\n\nDesign for the inbox\nUse a recognizable sender, concise subject line and a clear primary call to action. Preview the email on mobile, check text contrast, and include a functioning unsubscribe link. If you offer a discount, confirm its terms and destination.\n\nReview filters and test\nReview how the flow handles existing subscribers, customer segments and other automations. Send tests and use a consenting test profile to check the actual flow behavior before switching messages live.\n\nImprove after launch\nTrack delivery, clicks and relevant conversion events. Review the sequence when the signup promise, product range or brand messaging changes. A welcome flow is not a one-time replacement for a wider retention strategy.",
    "source": "https://help.klaviyo.com/hc/en-us/articles/115002775172"
  },
  {
    "slug": "shopify-store-conversion-checklist",
    "title": "Why your Shopify store gets visitors but few sales",
    "description": "A practical storefront review checklist for product discovery, mobile usability and checkout.",
    "category": "Ecommerce",
    "service": "website-conversion-audit",
    "body": "Start with the numbers you have\nTraffic without orders can have several causes. Compare sessions, product views, add-to-cart events, checkout starts and orders. Make sure the measurement is configured correctly before drawing conclusions. Break results down by device and traffic source where possible.\n\nCheck the product page\nCan a visitor understand what the product does, the price, available variants, delivery expectations and return conditions? Put key details near the purchase decision. Use accurate photos and readable descriptions, and check the add-to-cart button on a real phone.\n\nWalk through the customer journey\nStart from the landing page and navigate as a first-time shopper. Check the search and collection menus, product selection, cart totals and checkout handoff. Unexpected costs or missing information deserve investigation, but do not assume they are the only cause of abandonment.\n\nPrioritize changes\nRecord each problem with a screenshot or a reproducible step. Fix broken actions first, then address confusing information and layout. Test changes on a duplicate theme where appropriate, and keep a record of what changed.\n\nEvaluate results\nCompare relevant measures after a reasonable observation period. Avoid changing several major variables at once when you need to understand the effect of a change. Low traffic may make short-term results inconclusive.",
    "source": ""
  }
];
