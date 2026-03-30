<?php

namespace App\Console\Commands;

use App\Models\UserNotification;
use Illuminate\Console\Command;

class CleanupOldNotifications extends Command
{
    protected $signature = 'notifications:cleanup-old';
    protected $description = 'Delete user notifications older than 30 days';

    public function handle(): int
    {
        $deleted = UserNotification::where('occurred_at', '<', now()->subDays(30))->delete();

        $this->info("Deleted {$deleted} old notifications.");

        return self::SUCCESS;
    }
}
