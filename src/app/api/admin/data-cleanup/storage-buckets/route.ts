import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/admin/data-cleanup/storage-buckets - Get storage bucket statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const buckets = [
      { id: 'documents', name: 'documents' },
      { id: 'images', name: 'images' },
      { id: 'withdrawal-qr-codes', name: 'withdrawal-qr-codes' },
      { id: 'employee-documents', name: 'employee-documents' }
    ];

    const bucketStats = await Promise.all(
      buckets.map(async (bucket) => {
        try {
          // List all files in the bucket
          const { data: files, error } = await supabaseAdmin.storage
            .from(bucket.id)
            .list('', {
              limit: 1000,
              offset: 0
            });

          if (error) {
            return {
              id: bucket.id,
              name: bucket.name,
              file_count: 0,
              total_size: '0 MB'
            };
          }

          // Count files recursively
          let totalFiles = 0;
          let totalSize = 0;

          const countFilesRecursively = async (path = '', files: any[] = []) => {
            for (const file of files) {
              if (file.name && !file.name.endsWith('/')) {
                // It's a file
                totalFiles++;
                totalSize += file.metadata?.size || 0;
              } else if (file.name && file.name.endsWith('/')) {
                // It's a folder, list its contents
                const { data: subFiles } = await supabaseAdmin.storage
                  .from(bucket.id)
                  .list(file.name, { limit: 1000 });
                
                if (subFiles) {
                  await countFilesRecursively(file.name, subFiles);
                }
              }
            }
          };

          await countFilesRecursively('', files || []);

          // Format size
          const formatSize = (bytes: number) => {
            if (bytes === 0) return '0 MB';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
          };

          return {
            id: bucket.id,
            name: bucket.name,
            file_count: totalFiles,
            total_size: formatSize(totalSize)
          };
        } catch (error) {
          return {
            id: bucket.id,
            name: bucket.name,
            file_count: 0,
            total_size: '0 MB'
          };
        }
      })
    );

    return NextResponse.json({ buckets: bucketStats });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
