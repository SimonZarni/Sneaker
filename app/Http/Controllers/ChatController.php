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

        // Mark admin messages as read when user opens chat
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

        // Save message to DB first — always succeeds regardless of Pusher
        $message = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type'     => 'user',
            'sender_id'       => $user->id,
            'body'            => $request->body,
        ]);

        $conversation->update(['last_message_at' => now()]);

        // Broadcast via Pusher — wrapped in try/catch so a Pusher failure
        // never prevents the message from being saved to the DB
        try {
            broadcast(new ChatMessageSent($message, $conversation->load('user')));
        } catch (\Throwable $e) {
            Log::warning('Chat broadcast failed', [
                'conversation_id' => $conversation->id,
                'error'           => $e->getMessage(),
            ]);
        }

        return response()->json(['ok' => true, 'id' => $message->id]);
    }

    /**
     * Mark all admin messages in the user's conversation as read.
     * Called by the frontend when the chat is opened or when an admin
     * message arrives while the chat window is already open.
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
