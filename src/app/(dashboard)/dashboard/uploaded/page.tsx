import { auth } from '@clerk/nextjs/server';
import { db } from '@/app/server/db';
import GalleryClient from './gallery-client';

export const dynamic = 'force-dynamic';

export default async function UploadedPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
            Images
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
            Sign in to view your gallery.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
            Your processed renders are attached to your account, so we need you signed in before
            showing the archive.
          </p>
        </section>
      </main>
    );
  }

  const images = await db.query.images.findMany({
    where: (images, { and, eq }) =>
      and(eq(images.userId, userId), eq(images.type, 'processed')),
    orderBy: (images, { desc }) => [desc(images.createdAt)],
  });

  return (
    <main className="h-full">
      <GalleryClient images={images} />
    </main>
  );
}
