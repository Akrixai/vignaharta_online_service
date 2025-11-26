import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const documentType = formData.get('documentType') as string;

    if (!file || !userId || !documentType) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Map frontend document types to database enum values
    const documentTypeMap: Record<string, string> = {
      'aadhar_card': 'AADHAR',
      'pan_card': 'PANCARD',
      'photo': 'PHOTO',
      'other': 'IMAGE'
    };

    const dbDocumentType = documentTypeMap[documentType] || 'IMAGE';

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${documentType}_${Date.now()}.${fileExt}`;
    const filePath = `employee-documents/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Check if document already exists and update, otherwise insert
    const { data: existingDoc } = await supabaseAdmin
      .from('employee_documents')
      .select('id')
      .eq('user_id', userId)
      .eq('document_type', dbDocumentType)
      .maybeSingle();

    let document;
    if (existingDoc) {
      // Update existing document
      const { data: updatedDoc, error: updateError } = await supabaseAdmin
        .from('employee_documents')
        .update({
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDoc.id)
        .select()
        .single();

      if (updateError) throw updateError;
      document = updatedDoc;
    } else {
      // Insert new document
      const { data: newDoc, error: insertError } = await supabaseAdmin
        .from('employee_documents')
        .insert({
          user_id: userId,
          document_type: dbDocumentType,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          created_by: session.user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;
      document = newDoc;
    }

    return NextResponse.json({
      success: true,
      document
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
