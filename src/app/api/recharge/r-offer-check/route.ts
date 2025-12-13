import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { mobile_number } = await request.json();

    // Validate mobile number
    if (!mobile_number || !/^[0-9]{10}$/.test(mobile_number)) {
      return NextResponse.json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number'
      }, { status: 400 });
    }

    console.log('🔍 [R-OFFER] Checking offers for mobile:', mobile_number);

    // Try R-OFFER check with different operator IDs
    // According to KWIKAPI docs, R-OFFER is only available for Airtel and VI
    const supportedOperators = [
      { opid: 1, name: 'Airtel' },
      { opid: 3, name: 'Vodafone Idea' },
      { opid: 21, name: 'Vodafone' },
      { opid: 177, name: 'Airtel Official' },
      { opid: 178, name: 'VI Official' }
    ];

    let bestResult = null;
    let operatorName = 'Unknown';

    // Try each supported operator to see which one has offers
    for (const operator of supportedOperators) {
      console.log(`🔍 [R-OFFER] Trying operator ${operator.name} (opid: ${operator.opid})`);
      
      const formData = new FormData();
      formData.append('api_key', process.env.KWIKAPI_API_KEY || '');
      formData.append('opid', operator.opid.toString());
      formData.append('mobile', mobile_number);

      try {
        // Call KWIKAPI R-OFFER check API
        const response = await fetch('https://www.kwikapi.com/api/v2/R-OFFER_check.php', {
          method: 'POST',
          body: formData,
        });

        const responseText = await response.text();
        console.log(`📦 [R-OFFER] Raw API Response for ${operator.name}:`, responseText);

        let apiData;
        try {
          apiData = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`❌ [R-OFFER] Failed to parse API response for ${operator.name}:`, parseError);
          continue; // Try next operator
        }

        console.log(`📦 [R-OFFER] Parsed API Response for ${operator.name}:`, apiData);
        
        // Log sample offer structure for debugging
        if (apiData.data && apiData.data.length > 0) {
          console.log('📋 [R-OFFER] Sample offer structure:', JSON.stringify(apiData.data[0], null, 2));
        }

        // Check if this operator has offers
        if (apiData.success === true || apiData.status === 'SUCCESS') {
          const offers = apiData.data || apiData.offers || [];
          if (offers.length > 0) {
            // Found offers with this operator
            bestResult = {
              success: true,
              message: `Found ${offers.length} special offers for your ${operator.name} number`,
              data: {
                mobile_number,
                operator_name: operator.name,
                offers: offers.map((offer: any, index: number) => {
                  const amount = offer.amount || offer.price || 0;
                  const validity = offer.validity || offer.valid_days || '1 Day';
                  let description = offer.description || offer.details || offer.offer_text || '';
                  
                  // Enhance generic descriptions with meaningful content
                  if (!description || description.length < 10 || description.toLowerCase().includes('special offer')) {
                    description = `🎁 Exclusive R-OFFER for ${operator.name} customers! Get special benefits worth ₹${amount} with ${validity} validity. This limited-time offer includes premium services and additional benefits not available with regular recharges.`;
                  }
                  
                  return {
                    id: offer.id || offer.offer_id || `roffer_${index}`,
                    amount: amount,
                    validity: validity,
                    description: description,
                    type: offer.type || offer.category || 'R-OFFER',
                    discount: offer.discount || offer.savings || null,
                    original_price: offer.original_price || offer.mrp || null,
                    offer_text: offer.offer_text || offer.title || null
                  };
                }),
                total_offers: offers.length,
                supported: true,
                api_response: apiData
              }
            };
            operatorName = operator.name;
            break; // Found offers, no need to try other operators
          }
        } else if (apiData.success === false && apiData.message && 
                   !apiData.message.includes('only availble in Airtel and VI')) {
          // This operator is supported but no offers found
          if (!bestResult) {
            bestResult = {
              success: true,
              message: `No special offers available for your ${operator.name} number right now`,
              data: {
                mobile_number,
                operator_name: operator.name,
                offers: [],
                total_offers: 0,
                supported: true,
                api_response: apiData
              }
            };
            operatorName = operator.name;
          }
        }
      } catch (error) {
        console.error(`❌ [R-OFFER] Error checking ${operator.name}:`, error);
        continue; // Try next operator
      }
    }

    // Return the best result found
    if (bestResult) {
      return NextResponse.json(bestResult);
    }

    // No supported operator found
    return NextResponse.json({
      success: true,
      message: 'R-OFFER service is only available for Airtel and VI networks.',
      data: {
        mobile_number,
        operator_name: 'Unknown',
        offers: [],
        total_offers: 0,
        supported: false
      }
    });

  } catch (error: any) {
    console.error('❌ [R-OFFER] API Error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to check offers. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}