'use client'
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { ArrowUpRight, Sparkles } from 'lucide-react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import AcmeLogo from '@/app/ui/acme-logo';
import { aiTools } from "@/lib/data/tools";

interface AITool {
  id: string;
  name: string;
  category: string;
  url: string;
  imageUrl: string;
  description: string;
}

interface ToolCategory {
  id: string;
  name: string;
  tools: AITool[];
}

const isWebview = (userAgent: string): boolean => {
  const webviewRegex = /(FBAN|FBAV|Instagram|WebView|wv)/i;
  return webviewRegex.test(userAgent);
};

const categoryColors = {
  "Automation": "from-blue-500 to-cyan-400",
  "Chatbot": "from-purple-500 to-pink-400",
  "Code": "from-orange-500 to-red-400",
};

const AIToolCard: React.FC<{ tool: AITool }> = ({ tool }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="group hover:scale-105 transition-all duration-300 border-0 bg-white/50 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-100">
          <CardContent className="p-0">
            <Link
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <Image
                    src={tool.imageUrl}
                    alt={`${tool.name} icon`}
                    width={28}
                    height={28}
                    className="rounded-full relative"
                  />
                </div>
                <span className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                  {tool.name}
                </span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </Link>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent className="bg-gray-900 text-white">
        <p className="text-sm">{tool.description}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const AIToolsSection: React.FC = () => (
  <TooltipProvider>
    <div className="bg-gradient-to-b from-white to-gray-50 py-16 px-4">
    <div className="container mx-auto py-8 px-4 max-w-6xl">
    <div className="text-center mb-12 space-y-4">
        <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
          <Sparkles className="h-5 w-5" />
          <span>AI Tools Collection</span>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          AI Tools we use in 2025
        </h2>
      </div>
      <div className="grid gap-4">
        {aiTools.map((category) => (
          <div key={category.id} className="grid gap-2">
            <div className="grid grid-cols-[200px_1fr] gap-2">
              <Card className="h-12 flex items-center px-4 shadow-none bg-transparent">
                <CardContent className="p-0 font-semibold flex items-center justify-between w-full">
                  <span className="bg-gradient-to-r from-purple-600 via-blue-500 to-purple-400 inline-block text-transparent bg-clip-text">{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({category.tools.length})
                  </span>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {category.tools.map((tool) => (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <Card className="h-12 border-2 border-black shadow-none">
                        <CardContent className="p-0 h-full">
                          <Link 
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="flex items-center justify-between px-3 h-full hover:bg-muted/50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Image
                                src={tool.imageUrl || "/placeholder.svg"}
                                alt={`${tool.name} icon`}
                                width={24}
                                height={24}
                                className="rounded-sm"
                              />
                              <span className="text-sm font-medium">{tool.name}</span>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-black" />
                          </Link>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tool.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  </TooltipProvider>
);

export default function LandingPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== 'undefined' && isWebview(navigator.userAgent)) {
      e.preventDefault();
      toast({
        title: "Open in browser",
        description: "Open this link in Safari or Chrome to proceed.",
        duration: 10000,
      });
    } else {
      try {
        await router.push('/dashboard/interior');
      } catch (error) {
        console.error('Failed to navigate:', error);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header Section with modern gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 p-6">
        <div className="container mx-auto max-w-6xl">
          <AcmeLogo />
        </div>
      </div>

      {/* Hero Section without glass morphism */}
<div className="container mx-auto max-w-6xl px-4 py-16">
  <div className="flex flex-col md:flex-row gap-12 items-center">
    <div className="md:w-2/5 space-y-6">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
        Trợ lý AI{" "}
        <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          Thông Minh
        </span>
      </h1>
      <p className="text-xl text-gray-600 leading-relaxed">
        Tạo mẫu thiết kế nội thất cực nhanh, giúp bạn hoàn thiện ý tưởng lựa chọn phong cách và nội thất chỉ trong 10s
      </p>
      <Link
        onClick={handleClick}
        href="/dashboard/interior"
        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-all hover:scale-105"
      >
        Sáng tạo ngay
        <ArrowRightIcon className="w-5 h-5" />
      </Link>
    </div>
    <div className="md:w-3/5 relative">
      <Image
        src="/hero-desktop.png"
        width={1000}
        height={760}
        className="hidden md:block relative rounded-2xl"
        alt="Screenshots of the dashboard project showing desktop version"
      />
      <Image
        src="/hero-mobile.png"
        width={560}
        height={620}
        className="block md:hidden relative rounded-2xl"
        alt="Screenshot of the dashboard project showing mobile version"
      />
    </div>
  </div>
</div>

      {/* AI Tools Section */}
      <AIToolsSection />

      {/* Consulting Section */}
<div className="container mx-auto max-w-6xl px-4 py-16 text-center">
  <div className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-white p-8 rounded-2xl shadow-lg">
    <h2 className="text-3xl font-bold">Need AI Consulting?</h2>
    <p className="mt-4 text-lg">
      Our team specializes in AI-driven solutions tailored to your business needs.
      Whether you're looking to integrate AI into your workflow, optimize automation, or explore new possibilities, we're here to help.
    </p>
    <Link
      href="https://www.linkedin.com/in/anh-the-bui-66817857/"
      className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:opacity-90 transition-all hover:scale-105"
    >
      Contact Us Today
      <ArrowRightIcon className="w-5 h-5" />
    </Link>
  </div>
</div>

      <Toaster />
    </main>
  );
}