-- Migration to fix wallet request processing function
-- This fixes the parameter name ambiguity issue and ensures proper function signature

-- Drop the existing function
DROP FUNCTION IF EXISTS process_wallet_request(TEXT, UUID, TEXT, UUID);

-- Create the new function with proper parameter names
CREATE FUNCTION process_wallet_request(
    action TEXT,
    processor_id UUID,
    reject_reason TEXT DEFAULT NULL,
    request_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    request_record wallet_requests%ROWTYPE;
    user_wallet_id uuid;
    wallet_balance numeric;
    result json;
    amt numeric;
BEGIN
    -- Fetch and lock the wallet request row
    SELECT *
    INTO request_record
    FROM wallet_requests
    WHERE id = request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Wallet request not found');
    END IF;

    -- Only process pending requests
    IF request_record.status IS NULL OR request_record.status <> 'PENDING' THEN
        RETURN json_build_object('success', false, 'error', 'Request already processed or not pending');
    END IF;

    -- Validate amount
    amt := request_record.amount;
    IF amt IS NULL OR amt <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Invalid request amount');
    END IF;

    -- Find and lock user's wallet
    SELECT id, balance
    INTO user_wallet_id, wallet_balance
    FROM wallets
    WHERE user_id = request_record.user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User wallet not found');
    END IF;

    -- Process actions
    IF upper(action) = 'APPROVE' THEN
        IF request_record.type = 'TOPUP' THEN
            -- update wallet balance
            UPDATE wallets
            SET balance = balance + amt,
                updated_at = now()
            WHERE id = user_wallet_id;

            -- mark request approved
            UPDATE wallet_requests
            SET status = 'APPROVED',
                approved_by = processor_id,
                approved_at = now(),
                processed_by = processor_id,
                processed_at = now(),
                updated_at = now()
            WHERE id = request_id;

            -- create transaction record
            INSERT INTO transactions (
                user_id,
                wallet_id,
                type,
                amount,
                status,
                description,
                reference,
                processed_by,
                created_at,
                updated_at
            ) VALUES (
                request_record.user_id,
                user_wallet_id,
                'DEPOSIT'::transaction_type,
                amt,
                'COMPLETED'::transaction_status,
                'Wallet top-up approved',
                request_record.transaction_reference,
                processor_id,
                now(),
                now()
            );

            result := json_build_object('success', true, 'message', 'Wallet top-up approved successfully');

        ELSIF request_record.type = 'WITHDRAWAL' THEN
            -- Prevent negative balance
            IF wallet_balance < amt THEN
                RETURN json_build_object('success', false, 'error', 'Insufficient wallet balance for withdrawal');
            END IF;

            -- update wallet balance
            UPDATE wallets
            SET balance = balance - amt,
                updated_at = now()
            WHERE id = user_wallet_id;

            -- mark request approved
            UPDATE wallet_requests
            SET status = 'APPROVED',
                approved_by = processor_id,
                approved_at = now(),
                processed_by = processor_id,
                processed_at = now(),
                updated_at = now()
            WHERE id = request_id;

            -- create transaction record
            INSERT INTO transactions (
                user_id,
                wallet_id,
                type,
                amount,
                status,
                description,
                reference,
                processed_by,
                created_at,
                updated_at
            ) VALUES (
                request_record.user_id,
                user_wallet_id,
                'WITHDRAWAL'::transaction_type,
                amt,
                'COMPLETED'::transaction_status,
                'Wallet withdrawal approved',
                request_record.transaction_reference,
                processor_id,
                now(),
                now()
            );

            result := json_build_object('success', true, 'message', 'Wallet withdrawal approved successfully');

        ELSE
            RETURN json_build_object('success', false, 'error', 'Unknown request type');
        END IF;

    ELSIF upper(action) = 'REJECT' THEN
        -- Mark the request rejected and store rejection reason
        UPDATE wallet_requests
        SET status = 'REJECTED',
            rejected_by = processor_id,
            rejected_at = now(),
            processed_by = processor_id,
            processed_at = now(),
            rejection_reason = reject_reason,  -- Use the renamed parameter
            updated_at = now()
        WHERE id = request_id;

        result := json_build_object('success', true, 'message', 'Wallet request rejected successfully');

    ELSE
        result := json_build_object('success', false, 'error', 'Invalid action');
    END IF;

    RETURN result;

EXCEPTION
    WHEN others THEN
        -- Return error as JSON; include basic exception message (avoid exposing sensitive internals)
        RETURN json_build_object(
            'success', false,
            'error', 'Processing failed',
            'details', substr(coalesce(sqlstate || ' - ' || sqlerrm, 'unexpected error'), 1, 1000)
        );
END;
$$ LANGUAGE plpgsql;