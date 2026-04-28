import { NextResponse } from 'next/server';
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// GET: List all files and their total size
export async function GET() {
  try {
    const files = await utapi.listFiles({ limit: 500 });
    const totalSize = files.files.reduce((acc, f) => acc + (f.size || 0), 0);
    return NextResponse.json({
      count: files.files.length,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      files: files.files.map(f => ({ key: f.key, name: f.name, sizeMB: ((f.size || 0) / 1024 / 1024).toFixed(2) })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete ALL files to free up quota
export async function DELETE() {
  try {
    const files = await utapi.listFiles({ limit: 500 });
    const keys = files.files.map(f => f.key);
    if (keys.length === 0) {
      return NextResponse.json({ message: 'No files to delete' });
    }
    await utapi.deleteFiles(keys);
    return NextResponse.json({ message: `Deleted ${keys.length} files`, deletedKeys: keys });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
