<?php

namespace Tests\Feature\Chat;

use App\Models\Admin;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use App\Services\ChatEncryptionService;
use App\Services\ChatService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class AdminChatControllerTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::factory()->create(['is_active' => true]);
    }

    private function makeAdmin(): Admin
    {
        return Admin::factory()->create();
    }

    private function makeConversation(User $user): ChatConversation
    {
        return ChatConversation::create([
            'user_id' => $user->id,
            'status' => 'open',
            'last_message_at' => now(),
        ]);
    }

    // ── index: last_message ────────────────────────────────────────────────────

    public function test_admin_index_last_message_shows_decrypted_text_for_encrypted_messages(): void
    {
        $user = $this->makeUser();
        $admin = $this->makeAdmin();
        $conversation = $this->makeConversation($user);

        /** @var ChatService $chat */
        $chat = app(ChatService::class);
        $chat->send($conversation, 'user', $user->id, 'Hi, I need help');

        $this->actingAs($admin, 'admin')
            ->get('/admin/chat')
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Admin/Chat/Index')
                    ->where('conversations.0.last_message', 'Hi, I need help')
            );
    }

    public function test_admin_index_last_message_is_empty_string_when_conversation_has_no_messages(): void
    {
        $user = $this->makeUser();
        $admin = $this->makeAdmin();
        $this->makeConversation($user);

        $this->actingAs($admin, 'admin')
            ->get('/admin/chat')
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Admin/Chat/Index')
                    ->where('conversations.0.last_message', '')
            );
    }

    // ── send ──────────────────────────────────────────────────────────────────

    public function test_admin_send_stores_encrypted_payload(): void
    {
        Event::fake();

        $user = $this->makeUser();
        $admin = $this->makeAdmin();
        $conversation = $this->makeConversation($user);

        $this->actingAs($admin, 'admin')
            ->postJson("/admin/chat/{$conversation->id}/send", ['text' => 'Your order is ready'])
            ->assertOk();

        $message = ChatMessage::first();

        $this->assertNotNull($message->payload);
        $this->assertNotSame('Your order is ready', $message->payload);
    }

    public function test_admin_send_decrypted_payload_matches_sent_text(): void
    {
        Event::fake();

        $user = $this->makeUser();
        $admin = $this->makeAdmin();
        $conversation = $this->makeConversation($user);

        $this->actingAs($admin, 'admin')
            ->postJson("/admin/chat/{$conversation->id}/send", ['text' => 'Confirmed shipment'])
            ->assertOk();

        $message = ChatMessage::first();

        /** @var ChatEncryptionService $crypto */
        $crypto = app(ChatEncryptionService::class);
        $parsed = $crypto->parsePayload($crypto->decrypt($message->payload, $message->conversation_id));

        $this->assertSame('Confirmed shipment', $parsed['text']);
    }
}
