<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Invoice {{ $order['order_number'] }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 10px;
            color: #1a1a1a;
            background: #ffffff;
            padding: 48px 48px 40px;
        }

        /* ── Header ── */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 28px;
            border-bottom: 2px solid #1a1a1a;
        }
        .brand {
            font-size: 26px;
            font-weight: 900;
            letter-spacing: -0.5px;
            text-transform: uppercase;
            color: #1a1a1a;
        }
        .brand-tagline {
            font-size: 7.5px;
            font-weight: 700;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            color: #888;
            margin-top: 4px;
        }
        .invoice-meta {
            text-align: right;
        }
        .invoice-label {
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #1a1a1a;
        }
        .invoice-number {
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: #888;
            margin-top: 5px;
        }
        .invoice-date {
            font-size: 8px;
            font-weight: 700;
            color: #555;
            margin-top: 3px;
        }

        /* ── Status badge ── */
        .status-row {
            margin-bottom: 28px;
        }
        .status-badge {
            display: inline-block;
            font-size: 7px;
            font-weight: 900;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            padding: 4px 10px;
            border: 1px solid;
        }
        .status-confirmed  { color: #065f46; background: #ecfdf5; border-color: #a7f3d0; }
        .status-cancelled  { color: #991b1b; background: #fef2f2; border-color: #fca5a5; }
        .status-pending    { color: #92400e; background: #fffbeb; border-color: #fcd34d; }
        .status-delivered  { color: #065f46; background: #ecfdf5; border-color: #a7f3d0; }

        /* ── Two-column info ── */
        .info-grid {
            display: flex;
            gap: 0;
            margin-bottom: 32px;
        }
        .info-col {
            flex: 1;
            padding-right: 24px;
        }
        .info-col:last-child {
            padding-right: 0;
            padding-left: 24px;
            border-left: 1px solid #e5e5e5;
        }
        .info-label {
            font-size: 7px;
            font-weight: 900;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            color: #aaa;
            margin-bottom: 8px;
        }
        .info-value {
            font-size: 10px;
            font-weight: 700;
            color: #1a1a1a;
            line-height: 1.6;
        }
        .info-value-secondary {
            font-size: 9px;
            color: #555;
            line-height: 1.6;
        }

        /* ── Items table ── */
        .section-title {
            font-size: 7px;
            font-weight: 900;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            color: #aaa;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
        }
        thead th {
            font-size: 7px;
            font-weight: 900;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: #888;
            padding: 8px 10px;
            background: #f5f5f5;
            border-bottom: 1px solid #e5e5e5;
            text-align: left;
        }
        thead th.right { text-align: right; }
        tbody td {
            font-size: 9.5px;
            font-weight: 600;
            padding: 10px 10px;
            border-bottom: 1px solid #f0f0f0;
            vertical-align: top;
            color: #1a1a1a;
        }
        tbody td.right { text-align: right; font-weight: 700; }
        tbody td.muted { color: #777; font-size: 8.5px; margin-top: 2px; }
        .product-meta {
            font-size: 8px;
            color: #888;
            font-weight: 600;
            margin-top: 2px;
        }

        /* ── Totals ── */
        .totals-wrap {
            margin-top: 0;
            display: flex;
            justify-content: flex-end;
        }
        .totals-table {
            width: 240px;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 5px 10px;
            font-size: 9px;
            font-weight: 600;
            color: #555;
            border: none;
        }
        .totals-table td.label { text-align: left; }
        .totals-table td.amount { text-align: right; }
        .totals-table tr.total-row td {
            font-size: 12px;
            font-weight: 900;
            color: #1a1a1a;
            padding-top: 10px;
            border-top: 2px solid #1a1a1a;
        }

        /* ── Divider ── */
        .divider {
            border: none;
            border-top: 1px solid #e5e5e5;
            margin: 28px 0;
        }

        /* ── Footer ── */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .footer-left {
            font-size: 7.5px;
            font-weight: 700;
            color: #bbb;
            letter-spacing: 0.1em;
            line-height: 1.8;
        }
        .footer-right {
            font-size: 7px;
            font-weight: 900;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: #ccc;
        }
    </style>
</head>
<body>

    {{-- ── Header ── --}}
    <div class="header">
        <div>
            <div class="brand">SNEAKER.DRP</div>
            <div class="brand-tagline">zarnidev.online</div>
        </div>
        <div class="invoice-meta">
            <div class="invoice-label">Invoice</div>
            <div class="invoice-number">{{ $order['order_number'] }}</div>
            <div class="invoice-date">{{ $placedAt }}</div>
        </div>
    </div>

    {{-- ── Delivery status ── --}}
    <div class="status-row">
        @php
            $statusClass = match($order['delivery_status']) {
                'Delivered'  => 'status-delivered',
                'Cancelled'  => 'status-cancelled',
                'Pending'    => 'status-pending',
                default      => 'status-confirmed',
            };
        @endphp
        <span class="status-badge {{ $statusClass }}">{{ $order['delivery_status'] }}</span>
        &nbsp;
        @php
            $payClass = match($order['payment_status']) {
                'Confirmed'  => 'status-confirmed',
                'Refunded'   => 'status-cancelled',
                'COD'        => 'status-pending',
                default      => 'status-pending',
            };
        @endphp
        <span class="status-badge {{ $payClass }}">Payment: {{ $order['payment_status'] }}</span>
    </div>

    {{-- ── Bill To / Ship To ── --}}
    <div class="info-grid">
        <div class="info-col">
            <div class="info-label">Ship To</div>
            <div class="info-value">{{ $order['shipping_full_name'] }}</div>
            <div class="info-value-secondary">
                {{ $order['shipping_address_line'] }}<br>
                {{ $order['shipping_city'] }}@if($order['shipping_state_region']), {{ $order['shipping_state_region'] }}@endif
                @if($order['shipping_postal_code']) {{ $order['shipping_postal_code'] }}@endif<br>
                {{ $order['shipping_country'] }}<br>
                {{ $order['shipping_phone'] }}
            </div>
        </div>
        <div class="info-col">
            <div class="info-label">Payment</div>
            <div class="info-value">{{ $order['payment_method'] ?? 'N/A' }}</div>
            @if($order['cardholder_name'])
            <div class="info-value-secondary">
                {{ $order['cardholder_name'] }}<br>
                Card ending in {{ $order['card_last4'] }}
            </div>
            @elseif(($order['payment_method'] ?? '') === 'COD')
            <div class="info-value-secondary">Collected on delivery</div>
            @endif
        </div>
    </div>

    {{-- ── Items ── --}}
    <div class="section-title">Order Items</div>
    <table>
        <thead>
            <tr>
                <th>Product</th>
                <th>Size / Color</th>
                <th class="right">Unit Price</th>
                <th class="right">Qty</th>
                <th class="right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order['items'] as $item)
            <tr>
                <td>
                    <strong>{{ $item['brand_name'] }}</strong> {{ $item['product_name'] }}
                </td>
                <td>{{ $item['size_value'] }} / {{ $item['color_name'] }}</td>
                <td class="right">${{ number_format((float)$item['unit_price'], 2) }}</td>
                <td class="right">{{ $item['quantity'] }}</td>
                <td class="right">${{ number_format((float)$item['subtotal'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- ── Totals ── --}}
    <div class="totals-wrap">
        <table class="totals-table">
            <tr>
                <td class="label">Subtotal</td>
                <td class="amount">${{ number_format($subtotal, 2) }}</td>
            </tr>
            <tr>
                <td class="label">Shipping</td>
                <td class="amount">
                    @if($shippingFee > 0)
                        ${{ number_format($shippingFee, 2) }}
                    @else
                        Free
                    @endif
                </td>
            </tr>
            <tr>
                <td class="label">Tax (7%)</td>
                <td class="amount">${{ number_format($tax, 2) }}</td>
            </tr>
            <tr class="total-row">
                <td class="label">Total</td>
                <td class="amount">${{ number_format((float)$order['total_amount'], 2) }}</td>
            </tr>
        </table>
    </div>

    {{-- ── Footer ── --}}
    <div class="footer">
        <div class="footer-left">
            Thank you for your purchase.<br>
            For support, visit zarnidev.online
        </div>
        <div class="footer-right">SNEAKER.DRP &copy; {{ date('Y') }}</div>
    </div>

</body>
</html>
