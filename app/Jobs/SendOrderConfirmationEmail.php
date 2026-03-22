<?php

namespace App\Jobs;

use App\Mail\OrderConfirmation;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendOrderConfirmationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times to attempt the job before marking as failed.
     * Keeps retrying if the mail server is temporarily unavailable.
     */
    public int $tries = 3;

    /**
     * Wait 60 seconds between retries.
     */
    public int $backoff = 60;

    public function __construct(public Order $order)
    {
    }

    public function handle(): void
    {
        // Re-load the order with all relationships needed for the email
        $order = $this->order->load(['items.product', 'payment', 'user']);

        // Silently skip if no user or no email — covers fake/missing emails
        // by catching the mail exception rather than crashing the job.
        if (!$order->user || !$order->user->email) {
            return;
        }

        try {
            Mail::to($order->user->email)
                ->send(new OrderConfirmation($order));
        } catch (\Exception $e) {
            // Email delivery failed (invalid address, SMTP rejection, etc.)
            // Log it but don't re-throw — a failed email should never affect
            // the customer's order which is already confirmed in the DB.
            \Illuminate\Support\Facades\Log::warning('Order confirmation email failed', [
                'order_id' => $order->id,
                'email'    => $order->user->email,
                'error'    => $e->getMessage(),
            ]);
        }
    }
}
