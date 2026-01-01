import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';
import { validateFileUpload } from '@/lib/security';

// POST - Upload service image (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const serviceId = formData.get('serviceId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID required' }, { status: 400 });
    }

    // Validate file
    const validation = validateFileUpload(file);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid file', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Check if service exists
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('schemes')
      .select('id, name, image_url')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `service-${serviceId}-${timestamp}-${randomString}.${fileExtension}`;
    const filePath = `services/${fileName}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('service-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({
        error: `Failed to upload image: ${uploadError.message}`
      }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('service-images')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return NextResponse.json({
        error: 'Failed to get public URL'
      }, { status: 500 });
    }

    // Update service with new image URL
    const { error: updateError } = await supabaseAdmin
      .from('schemes')
      .update({ 
        image_url: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({
        error: 'Failed to update service with image URL'
      }, { status: 500 });
    }

    // Delete old image if it exists
    if (service.image_url) {
      try {
        const oldPath = service.image_url.split('/').pop();
        if (oldPath) {
          await supabaseAdmin.storage
            .from('service-images')
            .remove([`services/${oldPath}`]);
        }
      } catch (error) {
        // Ignore errors when deleting old image
        console.warn('Failed to delete old image:', error);
      }
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      message: 'Service image uploaded successfully'
    });

  } catch (error) {
    console.error('Service image upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Remove service image (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID required' }, { status: 400 });
    }

    // Get current service image
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('schemes')
      .select('id, image_url')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (!service.image_url) {
      return NextResponse.json({ error: 'No image to delete' }, { status: 400 });
    }

    // Extract file path from URL
    const urlParts = service.image_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `services/${fileName}`;

    // Delete from storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from('service-images')
      .remove([filePath]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({
        error: 'Failed to delete image from storage'
      }, { status: 500 });
    }

    // Update service to remove image URL
    const { error: updateError } = await supabaseAdmin
      .from('schemes')
      .update({ 
        image_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({
        error: 'Failed to update service'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Service image deleted successfully'
    });

  } catch (error) {
    console.error('Service image delete error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}