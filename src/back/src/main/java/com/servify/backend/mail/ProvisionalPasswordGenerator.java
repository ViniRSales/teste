package com.servify.backend.mail;

import java.security.SecureRandom;

/**
 * Gera senha curta para primeiro login (apenas caracteres legíveis, sem ambíguos como 0/O/1/l).
 */
public final class ProvisionalPasswordGenerator {

    private static final char[] ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();

    private ProvisionalPasswordGenerator() {
    }

    public static String generate(int length) {
        if (length < 4 || length > 32) {
            throw new IllegalArgumentException("Comprimento da senha provisória deve estar entre 4 e 32.");
        }
        char[] buf = new char[length];
        for (int i = 0; i < length; i++) {
            buf[i] = ALPHABET[RANDOM.nextInt(ALPHABET.length)];
        }
        return new String(buf);
    }
}
