<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendMessageRequest;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    public function __construct(private ChatService $chat) {}

    public function conversation(): JsonResponse
    {
        $conversation = ChatConversation::firstOrCreate(
            ['user_id' => Auth::id()],
            ['status' => 'open', 'last_message_at' => now()]
        );

        return response()->json([
            'conversation_id' => $conversation->id,
            'status' => $conversation->status,
            'messages' => $this->chat->getMessages($conversation),
        ]);
    }

    public function send(SendMessageRequest $request): JsonResponse
    {
        $conversation = ChatConversation::firstOrCreate(
            ['user_id' => Auth::id()],
            ['status' => 'open', 'last_message_at' => now()]
        );

        if ($conversation->status === 'closed') {
            $conversation->update(['status' => 'open']);
        }

        $message = $this->chat->send(
            $conversation,
            'user',
            Auth::id(),
            $request->validated('text'),
            $request->messageType(),
            array_filter(['order_id' => $request->validated('order_id')])
        );

        return response()->json(['ok' => true, 'id' => $message->id]);
    }

    public function message(int $id): JsonResponse
    {
        $message = ChatMessage::whereHas(
            'conversation',
            fn ($q) => $q->where('user_id', Auth::id())
        )->findOrFail($id);

        return response()->json($this->chat->getSingleMessage($message));
    }

    public function markRead(): JsonResponse
    {
        $conversation = ChatConversation::where('user_id', Auth::id())->first();

        $conversation?->messages()
            ->where('sender_type', 'admin')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    public function unread(): JsonResponse
    {
        $conversation = ChatConversation::firstOrCreate(
            ['user_id' => Auth::id()],
            ['status' => 'open', 'last_message_at' => now()]
        );

        return response()->json([
            'unread' => $conversation->messages()->where('sender_type', 'admin')->whereNull('read_at')->count(),
            'conversation_id' => $conversation->id,
        ]);
    }
}
