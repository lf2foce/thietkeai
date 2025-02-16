export interface AITool {
    id: string
    name: string
    category: string
    url: string
    imageUrl: string
    description: string
  }
  
  export interface ToolCategory {
    id: string
    name: string
    tools: AITool[]
  }
  
  export const aiTools: ToolCategory[] = [
    {
      id: "myapp",
      name: "We built",
      tools: [
        {
          id: "speak",
          name: "Translate book",
          category: "Automation",
          url: "https://speak.thietkeai.com",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Translate and Read the book"
        },
        {
          id: "doc",
          name: "Chat with document",
          category: "Automation",
          url: "https://doc.thietkeai.com",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Chat with document using RAG"
        },
        {
          id: "interior",
          name: "Interior Design",
          category: "Automation",
          url: "https://thietkeai.com",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Imagine the interior design"
        },
        {
          id: "ielts",
          name: "IELTS",
          category: "Automation",
          url: "https://ielts.thietkeai.com",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "IELTS writing evaluation"
        },
        {
          id: "translator",
          name: "Translator",
          category: "Automation",
          url: "https://speak.thietkeai.com/translate",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Translator for traveler"
        }
      ]
    },
    {
      id: "chatbot",
      name: "Chatbot",
      tools: [
        {
          id: "chatgpt",
          name: "ChatGPT",
          category: "Chatbot",
          url: "https://chat.openai.com",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Advanced language model chatbot"
        },
        {
          id: "gemini",
          name: "Gemini",
          category: "Chatbot",
          url: "https://gemini.google.com",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Google's multimodal AI model"
        },
        {
          id: "deepseek",
          name: "Deepseek",
          category: "Chatbot",
          url: "https://chat.deepseek.com/",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Deepseek"
        },
        {
          id: "perplexity",
          name: "Perplexity",
          category: "Chatbot",
          url: "https://www.perplexity.ai/",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "For research"
        }
      ]
    },
    {
      id: "code",
      name: "Developer",
      tools: [
        {
          id: "openai",
          name: "OpenAI platform",
          category: "Code",
          url: "https://platform.openai.com/docs/quickstart",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "OpenAI platform"
        },
        {
          id: "Neon",
          name: "Neon postgresql",
          category: "Code",
          url: "https://console.neon.tech/",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Neon Database for PostgreSQL"
        },
        {
          id: "nextjs",
          name: "Nextjs Github",
          category: "Code",
          url: "https://github.com/vercel/next.js",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Nextjs for frontend"
        },
        {
          id: "together",
          name: "Together",
          category: "Code",
          url: "https://api.together.ai/",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Together AI"
        },
        {
          id: "groq",
          name: "Groq",
          category: "Code",
          url: "https://console.groq.com/playground",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Fast LLM inference, OpenAI-compatible"
        },
        {
          id: "colab",
          name: "Google colab",
          category: "Code",
          url: "https://colab.research.google.com/",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Google colab"
        }
      ]
    },
    {
      id: "content",
      name: "Content",
      tools: [
        {
          id: "klingai",
          name: "Kling",
          category: "Content",
          url: "https://www.klingai.com/",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Image generation"
        },
        {
          id: "gamma",
          name: "Gamma presentation",
          category: "Content",
          url: "https://gamma.app/",
          imageUrl: "/placeholder.svg?height=24&width=24",
          description: "Presentation"
        },
        // {
        //   id: "nextjs",
        //   name: "Nextjs Github",
        //   category: "Content",
        //   url: "https://github.com/vercel/next.js",
        //   imageUrl: "/placeholder.svg?height=24&width=24",
        //   description: "Nextjs for frontend"
        // },
        // {
        //   id: "together",
        //   name: "Together",
        //   category: "Content",
        //   url: "https://api.together.ai/",
        //   imageUrl: "/placeholder.svg?height=24&width=24",
        //   description: "Together AI"
        // },
        // {
        //   id: "groq",
        //   name: "Groq",
        //   category: "Content",
        //   url: "https://console.groq.com/playground",
        //   imageUrl: "/placeholder.svg?height=24&width=24",
        //   description: "Fast LLM inference, OpenAI-compatible"
        // },
        // {
        //   id: "colab",
        //   name: "Google colab",
        //   category: "Code",
        //   url: "https://colab.research.google.com/",
        //   imageUrl: "/placeholder.svg?height=24&width=24",
        //   description: "Google colab"
        // }
      ]
    }
  ]
  
  
  // {
  //   id: "n8n",
  //   name: "n8n",
  //   category: "Automation",
  //   url: "https://n8n.io",
  //   imageUrl: "/placeholder.svg?height=24&width=24",
  //   description: "Open source workflow automation"
  // },