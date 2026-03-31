<?php

namespace Tests\Feature\Chat;

use App\Models\ChatConversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EncryptExistingMessagesCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_reports_zero_and_exits_successfully_when_all_messages_already_have_payloads(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $conversation = ChatConversation::create([
            'user_id' => $user->id,
            'status' => 'open',
            'last_message_at' => now(),
        ]);

        /** @var \App\Services\ChatService $chat */
        $chat = app(\App\Services\ChatService::class);
        $chat->send($conversation, 'user', $user->id, 'Already encrypted');

        $this->artisan('messages:encrypt')
            ->expectsOutput('Done: 0 message(s) encrypted.')
            ->assertSuccessful();
    }

    public function test_dry_run_also_reports_zero_when_no_legacy_messages_remain(): void
    {
        $this->artisan('messages:encrypt --dry-run')
            ->expectsOutput('Dry run: 0 message(s) would be encrypted.')
            ->assertSuccessful();
    }
}
