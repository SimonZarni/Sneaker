<?php

namespace App\Services;

use App\Enums\MessageType;
use RuntimeException;
use UnexpectedValueException;

class ChatEncryptionService
{
    private const CIPHER = 'aes-256-gcm';

    private const IV_LEN = 12;

    private const TAG_LEN = 16;

    private const VERSION = 1;

    /**
     * Derive a 32-byte conversation-scoped key via HMAC-SHA256, encrypt
     * $plaintext with AES-256-GCM, and return a base64-encoded JSON blob
     * containing { iv, ciphertext, tag } (each individually base64-encoded).
     */
    public function encrypt(string $plaintext, int $conversationId): string
    {
        $key = $this->deriveKey($conversationId);
        $iv = random_bytes(self::IV_LEN);
        $tag = '';
        $ciphertext = openssl_encrypt(
            $plaintext,
            self::CIPHER,
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            self::TAG_LEN
        );

        if ($ciphertext === false) {
            throw new RuntimeException('AES-256-GCM encryption failed.');
        }

        return base64_encode(json_encode([
            'iv' => base64_encode($iv),
            'ciphertext' => base64_encode($ciphertext),
            'tag' => base64_encode($tag),
        ]));
    }

    /**
     * Decode the blob produced by encrypt(), re-derive the key, and decrypt.
     * Verifies the GCM auth tag; throws RuntimeException on any failure.
     */
    public function decrypt(string $blob, int $conversationId): string
    {
        $json = base64_decode($blob, strict: true);

        if ($json === false) {
            throw new RuntimeException('Payload blob is not valid base64.');
        }

        $data = json_decode($json, associative: true);

        if (! isset($data['iv'], $data['ciphertext'], $data['tag'])) {
            throw new RuntimeException('Payload blob is missing required fields.');
        }

        $key = $this->deriveKey($conversationId);
        $iv = base64_decode($data['iv'], strict: true);
        $ciphertext = base64_decode($data['ciphertext'], strict: true);
        $tag = base64_decode($data['tag'], strict: true);

        $plaintext = openssl_decrypt(
            $ciphertext,
            self::CIPHER,
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        if ($plaintext === false) {
            throw new RuntimeException('Decryption failed — ciphertext may have been tampered with.');
        }

        return $plaintext;
    }

    /**
     * Build a structured payload array ready to be JSON-encoded and then encrypted.
     * Shape: ['version' => 1, 'type' => $type->value, 'text' => $text, ...$extras]
     */
    public function buildPayload(MessageType $type, string $text, array $extras = []): array
    {
        return array_merge([
            'version' => self::VERSION,
            'type' => $type->value,
            'text' => $text,
        ], $extras);
    }

    /**
     * Decode and validate a decrypted JSON string into a payload array.
     *
     * @throws UnexpectedValueException on missing required keys or unsupported version
     */
    public function parsePayload(string $json): array
    {
        $data = json_decode($json, associative: true);

        if (! is_array($data)) {
            throw new UnexpectedValueException('Payload JSON is not a valid object.');
        }

        foreach (['version', 'type', 'text'] as $key) {
            if (! array_key_exists($key, $data)) {
                throw new UnexpectedValueException("Payload missing required key: {$key}");
            }
        }

        if ($data['version'] !== self::VERSION) {
            throw new UnexpectedValueException("Unsupported payload version: {$data['version']}");
        }

        return $data;
    }

    /**
     * Derive a 32-byte conversation-scoped key using HMAC-SHA256.
     * Secret: app key. Message: "chat:{conversationId}".
     */
    private function deriveKey(int $conversationId): string
    {
        return hash_hmac('sha256', "chat:{$conversationId}", config('app.key'), binary: true);
    }
}
