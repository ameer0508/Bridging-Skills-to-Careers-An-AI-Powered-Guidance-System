import logging
from typing import List, Dict
from app.certification_intelligence.provider_interface import (
    BaseCertificationProvider,
    CertificationFilter,
    CertificationItem,
    MicrosoftCertAdapter,
    AWSCertAdapter,
    GCPCertAdapter,
    CiscoCertAdapter,
    CompTIACertAdapter,
    ISC2CertAdapter,
    OracleCertAdapter,
    RedHatCertAdapter,
    SAPCertAdapter,
    VMwareCertAdapter,
    HashiCorpCertAdapter,
    LinuxFoundationCertAdapter,
    CNCFCertAdapter,
    MockCertProvider,
)

logger = logging.getLogger("skillbridge-ai")

class CertificationProviderManager:
    """
    Manages registration, discovery, fallback, and query execution across all active Certification Providers.
    """

    def __init__(self):
        self._providers: Dict[str, BaseCertificationProvider] = {}
        self._register_defaults()

    def _register_defaults(self):
        defaults = [
            MicrosoftCertAdapter(),
            AWSCertAdapter(),
            GCPCertAdapter(),
            CiscoCertAdapter(),
            CompTIACertAdapter(),
            ISC2CertAdapter(),
            OracleCertAdapter(),
            RedHatCertAdapter(),
            SAPCertAdapter(),
            VMwareCertAdapter(),
            HashiCorpCertAdapter(),
            LinuxFoundationCertAdapter(),
            CNCFCertAdapter(),
            MockCertProvider(),
        ]
        for provider in defaults:
            self.register_provider(provider)

    def register_provider(self, provider: BaseCertificationProvider):
        self._providers[provider.provider_name] = provider
        logger.info(f"Registered Certification Provider: {provider.provider_name}")

    def fetch_all_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        all_certs: List[CertificationItem] = []
        for name, provider in self._providers.items():
            try:
                if provider.is_healthy():
                    certs = provider.fetch_certifications(filter_params)
                    all_certs.extend(certs)
            except Exception as e:
                logger.error(f"Error fetching certs from provider {name}: {e}")
        return all_certs
