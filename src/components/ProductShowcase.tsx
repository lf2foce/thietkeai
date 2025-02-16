"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

function isWebview(userAgent: string) {
  const webviewRegex = /(FBAN|FBAV|Instagram|WebView|wv)/i;
  return webviewRegex.test(userAgent);
}

interface Product {
  id: number;
  title: string;
  description: string;
  imageDesktop: string;
  imageMobile: string;
  link: string;
}

export default function ProductShowcase({ product }: { product: Product }) {
  const router = useRouter();
  const { toast } = useToast();

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
        await router.push(product.link);
      } catch (error) {
        console.error("Failed to navigate:", error);
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
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* Left: Text Content */}
      <div className="flex flex-col justify-center gap-6 p-6 md:w-2/5 bg-gray-50 rounded-lg">
        <h2 className="text-xl md:text-3xl text-gray-800 leading-normal font-semibold">
          {product.title}
        </h2>
        <p className="text-gray-700">{product.description}</p>
        <Link
          onClick={handleClick}
          href={product.link}
          aria-label={`Navigate to ${product.title}`}
          className="flex items-center gap-5 self-start rounded-lg bg-gradient-to-r from-indigo-600 via-purple-400 to-pink-200 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
        >
          <span>Sáng tạo ngay</span>
          <ArrowRightIcon className="w-5 md:w-6" />
        </Link>
      </div>

      {/* Right: Image */}
      <div className="flex items-center justify-center p-6 md:w-3/5">
        <Image
          src={product.imageDesktop}
          width={1000}
          height={760}
          className="hidden md:block w-full object-cover"
          alt={`Screenshot of ${product.title}`}
        />
        <Image
          src={product.imageMobile}
          width={560}
          height={620}
          className="block md:hidden w-full object-cover"
          alt={`Screenshot of ${product.title}`}
        />
      </div>
    </div>
  );
}
