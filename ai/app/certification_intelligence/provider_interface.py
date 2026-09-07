from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class CertificationItem(BaseModel):
    id: str
    name: str
    provider: str
    level: str = "Associate"  # Associate, Professional, Expert, Specialty
    exam_code: str = "EXAM-101"
    domains_covered: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)
    recommended_experience: str = "1-2 Years"
    exam_duration_minutes: int = 120
    passing_score: str = "700/1000"
    exam_cost_usd: float = 150.0
    renewal_requirements: str = "Recertify every 3 years or earn CPE credits"
    validity_period_years: int = 3
    languages: List[str] = Field(default_factory=lambda: ["English"])
    official_url: str = "https://skillbridge.dev/certs"
    skills_covered: List[str] = Field(default_factory=list)
    employer_recognition_score: float = 95.0
    salary_boost_usd: float = 15000.0
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    confidence: float = 0.98

class CertificationFilter(BaseModel):
    technology: Optional[str] = None
    provider: Optional[str] = None
    level: Optional[str] = None
    max_cost_usd: Optional[float] = None
    career_domain: Optional[str] = None
    max_prep_days: Optional[int] = None

class BaseCertificationProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        pass

    @abstractmethod
    def is_healthy(self) -> bool:
        pass

# Provider 1: Microsoft Learn Adapter
class MicrosoftCertAdapter(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "Microsoft"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return [
            CertificationItem(
                id="ms-ai-102",
                name="Microsoft Certified: Azure AI Engineer Associate",
                provider=self.provider_name,
                level="Associate",
                exam_code="AI-102",
                domains_covered=["Azure AI Services", "OpenAI Integration", "Cognitive Search"],
                exam_cost_usd=165.0,
                skills_covered=["Azure AI", "OpenAI API", "Cognitive Search", "Python"],
                employer_recognition_score=94.0,
                salary_boost_usd=15000.0,
                official_url="https://learn.microsoft.com/certifications/azure-ai-engineer"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 2: AWS Certifications Adapter
class AWSCertAdapter(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "Amazon Web Services"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return [
            CertificationItem(
                id="aws-saa-c03",
                name="AWS Certified Solutions Architect – Associate",
                provider=self.provider_name,
                level="Associate",
                exam_code="SAA-C03",
                domains_covered=["Resilient Architectures", "High-Performing Architectures", "Secure Applications"],
                exam_cost_usd=150.0,
                skills_covered=["AWS Cloud", "S3", "EC2", "Lambda", "VPC"],
                employer_recognition_score=98.0,
                salary_boost_usd=18500.0,
                official_url="https://aws.amazon.com/certification/certified-solutions-architect-associate"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 3: Google Cloud Certifications Adapter
class GCPCertAdapter(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "Google Cloud"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return [
            CertificationItem(
                id="gcp-pca",
                name="Google Cloud Certified Professional Cloud Architect",
                provider=self.provider_name,
                level="Professional",
                exam_code="PCA-2024",
                domains_covered=["Cloud Infrastructure Architecture", "Security & Compliance"],
                exam_cost_usd=200.0,
                skills_covered=["GCP", "Kubernetes", "Vertex AI", "Cloud Spanner"],
                employer_recognition_score=96.0,
                salary_boost_usd=21000.0,
                official_url="https://cloud.google.com/certification/cloud-architect"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 4: Cisco Adapter
class CiscoCertAdapter(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "Cisco"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return [
            CertificationItem(
                id="cisco-ccna",
                name="Cisco Certified Network Associate (CCNA)",
                provider=self.provider_name,
                level="Associate",
                exam_code="200-301 CCNA",
                domains_covered=["Network Fundamentals", "Network Access", "IP Connectivity"],
                exam_cost_usd=300.0,
                skills_covered=["Networking", "TCP/IP", "Routers & Switches", "Security"],
                employer_recognition_score=95.0,
                salary_boost_usd=12000.0,
                official_url="https://cisco.com/go/ccna"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 5: CompTIA Adapter
class CompTIACertAdapter(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "CompTIA"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return [
            CertificationItem(
                id="comptia-sec",
                name="CompTIA Security+ (SY0-701)",
                provider=self.provider_name,
                level="Associate",
                exam_code="SY0-701",
                domains_covered=["General Security Concepts", "Threats & Vulnerabilities", "Architecture"],
                exam_cost_usd=392.0,
                skills_covered=["Cybersecurity", "Network Security", "Cryptography"],
                employer_recognition_score=96.0,
                salary_boost_usd=14000.0,
                official_url="https://comptia.org/certifications/security"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 6: ISC² Adapter
class ISC2CertAdapter(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "ISC²"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return [
            CertificationItem(
                id="isc2-cissp",
                name="Certified Information Systems Security Professional (CISSP)",
                provider=self.provider_name,
                level="Expert",
                exam_code="CISSP",
                domains_covered=["Security Risk Management", "Asset Security", "Security Architecture"],
                exam_cost_usd=749.0,
                skills_covered=["Cybersecurity Governance", "Risk Assessment", "Zero Trust"],
                employer_recognition_score=99.0,
                salary_boost_usd=25000.0,
                official_url="https://isc2.org/certifications/cissp"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 7: Oracle Adapter
class OracleCertAdapter(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "Oracle"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return []

    def is_healthy(self) -> bool:
        return True

# Provider 8: Red Hat Adapter
class RedHatCertAdapter(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "Red Hat"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return [
            CertificationItem(
                id="redhat-rhcsa",
                name="Red Hat Certified System Administrator (EX200)",
                provider=self.provider_name,
                level="Associate",
                exam_code="EX200",
                domains_covered=["Linux System Administration", "Shell Scripting", "Storage Management"],
                exam_cost_usd=500.0,
                skills_covered=["Linux", "RHEL", "Bash Scripting", "SysAdmin"],
                employer_recognition_score=94.0,
                salary_boost_usd=16000.0,
                official_url="https://redhat.com/en/services/certification/rhcsa"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 9: SAP Adapter
class SAPCertAdapter(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "SAP"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return []

    def is_healthy(self) -> bool:
        return True

# Provider 10: VMware Adapter
class VMwareCertAdapter(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "VMware"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return []

    def is_healthy(self) -> bool:
        return True

# Provider 11: HashiCorp Adapter
class HashiCorpCertAdapter(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "HashiCorp"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return [
            CertificationItem(
                id="hashicorp-terraform",
                name="HashiCorp Certified: Terraform Associate (003)",
                provider=self.provider_name,
                level="Associate",
                exam_code="TA-003",
                domains_covered=["Infrastructure as Code", "Terraform CLI", "HCL Syntax"],
                exam_cost_usd=70.0,
                skills_covered=["Terraform", "Infrastructure as Code", "HCL", "Multi-Cloud"],
                employer_recognition_score=93.0,
                salary_boost_usd=14500.0,
                official_url="https://hashicorp.com/certification/terraform-associate"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 12: Linux Foundation Adapter
class LinuxFoundationCertAdapter(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "Linux Foundation"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return []

    def is_healthy(self) -> bool:
        return True

# Provider 13: Kubernetes (CNCF) Adapter
class CNCFCertAdapter(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "CNCF / Linux Foundation"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return [
            CertificationItem(
                id="cncf-cka",
                name="Certified Kubernetes Administrator (CKA)",
                provider=self.provider_name,
                level="Professional",
                exam_code="CKA-2024",
                domains_covered=["Cluster Architecture", "Workloads & Scheduling", "Services & Networking"],
                exam_cost_usd=395.0,
                skills_covered=["Kubernetes", "Docker", "Cluster Ops", "Troubleshooting"],
                employer_recognition_score=97.0,
                salary_boost_usd=19500.0,
                official_url="https://cncf.io/certification/cka"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 14: Mock Provider (Dev Fallback)
class MockCertProvider(BaseCertificationProvider):
    @property
    def provider_name(self) -> str:
        return "Mock Provider"

    def fetch_certifications(self, filter_params: CertificationFilter) -> List[CertificationItem]:
        return [
            CertificationItem(
                id="mock-cert-1",
                name="Enterprise Systems Engineer Specialist",
                provider=self.provider_name,
                exam_cost_usd=100.0,
                skills_covered=["Software Engineering"],
                official_url="https://skillbridge.dev/mock-cert"
            )
        ]

    def is_healthy(self) -> bool:
        return True
