import { NextResponse } from 'next/server';
import { connectToDatabase, User, DepositRequest, DepositBonusConfig, DepositMethodConfig, expireStaleDeposits } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { initiateTapTapUpPayment, getChannelProductId } from '@/lib/taptapup';

function generateOrderNo() {
  const rand = Math.floor(100000000000 + Math.random() * 900000000000);
  return String(rand);
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    await connectToDatabase();
    await expireStaleDeposits();

    const body = await request.json();
    const { paymentMethod, paidAmount, receivedAmount, senderCashtag, sender_tag, sender_email, senderEmail, proof_image } = body;

    const paid = parseFloat(paidAmount);
    if (isNaN(paid) || paid <= 0) {
      return NextResponse.json({ success: false, message: 'Valid deposit amount required' }, { status: 400 });
    }

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // 1. Calculate Deposit Bonus (First Deposit vs Regular Reload)
    let bonusConfig = await DepositBonusConfig.findOne();
    if (!bonusConfig) {
      bonusConfig = {
        first_deposit_bonus_percent: 300,
        regular_deposit_bonus_percent: 50,
        is_active: true
      };
    }

    const approvedCount = await DepositRequest.countDocuments({
      user_id: user._id.toString(),
      status: 'Approved'
    });

    const isFirstDeposit = approvedCount === 0;
    const bonusPercent = isFirstDeposit
      ? (bonusConfig.first_deposit_bonus_percent ?? 300)
      : (bonusConfig.regular_deposit_bonus_percent ?? 50);

    const bonusAmount = parseFloat(((paid * bonusPercent) / 100).toFixed(2));
    const totalCreditAmount = parseFloat((paid + bonusAmount).toFixed(2));

    const orderNo = generateOrderNo();
    const balanceBefore = user.wallet_balance || 0;
    const balanceAfter = balanceBefore;
    const finalSenderTag = (sender_tag || senderCashtag || '').trim();
    const finalSenderEmail = (sender_email || senderEmail || '').trim();

    // Check if this method is configured as Manual or in DepositMethodConfig
    const normalizedMethod = (paymentMethod || '').toLowerCase();
    const isKnownManual = normalizedMethod.includes('chime') || normalizedMethod.includes('paypal');
    const dbConfig = await DepositMethodConfig.findOne({ name: new RegExp(`^${paymentMethod}$`, 'i') });
    const isManualMethod = isKnownManual || !dbConfig || dbConfig.type === 'manual';

    if (isManualMethod) {
      const deposit = await DepositRequest.create({
        order_no: orderNo,
        user_id: user._id.toString(),
        username: user.username,
        payment_method: paymentMethod || 'Chime',
        paid_amount: paid,
        received_amount: totalCreditAmount,
        service_fee: 0.00,
        status: 'Pending',
        wallet_balance_before: balanceBefore,
        wallet_balance_after: balanceAfter,
        sender_tag: finalSenderTag,
        sender_email: finalSenderEmail,
        transaction_proof: finalSenderTag,
        proof_image: (proof_image || '').trim(),
        bonus_percentage: bonusPercent,
        bonus_amount: bonusAmount,
        bonus_type: isFirstDeposit ? 'first_deposit' : 'regular',
        total_credit_amount: totalCreditAmount,
        payment_gateway: 'Manual',
        admin_notes: isFirstDeposit
          ? `First Deposit: +${bonusPercent}% applied. Deposit $${paid.toFixed(2)} + Bonus $${bonusAmount.toFixed(2)} = $${totalCreditAmount.toFixed(2)} to credit.`
          : `Regular Deposit: +${bonusPercent}% applied. Deposit $${paid.toFixed(2)} + Bonus $${bonusAmount.toFixed(2)} = $${totalCreditAmount.toFixed(2)} to credit.`,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours for manual review
      });

      return NextResponse.json({
        success: true,
        isManual: true,
        message: 'Deposit submitted successfully! Admin will review your screenshot and credit your wallet.',
        orderNo: deposit.order_no,
        paidAmount: deposit.paid_amount,
        receivedAmount: deposit.received_amount,
        bonusPercentage: deposit.bonus_percentage,
        bonusAmount: deposit.bonus_amount,
        totalCreditAmount: deposit.total_credit_amount,
        bonusType: deposit.bonus_type,
        status: deposit.status,
        senderTag: deposit.sender_tag,
        senderEmail: deposit.sender_email,
        proofImage: deposit.proof_image,
        paymentGateway: 'Manual',
      });
    }

    // Otherwise, call automated payment gateway for instant checkout
    let gatewayData = null;
    let gatewayError = null;

    try {
      gatewayData = await initiateTapTapUpPayment({
        amount: paid,
        email: user.email || process.env.REVSOL_VENDOR_EMAIL || '',
        merchantReference: orderNo,
        paymentMethod: paymentMethod || 'Cash App',
      });
    } catch (err) {
      console.warn('[Payment Gateway Warning]', err.message);
      gatewayError = err.message;
    }

    const isGatewayOk = Boolean(gatewayData && gatewayData.success && gatewayData.redirectUrl);
    const finalGatewayError = gatewayError || (gatewayData && !gatewayData.success ? (gatewayData.message || gatewayData.error || 'Payment gateway returned an error') : null);

    const deposit = await DepositRequest.create({
      order_no: orderNo,
      user_id: user._id.toString(),
      username: user.username,
      payment_method: paymentMethod || 'Cash App',
      paid_amount: paid,
      received_amount: received,
      service_fee: 0.00,
      status: isGatewayOk ? 'Pending' : 'Created',
      wallet_balance_before: balanceBefore,
      wallet_balance_after: balanceAfter,
      sender_tag: finalSenderTag,
      transaction_proof: finalSenderTag,
      proof_image: (proof_image || '').trim(),
      payment_gateway: process.env.REVSOL_MERCHANT_NAME || 'Payment Gateway',
      product_id: gatewayData?.productId || getChannelProductId(paymentMethod) || 0,
      payment_token: gatewayData?.token || '',
      redirect_url: gatewayData?.redirectUrl || '',
      created_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes payment window
    });

    return NextResponse.json({
      success: true,
      message: isGatewayOk
        ? 'TapTapUp payment checkout initialized successfully!'
        : (finalGatewayError ? `Gateway notice: ${finalGatewayError}` : 'Order created successfully!'),
      orderNo: deposit.order_no,
      paidAmount: deposit.paid_amount,
      receivedAmount: deposit.received_amount,
      status: deposit.status,
      redirectUrl: gatewayData?.redirectUrl || null,
      token: gatewayData?.token || null,
      paymentGateway: deposit.payment_gateway,
      gatewayError: finalGatewayError,
      expiresAt: deposit.expires_at,
    });
  } catch (error) {
    console.error('[API Deposit Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

