import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET - Fetch all documents for an employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: employeeId } = await params;
    const { data, error } = await supabaseAdmin
      .from('employee_documents')
      .select('*')
      .eq('user_id', employeeId);
    if (error) {
      console.error(`Failed to fetch documents for employee ${employeeId}:`, error);
      return NextResponse.json({ error: 'Failed to fetch documents', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ documents: data });
  } catch (error) {
    console.error('Employee documents fetch error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Upload employee documents (Aadhaar, PAN, Photo)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.ADMIN) {
      console.error('Unauthorized access attempt to employee documents upload');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: employeeId } = await params;
    console.log(`Processing document upload for employee: ${employeeId} by admin: ${session.user.id}`);
    // Expect multipart/form-data with fields: aadhar, pancard, photo
    const formData = await request.formData();
    const files = [
      { key: 'AADHAR', file: formData.get('aadhar') },
      { key: 'PANCARD', file: formData.get('pancard') },
      { key: 'PHOTO', file: formData.get('photo') },
    ];
    const uploaded = [];
    for (const { key, file } of files) {
      if (file && file instanceof File) {
        console.log(`Processing ${key} file: ${file.name}, size: ${file.size}, type: ${file.type}`);
        const fileName = `${employeeId}_${key}_${Date.now()}`;
        const { data, error } = await supabaseAdmin.storage
          .from('employee-documents')
          .upload(fileName, file, { contentType: file.type });
        if (error) {
          console.error(`Failed to upload ${key} for employee ${employeeId}:`, error);
          return NextResponse.json({ error: `Failed to upload ${key}: ${error.message}` }, { status: 500 });
        }
        const fileUrl = data?.path ? supabaseAdmin.storage.from('employee-documents').getPublicUrl(data.path).data.publicUrl : null;
        console.log(`File uploaded successfully: ${fileName}, URL: ${fileUrl}`);

        // Insert into employee_documents table
        const insertData = {
          user_id: employeeId,
          document_type: key,
          file_url: fileUrl,
          file_name: fileName,
          mime_type: file.type,
          file_size: file.size,
          uploaded_at: new Date().toISOString(),
          created_by: session.user.id,
        };
        console.log('Inserting document record:', insertData);

        const { error: dbError } = await supabaseAdmin
          .from('employee_documents')
          .insert(insertData);
        if (dbError) {
          console.error(`Failed to save ${key} record for employee ${employeeId}:`, dbError);
          return NextResponse.json({ error: `Failed to save ${key} record: ${dbError.message}` }, { status: 500 });
        }
        console.log(`Successfully saved ${key} document record for employee ${employeeId}`);
        uploaded.push({ type: key, url: fileUrl });
      }
    }
    console.log(`Document upload completed for employee ${employeeId}. Uploaded ${uploaded.length} files.`);
    return NextResponse.json({ success: true, uploaded });
  } catch (error) {
    console.error('Employee documents upload error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 