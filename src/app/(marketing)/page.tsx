'use client'

import AcmeLogo from '@/app/ui/acme-logo';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

function isWebview(userAgent) {
  const webviewRegex = /(FBAN|FBAV|Instagram|WebView|wv)/i;
  return webviewRegex.test(userAgent);
}

export default function Page() {
  const router = useRouter();
  const { toast } = useToast()

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isWebview(navigator.userAgent)) {
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
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg p-4 bg-gradient-to-r from-indigo-600 via-purple-400 to-pink-200">
        <AcmeLogo />
      </div>
      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">
          <p className="text-xl text-gray-800 md:text-3xl md:leading-normal">
            <strong>Trợ lý AI - </strong> Tạo mẫu thiết kế nội thất cực nhanh, giúp bạn hoàn thiện ý tưởng lựa chọn phong cách và nội thất chỉ trong 10s
          </p>
          <Link
            onClick={handleClick}
            href="/dashboard/interior"
            aria-label="Navigate to interior design creation"
            className="flex items-center gap-5 self-start rounded-lg bg-gradient-to-r from-indigo-600 via-purple-400 to-pink-200 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
          >
            <span>Sáng tạo ngay</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
        </div>
        <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12">
          <Image
            src="/hero-desktop.png"
            width={1000}
            height={760}
            className="hidden md:block"
            alt="Screenshots of the dashboard project showing desktop version"
          />
          <Image
            src="/hero-mobile.png"
            width={560}
            height={620}
            className="block md:hidden"
            alt="Screenshot of the dashboard project showing mobile version"
          />
        </div>
      </div>
      <Toaster />
    </main>
  );
}