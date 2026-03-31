<?php

namespace Tests\Feature\Chat;

use App\Enums\MessageType;
use App\Services\ChatEncryptionService;
use RuntimeException;
use Tests\TestCase;

class EncryptionServiceTest extends TestCase
{
    private ChatEncryptionService $crypto;

    protected function setUp(): void
    {
        parent::setUp();
        $this->crypto = app(ChatEncryptionService::class);
    }

    public function test_it_encrypts_and_decrypts_back_to_the_original_plaintext(): void
    {
        $original = 'Hello, this is a secret message!';
        $blob = $this->crypto->encrypt($original, conversationId: 1);

        $this->assertSame($original, $this->crypto->decrypt($blob, conversationId: 1));
    }

    public function test_it_produces_different_ciphertexts_for_the_same_plaintext_in_different_conversations(): void
    {
        $text = 'Same message';
        $blob1 = $this->crypto->encrypt($text, conversationId: 1);
        $blob2 = $this->crypto->encrypt($text, conversationId: 2);

        $this->assertNotSame($blob1, $blob2);
    }

    public function test_it_throws_a_runtime_exception_when_the_ciphertext_is_tampered(): void
    {
        $this->expectException(RuntimeException::class);

        $blob = $this->crypto->encrypt('Original text', conversationId: 5);

        // Decode, tamper with the ciphertext field, re-encode
        $data = json_decode(base64_decode($blob), associative: true);
        $raw = base64_decode($data['ciphertext']);
        $raw[0] = chr(ord($raw[0]) ^ 0xFF);
        $data['ciphertext'] = base64_encode($raw);
        $tampered = base64_encode(json_encode($data));

        $this->crypto->decrypt($tampered, conversationId: 5);
    }

    public function test_it_builds_a_payload_array_with_the_correct_version_type_and_text_keys(): void
    {
        $payload = $this->crypto->buildPayload(MessageType::Text, 'Hi there');

        $this->assertSame(1, $payload['version']);
        $this->assertSame('text', $payload['type']);
        $this->assertSame('Hi there', $payload['text']);
    }

    public function test_it_parses_a_valid_payload_json_string_into_the_expected_array_shape(): void
    {
        $payload = $this->crypto->buildPayload(MessageType::OrderRef, 'Your order shipped', ['order_id' => 42]);
        $json = json_encode($payload);

        $parsed = $this->crypto->parsePayload($json);

        $this->assertSame(1, $parsed['version']);
        $this->assertSame('order_ref', $parsed['type']);
        $this->assertSame('Your order shipped', $parsed['text']);
        $this->assertSame(42, $parsed['order_id']);
    }
}
