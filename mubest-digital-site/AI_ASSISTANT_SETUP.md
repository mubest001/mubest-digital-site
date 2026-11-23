# Mubest Digital AI Assistant — setup and safety

## What this is
The website includes a secure, streaming conversational AI assistant built with the OpenAI **Responses API**. It answers naturally, maintains context within a chat session, and links visitors to relevant services, published portfolio projects, and the project enquiry page.

This **does not connect to the owner's private ChatGPT conversations, ChatGPT memory, Gmail, files, or other private accounts**.

## What the AI knows
The backend loads **published** website content from Neon on each request: public Home/About/Services/Portfolio/Contact page text, published services, published portfolio summaries and verified outcomes, and public FAQs. It also uses your approved public biography and additional facts from Content Studio. It does **not** read enquiry records, unpublished drafts, admin account records or private messages.

To teach the assistant additional professional details, sign in to **Content Studio → AI assistant** and update:
- Assistant name and welcome message.
- **About you:** professional biography, relevant credentials, services and working approach you want public.
- **Approved answers:** policies, process, frequently asked questions, or other public facts.

Only enter information you are comfortable sharing with site visitors. Changes save to Neon and are automatically included in subsequent assistant replies.

## Connecting OpenAI
1. Create an OpenAI API account at https://platform.openai.com and configure API billing. **ChatGPT subscriptions and API billing are separate.**
2. Create an API key at https://platform.openai.com/api-keys.
3. Open the **Mubest Digital Vercel project → Settings → Environment Variables**.
4. Add the secret key named exactly **`OPENAI_API_KEY`** to Production (and Preview if you want to test there). Never put this value in frontend JavaScript, Content Studio text fields, GitHub, or a chat message.
5. Redeploy production so the environment variable is included. The public chat launcher then becomes visible automatically when **AI assistant → Enable** is checked.
6. In Content Studio → AI assistant, click **Test AI response** after connecting the key. Test requests use billable API tokens.

Optional environment variable: **`OPENAI_ASSISTANT_MODEL`**, defaults to `gpt-6.1-terra`. Choose a model that is available to your OpenAI API project.

## Usage and privacy
- Chat history remains in the visitor's **browser session storage** so follow-up messages work across page navigations. The visitor can clear it with the new-chat icon.
- The backend sends the most recent user/assistant turns and published site context to OpenAI to produce replies. Requests use **`store:false`**. OpenAI's API data handling and abuse-monitoring policies may still apply.
- Chats are not recorded in the Neon CMS and do not create enquiries or bookings. Visitors are directed to the secure project form when they want to send project details.
- The backend rate-limits requests to **25 per hashed visitor per UTC day and 150 globally per UTC day**. Only short, keyed request counters are stored in Neon; no raw IP addresses or chat contents are stored by the assistant.
- The OpenAI key never leaves the Vercel server runtime.
- Site content is treated as reference material, not as instructions that can override the assistant's rules.
- Without a configured key, the widget stays **hidden** from visitors rather than showing fake answers or a broken experience.

## Manual smoke test after API key setup
1. Ask "What services do you offer?" and confirm the answer uses published services.
2. Ask "Which Shopify projects have you completed?" and follow the offered case-study links.
3. Ask "Tell me about Mubest" and verify the response uses **only** your public About page and approved biography.
4. Ask for a specific price or guaranteed result that isn't published. The assistant should avoid inventing it and suggest a tailored quote.
5. Ask a follow-up question; confirm that the conversation stays in context.
6. Navigate to another page within the same tab; confirm the session remains.
7. Clear chat; confirm the old conversation is gone.
8. Check desktop, tablet, and mobile widget presentation, keyboard operation and Escape-to-close.
9. In Content Studio → AI assistant, disable it and confirm the public launcher stops appearing.

## Known limitations
This is a purpose-built website assistant, **not the personal ChatGPT app**. It does not automatically import saved ChatGPT memory or conversation history. It doesn't browse the entire web, send messages, book meetings or read private user accounts. Its knowledge is limited to **published and explicitly approved information**.
