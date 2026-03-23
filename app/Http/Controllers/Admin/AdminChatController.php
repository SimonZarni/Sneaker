<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Events\ChatMessageSent;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminChatController extends Controller
{
    /**
     * Get or create the authenticated user's conversation.
     * Returns conversation id + last 50 messages.
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

        // Mark all admin messages as read when user opens chat
        $conversation->messages()
            ->where('sender_type', 'admin')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'conversation_id' => $conversation->id,
            'status'          => $conversation->status,
            'messages'        => $messages,
        ]);
    }

    /**
     * Send a message from the user.
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

        // Reopen closed conversations when user sends a new message
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

        broadcast(new ChatMessageSent($message, $conversation->load('user')));

        return response()->json(['ok' => true]);
    }

    /**
     * Unread count — how many admin messages the user hasn't read.
     */
    public function unread()
    {
        $user = Auth::user();

        $conversation = ChatConversation::where('user_id', $user->id)->first();

        $count = $conversation
            ? $conversation->messages()
                ->where('sender_type', 'admin')
                ->whereNull('read_at')
                ->count()
            : 0;

        return response()->json(['unread' => $count]);
    }
}
