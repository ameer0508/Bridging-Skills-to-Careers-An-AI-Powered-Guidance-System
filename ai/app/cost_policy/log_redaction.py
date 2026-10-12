"""
Removes configured credential values from every log record in the process, whichever logger
or library produced it, so a provider error that echoes its key never reaches a log file.
"""
import logging

_installed = False


def install_log_redaction(policy) -> None:
    global _installed
    if _installed:
        return
    previous_factory = logging.getLogRecordFactory()

    def factory(*args, **kwargs):
        record = previous_factory(*args, **kwargs)
        secrets = policy.secret_values()
        if secrets:
            try:
                message = record.getMessage()
            except Exception:
                return record
            redacted = policy.redact(message)
            if redacted != message:
                record.msg, record.args = redacted, None
        return record

    logging.setLogRecordFactory(factory)
    _installed = True
