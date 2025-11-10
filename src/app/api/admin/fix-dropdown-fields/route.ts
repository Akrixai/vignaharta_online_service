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
          let fixedOptions = [];
          let hasChanges = false;

          // Handle different types of options data
          if (Array.isArray(field.options)) {
            field.options.forEach((option: any) => {
              if (typeof option === 'string') {
                const trimmedOption = option.trim();
                // Check if this looks like merged options (no spaces, long string, mixed case)
                if (trimmedOption.length > 15 && !trimmedOption.includes(' ') && /[a-z][A-Z]/.test(trimmedOption)) {
                  // Try to split camelCase or merged words
                  const splitOptions = trimmedOption.match(/[A-Z][a-z]+|[a-z]+/g);
                  if (splitOptions && splitOptions.length > 1) {

                    const properOptions = splitOptions.map(opt =>
                      opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase()
                    );
                    fixedOptions.push(...properOptions);
                    hasChanges = true;
                  } else {
                    fixedOptions.push(trimmedOption);
                  }
                } else {
                  fixedOptions.push(trimmedOption);
                }
              } else {
                fixedOptions.push(String(option).trim());
              }
            });
          } else if (typeof field.options === 'string') {
            // If options is a string, split by comma
            const stringOptions = field.options
              .split(',')
              .map((option: string) => option.trim())
              .filter((option: string) => option.length > 0);

            if (stringOptions.length > 1) {

              fixedOptions = stringOptions;
              hasChanges = true;
            } else {
              fixedOptions = stringOptions;
            }
          }

          // Remove duplicates and empty options
          fixedOptions = [...new Set(fixedOptions)].filter(opt => opt && opt.length > 0);

          if (hasChanges || fixedOptions.length !== field.options.length) {
            needsUpdate = true;
            return {
              ...field,
              options: fixedOptions
            };
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
