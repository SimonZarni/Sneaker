<?php

namespace Tests\Feature\Chat;

use App\Events\ChatMessageSent;
use App\Models\Admin;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ChatControllerTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function makeUser(): User
    {
        return User::factory()->create(['is_active' => true]);
    }

    private function makeConversation(User $user): ChatConversation
    {
        return ChatConversation::create([
            'user_id' => $user->id,
            'status' => 'open',
            'last_message_at' => now(),
        ]);
    }

    // ── ChatController ─────────────────────────────────────────────────────────

    public function test_chat_controller_send_stores_a_non_null_payload_that_differs_from_the_original_plaintext(): void
    {
        Event::fake();

        $user = $this->makeUser();

        $this->actingAs($user)
            ->postJson('/chat/send', ['text' => 'Hello support'])
            ->assertOk();

        $message = ChatMessage::first();

        $this->assertNotNull($message);
        $this->assertNotNull($message->payload);
        $this->assertNotSame('Hello support', $message->payload);
    }

    public function test_chat_controller_send_response_contains_text_matching_the_sent_message(): void
    {
        Event::fake();

        $user = $this->makeUser();

        $res = $this->actingAs($user)
            ->postJson('/chat/send', ['text' => 'Track my order please'])
            ->assertOk();

        $messageId = $res->json('id');

        $this->actingAs($user)
            ->getJson("/chat/message/{$messageId}")
            ->assertOk()
            ->assertJsonPath('text', 'Track my order please');
    }

    public function test_chat_message_sent_broadcast_payload_does_not_contain_body_or_text(): void
    {
        Event::fake();

        $user = $this->makeUser();

        $this->actingAs($user)
            ->postJson('/chat/send', ['text' => 'Secret message'])
            ->assertOk();

        Event::assertDispatched(ChatMessageSent::class, function (ChatMessageSent $event) {
            $payload = $event->broadcastWith();

            return ! array_key_exists('body', $payload)
                && ! array_key_exists('text', $payload);
        });
    }

    // ── AdminChatController ────────────────────────────────────────────────────

    public function test_admin_chat_controller_send_broadcast_payload_does_not_contain_body_or_text(): void
    {
        Event::fake();

        $user = $this->makeUser();
        $conversation = $this->makeConversation($user);
        $admin = Admin::factory()->create();
        /** @var Admin $admin */

        $this->actingAs($admin, 'admin')
            ->postJson("/admin/chat/{$conversation->id}/send", ['text' => 'Admin reply'])
            ->assertOk();

        Event::assertDispatched(ChatMessageSent::class, function (ChatMessageSent $event) {
            $payload = $event->broadcastWith();

            return ! array_key_exists('body', $payload)
                && ! array_key_exists('text', $payload);
        });
    }
}
