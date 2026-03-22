<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Confirmed — {{ $order->order_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: #f5f5f7;
            color: #0a0a0a;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
        }
        /* Header */
        .header {
            background-color: #0a0a0a;
            padding: 40px 48px;
            text-align: center;
        }
        .header-brand {
            font-size: 22px;
            font-weight: 900;
            letter-spacing: -0.04em;
            text-transform: uppercase;
            color: #ffffff;
        }
        .header-sub {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.4em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.35);
            margin-top: 6px;
        }
        /* Hero */
        .hero {
            padding: 48px 48px 36px;
            border-bottom: 1px solid #f0f0f0;
        }
        .hero-label {
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            color: rgba(45,50,62,0.35);
            margin-bottom: 10px;
        }
        .hero-title {
            font-size: 26px;
            font-weight: 900;
            letter-spacing: -0.04em;
            line-height: 1.1;
            margin-bottom: 14px;
        }
        .hero-body {
            font-size: 13px;
            font-weight: 500;
            color: rgba(45,50,62,0.6);
            line-height: 1.7;
        }
        /* Order meta */
        .meta-table { width: 100%; border-collapse: collapse; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; }
        .meta-cell { padding: 20px 24px; border-right: 1px solid #f0f0f0; width: 50%; vertical-align: top; }
        .meta-cell-last { padding: 20px 24px; width: 50%; vertical-align: top; }
        .meta-label {
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            color: rgba(45,50,62,0.35);
            margin-bottom: 5px;
        }
        .meta-value {
            font-size: 13px;
            font-weight: 900;
            letter-spacing: -0.01em;
        }
        /* Section */
        .section {
            padding: 32px 48px;
            border-bottom: 1px solid #f0f0f0;
        }
        .section-title {
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: rgba(45,50,62,0.35);
            margin-bottom: 20px;
        }
        /* Items */
        .items-table { width: 100%; border-collapse: collapse; }
        .items-table td { padding: 14px 0; border-bottom: 1px solid #f5f5f7; vertical-align: top; }
        .items-table tr:last-child td { border-bottom: none; }
        .item-name { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 4px; }
        .item-meta { font-size: 10px; font-weight: 600; color: rgba(45,50,62,0.45); text-transform: uppercase; letter-spacing: 0.05em; }
        .item-price { font-size: 13px; font-weight: 900; font-variant-numeric: tabular-nums; white-space: nowrap; text-align: right; padding-left: 24px; }
        /* Totals */
        .totals { padding: 0 48px 32px; }
        .totals table { width: 100%; border-collapse: collapse; }
        .totals td { padding: 9px 0; border-bottom: 1px solid #f5f5f7; vertical-align: middle; }
        .totals tr:last-child td { border-bottom: none; }
        .total-label {
            font-size: 10px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.15em;
            color: rgba(45,50,62,0.5); text-align: left;
        }
        .total-value {
            font-size: 12px; font-weight: 900;
            font-variant-numeric: tabular-nums;
            text-align: right; white-space: nowrap;
        }
        .grand .total-label { font-size: 11px; font-weight: 900; color: #0a0a0a; }
        .grand .total-value { font-size: 20px; font-weight: 900; letter-spacing: -0.03em; }
        /* Address */
        .address-block {
            font-size: 12px;
            font-weight: 600;
            color: rgba(45,50,62,0.7);
            line-height: 1.8;
        }
        .address-name {
            font-size: 13px;
            font-weight: 900;
            color: #0a0a0a;
            margin-bottom: 4px;
        }
        /* CTA */
        .cta-section {
            padding: 32px 48px;
            text-align: center;
            border-bottom: 1px solid #f0f0f0;
        }
        .cta-button {
            display: inline-block;
            background-color: #0a0a0a;
            color: #ffffff;
            text-decoration: none;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            padding: 16px 40px;
        }
        /* Footer */
        .footer {
            padding: 32px 48px;
            text-align: center;
            background-color: #f5f5f7;
        }
        .footer-text {
            font-size: 10px;
            font-weight: 600;
            color: rgba(45,50,62,0.4);
            line-height: 1.8;
        }
        .footer-brand {
            font-size: 11px;
            font-weight: 900;
            letter-spacing: -0.02em;
            text-transform: uppercase;
            color: rgba(45,50,62,0.5);
            margin-bottom: 6px;
        }
    </style>
</head>
<body>
    <div class="wrapper">

        {{-- Header --}}
        <div class="header">
            <div class="header-brand">SNEAKER.DRP</div>
            <div class="header-sub">Order Confirmation</div>
        </div>

        {{-- Hero --}}
        <div class="hero">
            <div class="hero-label">Your order is confirmed</div>
            <div class="hero-title">Thanks, {{ explode(' ', $order->shipping_full_name)[0] }}. 👟</div>
            <div class="hero-body">
                We've received your order and it's now being processed.
                You'll receive an update when your order ships.
            </div>
        </div>

        {{-- Order meta --}}
        <table class="meta-table">
            <tr>
                <td class="meta-cell">
                    <div class="meta-label">Order Number</div>
                    <div class="meta-value">{{ $order->order_number }}</div>
                </td>
                <td class="meta-cell-last">
                    <div class="meta-label">Date Placed</div>
                    <div class="meta-value">{{ $order->placed_at->format('M j, Y') }}</div>
                </td>
            </tr>
            <tr>
                <td class="meta-cell" style="border-top: 1px solid #f0f0f0;">
                    <div class="meta-label">Payment</div>
                    <div class="meta-value">
                        {{ $order->payment?->payment_method === 'COD' ? 'Cash on Delivery' : 'Credit Card' }}
                    </div>
                </td>
                <td class="meta-cell-last" style="border-top: 1px solid #f0f0f0;">
                    <div class="meta-label">Status</div>
                    <div class="meta-value">{{ $order->delivery_status }}</div>
                </td>
            </tr>
        </table>

        {{-- Order Items --}}
        <div class="section">
            <div class="section-title">Order Summary</div>
            <table class="items-table">
                @foreach($order->items as $item)
                <tr>
                    <td>
                        <div class="item-name">{{ $item->product_name }}</div>
                        <div class="item-meta">
                            {{ $item->brand_name }} &nbsp;·&nbsp;
                            {{ $item->color_name }} &nbsp;·&nbsp;
                            US {{ $item->size_value }} &nbsp;·&nbsp;
                            Qty {{ $item->quantity }}
                        </div>
                    </td>
                    <td class="item-price">${{ number_format($item->subtotal, 2) }}</td>
                </tr>
                @endforeach
            </table>
        </div>

        {{-- Totals --}}
        <div class="totals" style="padding-top: 24px;">
            @php
                $subtotal = $order->items->sum(fn($i) => (float) $i->subtotal);
                $shipping = (float) $order->shipping_fee;
            @endphp
            <table>
                <tr>
                    <td class="total-label">Subtotal</td>
                    <td class="total-value">${{ number_format($subtotal, 2) }}</td>
                </tr>
                <tr>
                    <td class="total-label">Shipping</td>
                    <td class="total-value">{{ $shipping > 0 ? '$' . number_format($shipping, 2) : 'Free' }}</td>
                </tr>
                <tr class="grand">
                    <td class="total-label">Total Charged</td>
                    <td class="total-value">${{ number_format($order->total_amount, 2) }}</td>
                </tr>
            </table>
        </div>

        {{-- Shipping Address --}}
        <div class="section">
            <div class="section-title">Shipping To</div>
            <div class="address-name">{{ $order->shipping_full_name }}</div>
            <div class="address-block">
                {{ $order->shipping_phone }}<br>
                {{ $order->shipping_address_line }}<br>
                {{ $order->shipping_city }}{{ $order->shipping_state_region ? ', ' . $order->shipping_state_region : '' }}
                {{ $order->shipping_postal_code }}<br>
                {{ $order->shipping_country }}
            </div>
        </div>

        {{-- CTA --}}
        <div class="cta-section">
            <p style="font-size: 12px; color: rgba(45,50,62,0.5); margin-bottom: 20px; font-weight: 600;">
                Track your order status anytime in your account.
            </p>
            <a href="{{ config('app.url') }}/orders/{{ $order->id }}" class="cta-button">
                View Order Details →
            </a>
        </div>

        {{-- Footer --}}
        <div class="footer">
            <div class="footer-brand">SNEAKER.DRP</div>
            <div class="footer-text">
                Questions? Contact us at support@sneaker.drp<br>
                You're receiving this because you placed an order with us.
            </div>
        </div>

    </div>
</body>
</html>
