<?php

namespace App\Http\Controllers;

use App\Events\ChatMessageSent;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    /**
     * Load full conversation history.
     * Triggered when the user clicks to open the widget.
     */
    public function conversation()
    {
        $user = Auth::user();

        $conversation = ChatConversation::firstOrCreate(
            ['user_id' => $user->id],
            ['status' => 'open', 'last_message_at' => now()]
        );

        $messages = $conversation->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => [
                'id'          => $m->id,
                'sender_type' => $m->sender_type,
                'body'        => $m->body,
                'created_at'  => $m->created_at->toISOString(),
            ]);

        return response()->json([
            'conversation_id' => $conversation->id,
            'status'          => $conversation->status,
            'messages'        => $messages,
        ]);
    }

    /**
     * Store and broadcast a new message.
     */
    public function send(Request $request)
    {
        $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $user = Auth::user();

        $conversation = ChatConversation::firstOrCreate(
            ['user_id' => $user->id],
            ['status' => 'open', 'last_message_at' => now()]
        );

        if ($conversation->status === 'closed') {
            $conversation->update(['status' => 'open']);
        }

        $message = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type'     => 'user',
            'sender_id'       => $user->id,
            'body'            => $request->body,
        ]);

        $conversation->update(['last_message_at' => now()]);

        try {
            broadcast(new ChatMessageSent($message, $conversation->load('user')));
        } catch (\Throwable $e) {
            Log::warning('Chat broadcast failed: ' . $e->getMessage());
        }

        return response()->json(['ok' => true, 'id' => $message->id]);
    }

    /**
     * Mark all admin messages as read.
     */
    public function markRead()
    {
        $user = Auth::user();
        $conversation = ChatConversation::where('user_id', $user->id)->first();

        if ($conversation) {
            $conversation->messages()
                ->where('sender_type', 'admin')
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Returns unread count AND conversation_id for immediate subscription.
     */
    public function unread()
    {
        $user = Auth::user();

        // Ensure ID exists so frontend can subscribe on page load
        $conversation = ChatConversation::firstOrCreate(
            ['user_id' => $user->id],
            ['status' => 'open', 'last_message_at' => now()]
        );

        $count = $conversation->messages()
            ->where('sender_type', 'admin')
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'unread' => $count,
            'conversation_id' => $conversation->id
        ]);
    }
}
