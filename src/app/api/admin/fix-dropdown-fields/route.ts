import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all services with dynamic fields
    const { data: services, error: fetchError } = await supabaseAdmin
      .from('schemes')
      .select('id, name, dynamic_fields')
      .not('dynamic_fields', 'is', null);

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    let fixedCount = 0;
    const fixedServices = [];

    for (const service of services || []) {
      let needsUpdate = false;
      const updatedFields = service.dynamic_fields.map((field: any) => {
        if (field.type === 'select' && field.options) {
          // Check if options is an array with a single string that should be split
          if (field.options.length === 1 && typeof field.options[0] === 'string') {
            const singleOption = field.options[0];
            // If the single option looks like it should be multiple options (no spaces, long string)
            if (singleOption.length > 20 && !singleOption.includes(' ')) {
              // Try to intelligently split the options
              // This is a heuristic - you might need to adjust based on your data
              const possibleOptions = [];
              
              // Common patterns to split on
              const patterns = [
                /([a-z]+)([A-Z][a-z]+)/g, // camelCase: serviceUnemployed -> service, Unemployed
                /([a-z]+)([A-Z]+)/g, // mixed case
              ];
              
              let splitOptions = [singleOption];
              
              // Try camelCase splitting
              const camelCaseMatches = singleOption.match(/[A-Z][a-z]+|[a-z]+/g);
              if (camelCaseMatches && camelCaseMatches.length > 1) {
                splitOptions = camelCaseMatches.map(opt => opt.toLowerCase());
              }
              
              if (splitOptions.length > 1) {

                needsUpdate = true;
                return {
                  ...field,
                  options: splitOptions
                };
              }
            }
          }
        }
        return field;
      });

      if (needsUpdate) {
        const { error: updateError } = await supabaseAdmin
          .from('schemes')
          .update({ dynamic_fields: updatedFields })
          .eq('id', service.id);

        if (updateError) {
        } else {
          fixedCount++;
          fixedServices.push({
            id: service.id,
            name: service.name,
            fixedFields: updatedFields.filter((field: any) => field.type === 'select')
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} services with malformed dropdown fields`,
      fixedServices
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fix dropdown fields',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
