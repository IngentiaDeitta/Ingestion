export interface HerramientaComplementaria {
  id: string;
  nombre: string;
  categoria: string;
  que_es: string;
  cuando_usar: string;
  tipo: 'complementaria' | 'n8n_template';
  tags?: string[];
  link?: string;
}

export const COMPLEMENTARY_TOOLS: HerramientaComplementaria[] = [
  {
    id: 'mcpmarket',
    nombre: 'MCP Market',
    categoria: 'Agentes y MCPs',
    que_es: 'Un marketplace y repositorio de Model Context Protocol (MCP) servers que puedes usar para expandir las capacidades de los agentes de IA.',
    cuando_usar: 'Cuando necesites integrar a un agente de IA con herramientas externas (GitHub, Postgres, Slack, Supabase) de forma rápida usando el estándar MCP.',
    tipo: 'complementaria',
    tags: ['mcp', 'agents', 'ai', 'integration'],
    link: 'https://mcpmarket.com'
  },
  {
    id: 'skills_sh',
    nombre: 'skills.sh',
    categoria: 'Agentes y MCPs',
    que_es: 'Plataforma para buscar, crear y compartir skills de agentes. Proporciona instrucciones empaquetadas (SKILL.md) que guían a los agentes a resolver tareas complejas.',
    cuando_usar: 'Cuando quieras enseñar a un agente un flujo de trabajo específico (ej. SEO, desarrollo de interfaces, uso de bases de datos científicas) instalando una skill curada.',
    tipo: 'complementaria',
    tags: ['skills', 'agents', 'workflow', 'prompting'],
    link: 'https://skills.sh'
  },
  {
    id: 'apify',
    nombre: 'Apify',
    categoria: 'Web Scraping & Automatización',
    que_es: 'Plataforma para web scraping y extracción de datos. Cuenta con cientos de "Actores" (scripts listos) para scrapear Instagram, LinkedIn, Google Maps, y más.',
    cuando_usar: 'Cuando necesites extraer datos a gran escala de sitios web, monitorear precios, o alimentar un sistema de IA con información pública.',
    tipo: 'complementaria',
    tags: ['scraping', 'data-extraction', 'actors', 'automation'],
    link: 'https://apify.com'
  },
  {
    id: 'n8n_tpl_0',
    nombre: 'Daily AI digest of unread emails to Telegram (Italian)',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'Sends a morning Telegram digest of unread Gmail messages, prioritized by urgency with AI. Nodes and setup notes in Italian, ideal for Italian-speaking teams.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_1',
    nombre: 'Auto-label incoming Gmail messages with AI nodes',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'Automatically labels incoming Gmail messages using AI. The workflow retrieves message content, suggests labels like Partnership or Inquiry, and assigns them for better organization.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_2',
    nombre: 'Basic Automatic Gmail Email Labelling with OpenAI and Gmail API',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'Uses OpenAI and Gmail API to trigger on new emails, analyze content, and assign or create labels automatically. Helps categorize emails efficiently using AI.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_3',
    nombre: 'Compose reply draft in Gmail with OpenAI Assistant',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'Generates draft replies in Gmail using OpenAI. Triggers on new emails, extracts content, and creates a suggested reply draft to streamline responses.',
    cuando_usar: 'Ideal para automatizaciones en el área de Executive.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Executive', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_4',
    nombre: 'Analyze & Sort Suspicious Email Contents with ChatGPT',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'Analyzes suspicious emails using ChatGPT, classifies them, and can generate screenshots for review. Helps identify and sort potentially dangerous emails.',
    cuando_usar: 'Ideal para automatizaciones en el área de Security.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Security', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_5',
    nombre: 'Analyze Suspicious Email Contents with ChatGPT Vision',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'Uses both text and image analysis (ChatGPT Vision) to evaluate suspicious emails. Extracts screenshots, analyzes headers and content, and flags phishing attempts.',
    cuando_usar: 'Ideal para automatizaciones en el área de Security.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Security', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_6',
    nombre: 'A Very Simple \"Human in the Loop\" Email Response System Using AI and IMAP',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'Implements a simple workflow for human-in-the-loop email responses. Uses IMAP to fetch emails, summarizes content with AI, and drafts professional replies for review before sending.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_7',
    nombre: 'Auto Categorise Outlook Emails with AI',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'Automatically categorizes Outlook emails using AI models. Moves messages to folders and assigns categories based on content, reducing manual sorting.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_8',
    nombre: 'Microsoft Outlook AI Email Assistant with contact support from Monday and Airtable',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'An AI-powered assistant for Outlook that processes emails, sanitizes content, and assigns categories using rules from Airtable. Integrates with Monday.com for contact support.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_9',
    nombre: '📈 Receive Daily Market News from FT.com to your Microsoft outlook inbox',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'Extracts financial news from FT.com and delivers daily updates to your Outlook inbox. Automates content extraction and email delivery for timely market insights.',
    cuando_usar: 'Ideal para automatizaciones en el área de Executive.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Executive', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_10',
    nombre: 'AI Email Auto-Responder with Ollama',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'Classifies incoming emails, filters spam, and drafts context-aware replies using Ollama local AI. No external API keys required.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_11',
    nombre: 'InboxZero Lite - AI Email Classifier',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'AI classifies Gmail emails as urgent, important, info, or spam using OpenAI gpt-4o-mini. Lightweight single-workflow setup with Google Sheets logging.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_12',
    nombre: 'LeadPilot Lite - AI Cold Email Writer',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'AI writes personalized cold emails from a Google Sheets lead list using OpenAI. Generates subject lines and body text tailored to each prospect.',
    cuando_usar: 'Ideal para automatizaciones en el área de Sales.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Sales', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_13',
    nombre: 'Daily Email Notification',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'Summarizes daily inbox emails using local LLM (Ollama) and sends notifications via Telegram or ntfy.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_14',
    nombre: 'Website-Grounded Cold Email Writer',
    categoria: 'Plantilla n8n: Gmail & Email Automation',
    que_es: 'Fetches each lead\'s real website, extracts the page text, and writes a personalized cold email grounded only in that content. Flags thin or broken sites for human review instead of inventing facts.',
    cuando_usar: 'Ideal para automatizaciones en el área de Sales.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Sales', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_15',
    nombre: 'RSS Keyword Alert to Telegram',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Polls RSS feeds and sends a Telegram alert only when an entry matches a keyword you choose, with duplicate-entry protection.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_16',
    nombre: 'Agentic Telegram AI bot with LangChain nodes and new tools',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'An advanced Telegram bot leveraging LangChain and OpenAI for conversational AI. Supports memory, dynamic tool use, and handles incoming events for rich, context-aware chat interactions.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_17',
    nombre: 'AI-Powered Children\'s Arabic Storytelling on Telegram',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'A Telegram bot that uses OpenAI to generate and narrate children\'s stories in Arabic, making storytelling interactive and educational for young users.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_18',
    nombre: 'AI-Powered Children\'s English Storytelling on Telegram with OpenAI',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Creates and tells children\'s stories in English using OpenAI to engage young audiences in an interactive way.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_19',
    nombre: 'Automated AI image analysis and response via Telegram',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Lets users send images to Telegram and receive AI-based analysis and feedback automatically.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_20',
    nombre: 'Angie, Personal AI Assistant with Telegram Voice and Text',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Personal voice & text assistant bot that answers queries, manages tasks, and interacts naturally using AI.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_21',
    nombre: 'Chat with OpenAI\'s GPT via a simple Telegram Bot',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'A minimal Telegram bot that forwards user messages to GPT and returns AI-generated replies. Ideal starting point for AI chat.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_22',
    nombre: 'Internship Informer',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Extracts and parses internship postings from Telegram channels using AI, scrapes application pages via Firecrawl, filters for eligibility, and sends alerts to WhatsApp.',
    cuando_usar: 'Ideal para automatizaciones en el área de HR/Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'HR/Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_23',
    nombre: 'Resume Bot',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'An AI-powered resume and cover letter assistant on Telegram that parses PDF resumes, updates user profiles in Supabase, and compiles tailored LaTeX resumes via SSH.',
    cuando_usar: 'Ideal para automatizaciones en el área de HR/Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'HR/Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_24',
    nombre: 'Telegram AI bot assistant: ready-made template for voice & text messages',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Ready-made assistant bot handling both voice and text input, leveraging AI for smart conversational responses in Telegram.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_25',
    nombre: 'Telegram AI Bot: NeurochainAI Text & Image',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Integrates NeurochainAI API for text and image generation inside Telegram, enabling creative media interactions.',
    cuando_usar: 'Ideal para automatizaciones en el área de Marketing.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Marketing', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_26',
    nombre: 'Telegram AI bot with LangChain nodes',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Uses LangChain nodes for advanced AI conversations and tool use in Telegram.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_27',
    nombre: 'Telegram AI Chatbot',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'A general-purpose AI chatbot template for Telegram that can be customized for various use cases.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_28',
    nombre: 'Telegram Bot with Supabase memory and OpenAI assistant integration',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Adds long-term memory with Supabase to a Telegram bot, coupled with OpenAI for rich, context-aware conversations.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_29',
    nombre: 'Telegram AI Support Bot with Conversation Memory',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Turns a Telegram bot into an AI support assistant with per-customer conversation memory and multilingual replies; works with OpenAI or local models via Ollama.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_30',
    nombre: 'Telegram chat with PDF',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Allows users to upload a PDF to Telegram and chat with its contents using AI-powered summarization and Q&A.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_31',
    nombre: '🤖 Telegram Messaging Agent for Text_Audio_Images',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Multi-modal agent that processes text, audio, and images in Telegram chats using AI for responses.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_32',
    nombre: 'Telegram to Spotify with OpenAI',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Lets users request songs or playlists in Telegram and automatically create them in Spotify via OpenAI.',
    cuando_usar: 'Ideal para automatizaciones en el área de Marketing.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Marketing', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_33',
    nombre: 'Send a random recipe once a day to Telegram',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Scheduled workflow that fetches a random recipe daily and posts it to a Telegram chat.',
    cuando_usar: 'Ideal para automatizaciones en el área de Marketing.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Marketing', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_34',
    nombre: 'Detect toxic language in Telegram messages',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Monitors Telegram chats and flags messages containing toxic language using AI moderation.',
    cuando_usar: 'Ideal para automatizaciones en el área de Security.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Security', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_35',
    nombre: 'Translate Telegram audio messages with AI (55 supported languages)',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Receives voice messages, transcribes them, and sends back translations in over 50 languages.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_36',
    nombre: 'Bitcoin price alert to Telegram with CoinPaprika',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'Polls the keyless CoinPaprika API on a schedule and sends a Telegram alert when Bitcoin moves 5% or more in 24h. No API key or signup required; swap the coin id to track any asset.',
    cuando_usar: 'Ideal para automatizaciones en el área de Finance.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Finance', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_37',
    nombre: 'Empower Your AI Chatbot with Long-Term Memory and Dynamic Tool Routing',
    categoria: 'Plantilla n8n: Telegram',
    que_es: 'External workflow enhancing an AI chatbot with long-term memory and dynamic tool routing capabilities.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_38',
    nombre: 'Website leads to Google Sheets with Telegram alert and auto-reply (Italian)',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Captures website form leads via webhook, appends them to Google Sheets, alerts the owner on Telegram and sends a courtesy reply to the lead. Docs in Italian.',
    cuando_usar: 'Ideal para automatizaciones en el área de Sales.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Sales', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_39',
    nombre: 'Automatic payment reminders from Google Sheets (Italian)',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Checks an invoices sheet every weekday morning and emails polite payment reminders for invoices due within 3 days or overdue. Docs in Italian.',
    cuando_usar: 'Ideal para automatizaciones en el área de Finance.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Finance', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_40',
    nombre: 'Automated End-to-End Fine-Tuning of OpenAI Models with Google Drive Integration',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Automates the fine-tuning of OpenAI models by integrating with Google Drive for data input and output, streamlining custom AI model training.',
    cuando_usar: 'Ideal para automatizaciones en el área de Engineering.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Engineering', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_41',
    nombre: 'Automatic Background Removal for Images in Google Drive',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Automatically removes backgrounds from images stored in Google Drive, preparing them for various uses like product catalogs or marketing materials.',
    cuando_usar: 'Ideal para automatizaciones en el área de Marketing.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Marketing', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_42',
    nombre: 'Build an OpenAI Assistant with Google Drive Integration',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Demonstrates building an OpenAI Assistant that accesses and utilizes files in Google Drive, enabling it to answer questions or perform tasks based on document content.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_43',
    nombre: 'RAG Chatbot for Company Documents using Google Drive and Gemini',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Creates a Retrieval-Augmented Generation (RAG) chatbot that answers questions based on company documents stored in Google Drive, leveraging Google Gemini.',
    cuando_usar: 'Ideal para automatizaciones en el área de Support.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Support', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_44',
    nombre: 'RAG_Context-Aware Chunking: Google Drive to Pinecone via OpenRouter & Gemini',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Implements context-aware chunking for Google Drive documents, sending them to Pinecone for vector storage and using OpenRouter & Gemini for advanced RAG.',
    cuando_usar: 'Ideal para automatizaciones en el área de Engineering.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Engineering', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_45',
    nombre: 'Summarize the New Documents from Google Drive and Save Summary in Google Sheet',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Monitors Google Drive for new documents, summarizes their content using AI, and saves these summaries into a Google Sheet for quick overview and analysis.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_46',
    nombre: 'Upload to Instagram and Tiktok from Google Drive',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Automates uploading media from Google Drive directly to Instagram and TikTok, streamlining social media content publishing.',
    cuando_usar: 'Ideal para automatizaciones en el área de Marketing.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Marketing', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_47',
    nombre: 'Author and Publish Blog Posts From Google Sheets',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Enables authoring blog posts in Google Sheets and automatically publishing them to a content management system, simplifying content creation and publishing.',
    cuando_usar: 'Ideal para automatizaciones en el área de Marketing.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Marketing', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_48',
    nombre: 'Chat with a Google Sheet using AI',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Allows users to interact with and query data within a Google Sheet using natural language via an AI model, making data analysis more accessible.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_49',
    nombre: 'Chat with your event schedule from Google Sheets in Telegram',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Connects a Google Sheet containing an event schedule to Telegram, allowing users to query their schedule through a Telegram bot.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_50',
    nombre: 'Qualify new leads in Google Sheets via OpenAI\'s GPT-4',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Uses OpenAI\'s GPT-4 to analyze and qualify new leads entered into a Google Sheet, helping sales teams prioritize their outreach.',
    cuando_usar: 'Ideal para automatizaciones en el área de Sales.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Sales', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_51',
    nombre: 'Screen Applicants With AI, notify HR and save them in a Google Sheet',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Automates the screening of job applicants using AI, notifies HR of qualified candidates, and saves applicant data into a Google Sheet.',
    cuando_usar: 'Ideal para automatizaciones en el área de HR.',
    tipo: 'n8n_template',
    tags: ['n8n', 'HR', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_52',
    nombre: 'Summarize Google Sheets form feedback via OpenAI\'s GPT-4',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Summarizes feedback collected through Google Forms and stored in Google Sheets using OpenAI\'s GPT-4, providing quick insights from survey responses.',
    cuando_usar: 'Ideal para automatizaciones en el área de Marketing.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Marketing', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_53',
    nombre: 'Airtable to Google Sheets Auto-Sync',
    categoria: 'Plantilla n8n: Google Drive & Sheets',
    que_es: 'Automates bidirectional sync between Airtable and Google Sheets using n8n. Searches Airtable for recently updated records and upserts them into Google Sheets.',
    cuando_usar: 'Ideal para automatizaciones en el área de Ops.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Ops', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_54',
    nombre: 'Auto-Categorize blog posts in wordpress using A.I.',
    categoria: 'Plantilla n8n: WordPress',
    que_es: 'This workflow automates the categorization of WordPress blog posts using AI, streamlining content organization and management.',
    cuando_usar: 'Ideal para automatizaciones en el área de Marketing/Content.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Marketing/Content', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_55',
    nombre: 'Auto-Tag Blog Posts in WordPress with AI',
    categoria: 'Plantilla n8n: WordPress',
    que_es: 'This workflow automatically tags WordPress blog posts using AI, improving SEO and content discoverability.',
    cuando_usar: 'Ideal para automatizaciones en el área de Marketing/Content.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Marketing/Content', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_56',
    nombre: 'Automate Blog Creation in Brand Voice with AI',
    categoria: 'Plantilla n8n: WordPress',
    que_es: 'This workflow automates the creation of blog posts, ensuring they adhere to a specific brand voice using AI.',
    cuando_usar: 'Ideal para automatizaciones en el área de Marketing/Content.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Marketing/Content', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_57',
    nombre: 'Automate Content Generator for WordPress with DeepSeek R1',
    categoria: 'Plantilla n8n: WordPress',
    que_es: 'This workflow automates content generation for WordPress using the DeepSeek R1 AI model, enabling rapid content creation.',
    cuando_usar: 'Ideal para automatizaciones en el área de Marketing/Content.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Marketing/Content', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
  {
    id: 'n8n_tpl_58',
    nombre: 'WordPress - AI Chatbot to enhance user experience - with Supabase and OpenAI',
    categoria: 'Plantilla n8n: WordPress',
    que_es: 'This workflow integrates an AI chatbot into WordPress using Supabase and OpenAI to enhance user experience by providing intelligent interactions.',
    cuando_usar: 'Ideal para automatizaciones en el área de Customer Support/Marketing.',
    tipo: 'n8n_template',
    tags: ['n8n', 'Customer Support/Marketing', 'automation'],
    link: 'https://github.com/enescingoz/awesome-n8n-templates'
  },
];
