<?php

namespace App\Http\Controllers\Admin;

use App\Events\ChatMessageSent;
use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AdminChatController extends Controller
{
    /**
     * Admin chat index — all conversations.
     */
    public function index()
    {
        $conversations = ChatConversation::with(['user', 'messages' => fn($q) => $q->latest()->limit(1)])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(fn($c) => [
                'id'              => $c->id,
                'user_id'         => $c->user_id,
                'user_name'       => $c->user->name ?? 'Deleted User',
                'user_email'      => $c->user->email ?? '',
                'status'          => $c->status,
                'last_message_at' => $c->last_message_at?->toISOString(),
                'last_message'    => $c->messages->first()?->body ?? '',
                'unread'          => $c->messages()
                    ->where('sender_type', 'user')
                    ->whereNull('read_at')
                    ->count(),
            ]);

        $totalUnread = $conversations->sum('unread');

        return Inertia::render('Admin/Chat/Index', [
            'conversations' => $conversations,
            'totalUnread'   => $totalUnread,
            'admin'         => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    /**
     * Get messages for a specific conversation.
     */
    public function messages(int $id)
    {
        $conversation = ChatConversation::with('user')->findOrFail($id);

        $messages = $conversation->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => [
                'id'          => $m->id,
                'sender_type' => $m->sender_type,
                'body'        => $m->body,
                'created_at'  => $m->created_at->toISOString(),
            ]);

        // Mark all user messages as read when admin opens conversation
        $conversation->messages()
            ->where('sender_type', 'user')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'conversation' => [
                'id'        => $conversation->id,
                'user_name' => $conversation->user->name ?? 'Deleted User',
                'status'    => $conversation->status,
            ],
            'messages' => $messages,
        ]);
    }

    /**
     * Send a message from admin to user.
     */
    public function send(Request $request, int $id)
    {
        $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $conversation = ChatConversation::with('user')->findOrFail($id);

        $admin = Auth::guard('admin')->user();

        $message = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type'     => 'admin',
            'sender_id'       => $admin->id,
            'body'            => $request->body,
        ]);

        $conversation->update(['last_message_at' => now()]);

        try {
            broadcast(new ChatMessageSent($message, $conversation));
        } catch (\Throwable $e) {
            Log::warning('Admin chat broadcast failed', [
                'conversation_id' => $conversation->id,
                'error'           => $e->getMessage(),
            ]);
        }

        return response()->json(['ok' => true, 'id' => $message->id]);
    }

    /**
     * Mark all user messages in a conversation as read.
     * Called when admin receives a Pusher message while the conversation is open.
     */
    public function markRead(int $id)
    {
        $conversation = ChatConversation::findOrFail($id);

        $conversation->messages()
            ->where('sender_type', 'user')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    /**
     * Close a conversation.
     */
    public function close(int $id)
    {
        ChatConversation::findOrFail($id)->update(['status' => 'closed']);
        return response()->json(['ok' => true]);
    }

    /**
     * Total unread count across all conversations — for admin badge.
     */
    public function unread()
    {
        $count = ChatMessage::where('sender_type', 'user')
            ->whereNull('read_at')
            ->count();

        return response()->json(['unread' => $count]);
    }
}
