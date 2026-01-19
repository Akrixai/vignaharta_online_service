import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const { data: configs, error } = await supabase
      .from('pan_commission_config')
      .select('*')
      .order('service_type');

    if (error) {
      console.error('Error fetching PAN commission configs:', error);
      return NextResponse.json({ success: false, message: 'Failed to fetch configurations' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: configs || []
    });

  } catch (error) {
    console.error('Error in PAN commission config API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { service_type, price, is_active } = body;

    if (!service_type || price === undefined) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (!['NEW_PAN', 'PAN_CORRECTION', 'INCOMPLETE_PAN'].includes(service_type)) {
      return NextResponse.json({ success: false, message: 'Invalid service type' }, { status: 400 });
    }

    if (price < 0) {
      return NextResponse.json({ success: false, message: 'Invalid price' }, { status: 400 });
    }

    // Check if config already exists
    const { data: existingConfig, error: checkError } = await supabase
      .from('pan_commission_config')
      .select('id')
      .eq('service_type', service_type)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing PAN commission config:', checkError);
      return NextResponse.json({ success: false, message: 'Failed to verify configuration' }, { status: 500 });
    }

    if (existingConfig) {
      // Update existing config
      const { data: updatedConfig, error } = await supabase
        .from('pan_commission_config')
        .update({
          price,
          is_active: is_active !== undefined ? is_active : true,
          updated_at: new Date().toISOString()
        })
        .eq('service_type', service_type)
        .select();

      if (error) {
        console.error('Error updating PAN commission config:', error);
        return NextResponse.json({ success: false, message: 'Failed to update configuration' }, { status: 500 });
      }

      if (!updatedConfig || updatedConfig.length === 0) {
        return NextResponse.json({ success: false, message: 'No configuration was updated' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Configuration updated successfully',
        data: updatedConfig[0]
      });
    } else {
      // Create new config
      const { data: newConfig, error } = await supabase
        .from('pan_commission_config')
        .insert({
          service_type,
          price,
          is_active: is_active !== undefined ? is_active : true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating PAN commission config:', error);
        return NextResponse.json({ success: false, message: 'Failed to create configuration' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Configuration created successfully',
        data: newConfig
      });
    }

  } catch (error) {
    console.error('Error in PAN commission config API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { id, service_type, price, is_active } = body;

    console.log('PUT request body:', { id, service_type, price, is_active });

    if (!id || !service_type || price === undefined) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (!['NEW_PAN', 'PAN_CORRECTION', 'INCOMPLETE_PAN'].includes(service_type)) {
      return NextResponse.json({ success: false, message: 'Invalid service type' }, { status: 400 });
    }

    if (price < 0) {
      return NextResponse.json({ success: false, message: 'Invalid price' }, { status: 400 });
    }

    // Directly update the record
    const { data: updatedConfig, error } = await supabase
      .from('pan_commission_config')
      .update({
        service_type,
        price,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    console.log('Update result:', { updatedConfig, error, affectedRows: updatedConfig?.length });

    if (error) {
      console.error('Error updating PAN commission config:', error);
      return NextResponse.json({ success: false, message: 'Failed to update configuration' }, { status: 500 });
    }

    if (!updatedConfig || updatedConfig.length === 0) {
      return NextResponse.json({ success: false, message: 'No configuration was updated. Record may not exist.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      data: updatedConfig[0]
    });

  } catch (error) {
    console.error('Error in PAN commission config PUT API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Configuration ID is required' }, { status: 400 });
    }

    // First check if the record exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('pan_commission_config')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing PAN commission config:', checkError);
      return NextResponse.json({ success: false, message: 'Failed to verify configuration' }, { status: 500 });
    }

    if (!existingRecord) {
      return NextResponse.json({ success: false, message: 'Configuration not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('pan_commission_config')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting PAN commission config:', error);
      return NextResponse.json({ success: false, message: 'Failed to delete configuration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully'
    });

  } catch (error) {
    console.error('Error in PAN commission config DELETE API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}