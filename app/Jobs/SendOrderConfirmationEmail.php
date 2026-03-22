<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendOrderConfirmationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public Order $order)
    {
    }

    public function handle(): void
    {
        $order = $this->order->load(['items.product', 'payment', 'user']);

        if (!$order->user || !$order->user->email) {
            return;
        }

        try {
            // Render blade template to HTML string
            $htmlContent = view('emails.order-confirmation', ['order' => $order])->render();

            // Brevo transactional email API over HTTPS (port 443)
            // No SMTP, no blocked ports — plain HTTP POST
            $response = Http::withHeaders([
                'api-key'      => config('services.brevo.key'),
                'Content-Type' => 'application/json',
            ])->post('https://api.brevo.com/v3/smtp/email', [
                'subject'     => "Order Confirmed — {$order->order_number} | SNEAKER.DRP",
                'htmlContent' => $htmlContent,
                'sender'      => [
                    'name'  => config('mail.from.name'),
                    'email' => config('mail.from.address'),
                ],
                'to' => [
                    ['email' => $order->user->email, 'name' => $order->user->name],
                ],
            ]);

            if ($response->failed()) {
                Log::warning('Order confirmation email failed', [
                    'order_id' => $order->id,
                    'email'    => $order->user->email,
                    'status'   => $response->status(),
                    'body'     => $response->body(),
                ]);
            }

        } catch (\Exception $e) {
            Log::warning('Order confirmation email exception', [
                'order_id' => $order->id,
                'email'    => $order->user->email,
                'error'    => $e->getMessage(),
            ]);
        }
    }
}
