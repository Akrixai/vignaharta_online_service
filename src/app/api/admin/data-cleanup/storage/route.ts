import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/admin/data-cleanup/storage - Clean up storage bucket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { bucketId } = await request.json();

    if (!bucketId) {
      return NextResponse.json({ error: 'Bucket ID is required' }, { status: 400 });
    }

    // Validate bucket ID
    const allowedBuckets = ['documents', 'images', 'withdrawal-qr-codes', 'employee-documents'];
    if (!allowedBuckets.includes(bucketId)) {
      return NextResponse.json({ error: 'Invalid bucket ID' }, { status: 400 });
    }

    let deletedCount = 0;
    let totalSize = 0;

    // Function to recursively delete all files in a bucket
    const deleteAllFiles = async (path = '') => {
      try {
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from(bucketId)
          .list(path, {
            limit: 1000,
            offset: 0
          });

        if (listError) {
          console.error(`Error listing files in ${bucketId}/${path}:`, listError);
          return;
        }

        if (!files || files.length === 0) {
          return;
        }

        // Separate files and folders
        const fileNames: string[] = [];
        const folderNames: string[] = [];

        for (const file of files) {
          const fullPath = path ? `${path}/${file.name}` : file.name;
          
          if (file.name && !file.name.endsWith('/')) {
            // It's a file
            fileNames.push(fullPath);
            totalSize += file.metadata?.size || 0;
          } else if (file.name && file.name.endsWith('/')) {
            // It's a folder
            folderNames.push(file.name);
          }
        }

        // Delete files in current directory
        if (fileNames.length > 0) {
          const { error: deleteError } = await supabaseAdmin.storage
            .from(bucketId)
            .remove(fileNames);

          if (deleteError) {
            console.error(`Error deleting files from ${bucketId}:`, deleteError);
          } else {
            deletedCount += fileNames.length;
          }
        }

        // Recursively delete files in subdirectories
        for (const folderName of folderNames) {
          const subPath = path ? `${path}/${folderName}` : folderName;
          await deleteAllFiles(subPath.replace(/\/$/, '')); // Remove trailing slash
        }

      } catch (error) {
        console.error(`Error in deleteAllFiles for ${bucketId}/${path}:`, error);
      }
    };

    // Start deletion process
    await deleteAllFiles();

    // Format size
    const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 MB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const spaceFreed = formatSize(totalSize);

    return NextResponse.json({
      success: true,
      deletedCount,
      spaceFreed,
      message: `Successfully cleaned up ${bucketId} storage bucket`
    });

  } catch (error) {
    console.error('Error during storage cleanup:', error);
    return NextResponse.json({ 
      error: 'Internal server error during storage cleanup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
