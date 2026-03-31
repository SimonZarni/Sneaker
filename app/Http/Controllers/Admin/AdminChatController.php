<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendMessageRequest;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AdminChatController extends Controller
{
    public function __construct(private ChatService $chat) {}

    public function index(): Response
    {
        $conversations = ChatConversation::with(['user', 'messages' => fn ($q) => $q->latest()->limit(1)])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'user_id' => $c->user_id,
                'user_name' => $c->user->name ?? 'Deleted User',
                'user_email' => $c->user->email ?? '',
                'status' => $c->status,
                'last_message_at' => $c->last_message_at?->toISOString(),
                'last_message' => $c->messages->first()?->body ?? '',
                'unread' => $c->messages()->where('sender_type', 'user')->whereNull('read_at')->count(),
            ]);

        return Inertia::render('Admin/Chat/Index', [
            'conversations' => $conversations,
            'totalUnread' => $conversations->sum('unread'),
            'admin' => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    public function messages(int $id): JsonResponse
    {
        $conversation = ChatConversation::with('user')->findOrFail($id);

        $conversation->messages()->where('sender_type', 'user')->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'user_name' => $conversation->user->name ?? 'Deleted User',
                'status' => $conversation->status,
            ],
            'messages' => $this->chat->getMessages($conversation),
        ]);
    }

    public function message(int $id): JsonResponse
    {
        return response()->json($this->chat->getSingleMessage(ChatMessage::findOrFail($id)));
    }

    public function send(SendMessageRequest $request, int $id): JsonResponse
    {
        $conversation = ChatConversation::with('user')->findOrFail($id);
        $admin = Auth::guard('admin')->user();

        $message = $this->chat->send(
            $conversation,
            'admin',
            $admin->id,
            $request->validated('text'),
            $request->messageType(),
            array_filter(['order_id' => $request->validated('order_id')])
        );

        return response()->json(['ok' => true, 'id' => $message->id]);
    }

    public function markRead(int $id): JsonResponse
    {
        ChatConversation::findOrFail($id)
            ->messages()->where('sender_type', 'user')->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    public function close(int $id): JsonResponse
    {
        ChatConversation::findOrFail($id)->update(['status' => 'closed']);

        return response()->json(['ok' => true]);
    }

    public function unread(): JsonResponse
    {
        return response()->json([
            'unread' => ChatMessage::where('sender_type', 'user')->whereNull('read_at')->count(),
        ]);
    }
}
