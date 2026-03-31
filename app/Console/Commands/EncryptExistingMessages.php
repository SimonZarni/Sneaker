<?php

namespace App\Console\Commands;

use App\Enums\MessageType;
use App\Models\ChatMessage;
use App\Services\ChatEncryptionService;
use Illuminate\Console\Command;

class EncryptExistingMessages extends Command
{
    protected $signature = 'messages:encrypt {--dry-run : Report count without saving}';

    protected $description = 'Backfill AES-256-GCM encrypted payloads for legacy chat messages where payload is null';

    public function handle(ChatEncryptionService $crypto): int
    {
        $dryRun = $this->option('dry-run');
        $count = 0;

        ChatMessage::withTrashed()
            ->whereNull('payload')
            ->cursor()
            ->each(function (ChatMessage $message) use ($crypto, $dryRun, &$count) {
                $count++;

                if (! $dryRun) {
                    $payload = $crypto->encrypt(
                        json_encode($crypto->buildPayload(
                            MessageType::Text,
                            $message->body ?? ''
                        )),
                        $message->conversation_id
                    );

                    $message->updateQuietly(['payload' => $payload]);
                }

                if ($count % 100 === 0) {
                    $this->line("  Processed {$count}...");
                }
            });

        if ($dryRun) {
            $this->info("Dry run: {$count} message(s) would be encrypted.");
        } else {
            $this->info("Done: {$count} message(s) encrypted.");
        }

        return Command::SUCCESS;
    }
}
