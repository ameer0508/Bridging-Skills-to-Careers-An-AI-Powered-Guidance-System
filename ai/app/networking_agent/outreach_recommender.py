from typing import Dict, Any

class OutreachRecommender:
    """
    Generates personalized, user-editable outreach message drafts (InMail, Mentorship, Intro).
    """

    @staticmethod
    def generate_draft(recipient_name: str, company: str, topic: str) -> Dict[str, Any]:
        return {
            "recipient_name": recipient_name,
            "subject": f"Inquiry regarding {topic} at {company}",
            "body": f"Hi {recipient_name},\n\nI noticed your impactful work on {topic} at {company}. As an AI Infrastructure Architect scaling vector search systems, I would love to connect and learn about your team's approach to scale-out indexing.\n\nBest,\nAlex",
            "editable_by_user": True
        }
