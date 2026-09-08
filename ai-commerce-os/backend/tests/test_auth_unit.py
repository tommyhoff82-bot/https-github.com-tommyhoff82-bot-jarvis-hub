"""Unit tests for password hashing and JWT tokens — no database needed.

Run with: pytest tests/test_auth_unit.py
"""
import os
import time

import pytest

os.environ.setdefault("JWT_SECRET", "test-secret-do-not-use-in-production")

import auth  # noqa: E402  (import after env var is set)


def test_hash_and_verify_roundtrip():
    hashed = auth.hash_password("correct horse battery staple")
    assert auth.verify_password("correct horse battery staple", hashed)


def test_verify_rejects_wrong_password():
    hashed = auth.hash_password("correct horse battery staple")
    assert not auth.verify_password("wrong password", hashed)


def test_hash_rejects_password_over_72_bytes():
    # This is bcrypt's real limit, not the passlib self-test bug we removed
    # passlib to get away from — see auth.py's module docstring.
    too_long = "a" * 73
    with pytest.raises(ValueError):
        auth.hash_password(too_long)


def test_hash_accepts_password_at_exactly_72_bytes():
    exactly_72 = "a" * 72
    hashed = auth.hash_password(exactly_72)
    assert auth.verify_password(exactly_72, hashed)


def test_verify_password_handles_malformed_hash_gracefully():
    # Should return False, not raise — a corrupted/legacy hash shouldn't
    # ever turn into a 500 at the login endpoint.
    assert not auth.verify_password("anything", "not-a-real-bcrypt-hash")


def test_two_hashes_of_same_password_differ():
    # bcrypt salts each hash — this is what actually makes rainbow tables
    # useless. If this ever fails, salting broke.
    a = auth.hash_password("same password")
    b = auth.hash_password("same password")
    assert a != b
    assert auth.verify_password("same password", a)
    assert auth.verify_password("same password", b)


def test_create_and_decode_access_token():
    token = auth.create_access_token("user_123")
    payload = auth.jwt.decode(token, auth.JWT_SECRET, algorithms=[auth.JWT_ALGORITHM])
    assert payload["sub"] == "user_123"
    assert payload["exp"] > time.time()


def test_decode_rejects_tampered_token():
    token = auth.create_access_token("user_123")
    tampered = token[:-4] + "abcd"
    with pytest.raises(auth.jwt.PyJWTError):
        auth.jwt.decode(tampered, auth.JWT_SECRET, algorithms=[auth.JWT_ALGORITHM])


def test_decode_rejects_wrong_secret():
    token = auth.create_access_token("user_123")
    with pytest.raises(auth.jwt.PyJWTError):
        auth.jwt.decode(token, "a-different-secret", algorithms=[auth.JWT_ALGORITHM])


def test_create_access_token_requires_jwt_secret(monkeypatch):
    monkeypatch.setattr(auth, "JWT_SECRET", None)
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        auth.create_access_token("user_123")
