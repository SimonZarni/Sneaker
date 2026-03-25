<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateVapidKeys extends Command
{
    protected $signature   = 'vapid:generate {--show : Only display, do not write to .env}';
    protected $description = 'Generate VAPID public/private key pair for Web Push';

    public function handle(): int
    {
        // Uses the openssl extension (available in all PHP installations)
        $keyPair = \Minishlink\WebPush\VAPID::createVapidKeys();

        $publicKey  = $keyPair['publicKey'];
        $privateKey = $keyPair['privateKey'];

        $this->info('');
        $this->line('<fg=green>VAPID keys generated successfully!</>');
        $this->info('');
        $this->line("VAPID_PUBLIC_KEY={$publicKey}");
        $this->line("VAPID_PRIVATE_KEY={$privateKey}");
        $this->line('VAPID_SUBJECT=mailto:' . config('mail.from.address', 'hello@example.com'));
        $this->info('');

        if (!$this->option('show')) {
            // Append to .env if the keys aren't already there
            $envPath = base_path('.env');
            $envContents = file_get_contents($envPath);

            if (!str_contains($envContents, 'VAPID_PUBLIC_KEY=')) {
                file_put_contents($envPath, "\n# Web Push (VAPID)\nVAPID_PUBLIC_KEY={$publicKey}\nVAPID_PRIVATE_KEY={$privateKey}\nVAPID_SUBJECT=mailto:" . config('mail.from.address', 'hello@example.com') . "\n", FILE_APPEND);
                $this->line('<fg=yellow>Keys appended to .env</>');
            } else {
                $this->warn('.env already contains VAPID_PUBLIC_KEY — keys NOT written. Use --show to view them.');
            }

            $this->info('');
            $this->line('<fg=yellow>Also add VITE_VAPID_PUBLIC_KEY to .env so the frontend can use it:</>');
            $this->line("VITE_VAPID_PUBLIC_KEY={$publicKey}");
        }

        $this->info('');
        $this->line('Next: add these to config/services.php → vapid section, then run php artisan config:cache');
        $this->info('');

        return self::SUCCESS;
    }
}
