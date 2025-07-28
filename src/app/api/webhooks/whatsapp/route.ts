import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/whatsapp-meta-api';
import { supabaseAdmin } from '@/lib/supabase';

// Webhook verification for Meta WhatsApp
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    // WhatsApp webhook verified successfully
    return new NextResponse(challenge, { status: 200 });
  }

  // WhatsApp webhook verification failed
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// Handle incoming webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!verifyWebhookSignature(body, signature)) {
        // Invalid webhook signature
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    const data = JSON.parse(body);
    
    // WhatsApp webhook received

    // Process webhook events
    if (data.entry && data.entry.length > 0) {
      for (const entry of data.entry) {
        if (entry.changes && entry.changes.length > 0) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await processMessageStatus(change.value);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    // WhatsApp webhook error occurred
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processMessageStatus(value: any) {
  try {
    // Handle message status updates
    if (value.statuses && value.statuses.length > 0) {
      for (const status of value.statuses) {
        const messageId = status.id;
        const statusType = status.status; // sent, delivered, read, failed
        const timestamp = status.timestamp;

        // Message status update received

        // Update message status in database
        await supabaseAdmin
          .from('whatsapp_notifications')
          .update({
            status: statusType,
            delivered_at: statusType === 'delivered' ? new Date(parseInt(timestamp) * 1000).toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('message_id', messageId);

        // Handle failed messages
        if (statusType === 'failed' && status.errors) {
          const errorMessage = status.errors.map((e: any) => e.title).join(', ');
          
          await supabaseAdmin
            .from('whatsapp_notifications')
            .update({
              status: 'failed',
              error_message: errorMessage,
              updated_at: new Date().toISOString()
            })
            .eq('message_id', messageId);

          // Message delivery failed
        }
      }
    }

    // Handle incoming messages (if needed)
    if (value.messages && value.messages.length > 0) {
      for (const message of value.messages) {
        // Incoming message received
        
        // You can implement auto-replies or message handling here
      }
    }

  } catch (error) {
    // Error processing message status
  }
}
