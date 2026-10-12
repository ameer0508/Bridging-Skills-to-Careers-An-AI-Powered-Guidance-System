"""
Test tripwire: while active, any attempt to open a connection to a non-loopback host fails
and is recorded, so a test can prove that a code path made no live call.
"""
import socket
from contextlib import contextmanager
from typing import Iterator, List

LOOPBACK = {"localhost", "127.0.0.1", "::1", "testserver"}


class LiveNetworkCallBlocked(ConnectionError):
    pass


class _Recorder:
    def __init__(self) -> None:
        self.attempts: List[str] = []


def _host_of(address) -> str:
    if isinstance(address, tuple) and address:
        return str(address[0])
    return str(address)


@contextmanager
def block_external_network() -> Iterator[_Recorder]:
    recorder = _Recorder()
    original_connect = socket.socket.connect
    original_connect_ex = socket.socket.connect_ex
    original_getaddrinfo = socket.getaddrinfo

    def _refuse(host: str) -> None:
        recorder.attempts.append(host)
        raise LiveNetworkCallBlocked(f"Live network call to '{host}' blocked by the zero-cost policy.")

    def guarded_connect(self, address):
        host = _host_of(address)
        if host not in LOOPBACK:
            _refuse(host)
        return original_connect(self, address)

    def guarded_connect_ex(self, address):
        host = _host_of(address)
        if host not in LOOPBACK:
            _refuse(host)
        return original_connect_ex(self, address)

    def guarded_getaddrinfo(host, *args, **kwargs):
        if host is not None and str(host) not in LOOPBACK:
            _refuse(str(host))
        return original_getaddrinfo(host, *args, **kwargs)

    socket.socket.connect = guarded_connect
    socket.socket.connect_ex = guarded_connect_ex
    socket.getaddrinfo = guarded_getaddrinfo
    try:
        yield recorder
    finally:
        socket.socket.connect = original_connect
        socket.socket.connect_ex = original_connect_ex
        socket.getaddrinfo = original_getaddrinfo
