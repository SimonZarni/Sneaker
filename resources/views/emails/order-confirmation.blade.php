<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmed — {{ $order->order_number }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #0a0a0a; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; }
        .header { background: #0a0a0a; padding: 40px 48px; }
        .header-logo { color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: -0.04em; text-transform: uppercase; text-decoration: none; }
        .header-label { color: rgba(255,255,255,0.3); font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4em; margin-top: 24px; }
        .header-title { color: #ffffff; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.03em; margin-top: 8px; line-height: 1.1; }
        .body { padding: 48px; }
        .greeting { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
        .subtext { font-size: 13px; color: rgba(45,50,62,0.6); line-height: 1.6; margin-bottom: 32px; }
        .section-label { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; color: rgba(45,50,62,0.3); margin-bottom: 16px; }
        .info-box { border: 1px solid #f0f0f0; padding: 24px; margin-bottom: 32px; }
        .info-row { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(45,50,62,0.4); }
        .info-value { font-size: 12px; font-weight: 700; text-align: right; }
        .payment-badge { display: inline-block; padding: 3px 10px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
        .badge-card { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
        .badge-cod  { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        .items-table th { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(45,50,62,0.25); padding: 0 0 12px 0; text-align: left; border-bottom: 1px solid #f0f0f0; }
        .items-table th:last-child { text-align: right; }
        .items-table td { padding: 16px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top; font-size: 12px; }
        .items-table tr:last-child td { border-bottom: none; }
        .item-name { font-weight: 900; text-transform: uppercase; font-size: 11px; letter-spacing: -0.01em; }
        .item-meta { font-size: 10px; color: rgba(45,50,62,0.4); font-weight: 600; margin-top: 3px; }
        .item-subtotal { text-align: right; font-weight: 900; font-size: 12px; font-variant-numeric: tabular-nums; }
        .totals { border-top: 2px solid #0a0a0a; padding-top: 20px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
        .total-row.grand { padding-top: 14px; margin-top: 8px; border-top: 1px solid #f0f0f0; }
        .total-row.grand .total-label { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
        .total-row.grand .total-amount { font-size: 20px; font-weight: 900; font-variant-numeric: tabular-nums; }
        .total-label { color: rgba(45,50,62,0.5); font-weight: 600; }
        .total-amount { font-weight: 700; font-variant-numeric: tabular-nums; }
        .shipping-box { border: 1px solid #f0f0f0; padding: 24px; margin-bottom: 32px; }
        .shipping-address { font-size: 13px; font-weight: 600; line-height: 1.8; color: rgba(45,50,62,0.7); }
        .cod-notice { background: #fffbeb; border: 1px solid #fde68a; padding: 20px 24px; margin-bottom: 32px; }
        .cod-notice-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #b45309; margin-bottom: 6px; }
        .cod-notice-text { font-size: 12px; color: #92400e; line-height: 1.6; }
        .cta { text-align: center; margin-bottom: 40px; }
        .cta-button { display: inline-block; background: #0a0a0a; color: #ffffff; padding: 16px 40px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; text-decoration: none; }
        .footer { background: #f5f5f5; padding: 32px 48px; border-top: 1px solid #eeeeee; }
        .footer-text { font-size: 11px; color: rgba(45,50,62,0.4); line-height: 1.7; }
        .footer-brand { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(45,50,62,0.25); margin-top: 16px; }
    </style>
</head>
<body>
<div class="wrapper">

    {{-- Header --}}
    <div class="header">
        <div class="header-logo">SNEAKER.DRP</div>
        <div class="header-label">Order Confirmation</div>
        <div class="header-title">Drop Secured.<br>You're Good.</div>
    </div>

    <div class="body">

        {{-- Greeting --}}
        <p class="greeting">Hey {{ $order->user->name }},</p>
        <p class="subtext">
            Your order has been confirmed and is being processed.
            @if($order->payment?->payment_method === 'Credit Card')
                Your payment has been received.
            @else
                Payment will be collected upon delivery.
            @endif
        </p>

        {{-- Order Info --}}
        <div class="section-label">Order Details</div>
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Order Number</span>
                <span class="info-value" style="font-family: monospace; font-size: 13px; font-weight: 900;">{{ $order->order_number }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date</span>
                <span class="info-value">{{ $order->placed_at->format('M d, Y — g:i A') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Payment</span>
                <span class="info-value">
                    @if($order->payment?->payment_method === 'Credit Card')
                        <span class="payment-badge badge-card">
                            ✓ Paid — Card ending {{ $order->payment->card_last4 }}
                        </span>
                    @else
                        <span class="payment-badge badge-cod">Cash on Delivery</span>
                    @endif
                </span>
            </div>
            <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value">{{ $order->delivery_status }}</span>
            </div>
        </div>

        {{-- COD Notice --}}
        @if($order->payment?->payment_method !== 'Credit Card')
        <div class="cod-notice">
            <div class="cod-notice-title">💳 Cash on Delivery</div>
            <div class="cod-notice-text">
                Please have <strong>${{ number_format($order->total_amount, 2) }}</strong> ready when your order arrives.
                Our delivery team will collect payment upon handover.
            </div>
        </div>
        @endif

        {{-- Items --}}
        <div class="section-label">Items Ordered</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th style="text-align:right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $item)
                <tr>
                    <td>
                        <div class="item-name">{{ $item->product_name }}</div>
                        <div class="item-meta">
                            {{ $item->brand_name }} &middot; {{ $item->color_name }} / {{ $item->size_value }}
                            &middot; Qty: {{ $item->quantity }}
                            &middot; ${{ number_format($item->unit_price, 2) }} each
                        </div>
                    </td>
                    <td class="item-subtotal">${{ number_format($item->subtotal, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        {{-- Totals --}}
        <div class="totals">
            @php $subtotal = $order->total_amount - $order->shipping_fee; @endphp
            <div class="total-row">
                <span class="total-label">Subtotal</span>
                <span class="total-amount">${{ number_format($subtotal, 2) }}</span>
            </div>
            <div class="total-row">
                <span class="total-label">Shipping</span>
                <span class="total-amount">
                    @if($order->shipping_fee > 0)
                        ${{ number_format($order->shipping_fee, 2) }}
                    @else
                        Free
                    @endif
                </span>
            </div>
            <div class="total-row grand">
                <span class="total-label">Total</span>
                <span class="total-amount">${{ number_format($order->total_amount, 2) }}</span>
            </div>
        </div>

        {{-- Shipping Address --}}
        <div class="section-label" style="margin-top: 32px;">Shipping To</div>
        <div class="shipping-box">
            <div class="shipping-address">
                {{ $order->shipping_full_name }}<br>
                {{ $order->shipping_address_line }}<br>
                {{ $order->shipping_city }}@if($order->shipping_state_region), {{ $order->shipping_state_region }}@endif<br>
                @if($order->shipping_postal_code){{ $order->shipping_postal_code }}<br>@endif
                {{ $order->shipping_country }}<br>
                <span style="color: rgba(45,50,62,0.5);">{{ $order->shipping_phone }}</span>
            </div>
        </div>

        {{-- CTA --}}
        <div class="cta">
            <a href="{{ config('app.url') }}/orders/{{ $order->id }}" class="cta-button">
                View Your Order →
            </a>
        </div>

    </div>

    {{-- Footer --}}
    <div class="footer">
        <p class="footer-text">
            You received this email because an order was placed on SNEAKER.DRP using this email address.
            If you did not place this order, please contact us immediately.
        </p>
        <p class="footer-brand">SNEAKER.DRP — Members Only Access</p>
    </div>

</div>
</body>
</html>
