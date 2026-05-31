"""
Example Test Script
Demonstrates how to use the AI module
"""

from main import (
    parse_resume,
    extract_skills_from_resume,
    analyze_skill_gap_for_role,
    process_resume_complete,
    compare_multiple_roles
)
from datasets.job_skills import get_all_roles


def test_skill_extraction():
    """Test skill extraction from sample text"""
    print("\n" + "=" * 60)
    print("TEST 1: Skill Extraction")
    print("=" * 60)
    
    sample_text = """
    Experienced Software Developer with 5 years of experience.
    
    Technical Skills:
    - Programming: Python, JavaScript, Java, C++
    - Web: React, Node.js, Django, Flask, HTML, CSS
    - Databases: MongoDB, PostgreSQL, MySQL, Redis
    - Cloud: AWS, Docker, Kubernetes
    - Tools: Git, Jenkins, JIRA
    
    Experience:
    - Developed React applications with Redux
    - Built REST APIs using Django and Flask
    - Deployed applications on AWS using Docker
    - Implemented CI/CD pipelines with Jenkins
    """
    
    skills = extract_skills_from_resume(sample_text)
    print(f"\nExtracted {len(skills)} skills:")
    print(skills)
    
    return skills


def test_skill_gap_analysis(user_skills):
    """Test skill gap analysis"""
    print("\n" + "=" * 60)
    print("TEST 2: Skill Gap Analysis")
    print("=" * 60)
    
    job_role = "Full Stack Developer"
    print(f"\nAnalyzing for role: {job_role}")
    
    result = analyze_skill_gap_for_role(user_skills, job_role)
    
    print(f"\nMatch Percentage: {result['overall_match_percentage']}%")
    print(f"Required Skills Match: {result['required_skills_match']}%")
    print(f"Preferred Skills Match: {result['preferred_skills_match']}%")
    print(f"Skill Level: {result['skill_level']}")
    
    print(f"\nExisting Required Skills ({len(result['existing_skills']['required'])}):")
    print(result['existing_skills']['required'])
    
    print(f"\nMissing Required Skills ({len(result['missing_skills']['required'])}):")
    print(result['missing_skills']['required'])
    
    print(f"\nRecommended Skills to Learn:")
    print(result['recommended_skills'])


def test_multiple_roles():
    """Test comparison across multiple roles"""
    print("\n" + "=" * 60)
    print("TEST 3: Multiple Role Comparison")
    print("=" * 60)
    
    # Sample skills
    user_skills = [
        "Python", "JavaScript", "React", "Node.js", "MongoDB",
        "PostgreSQL", "Git", "Docker", "AWS", "REST API"
    ]
    
    print(f"\nUser Skills: {user_skills}")
    print(f"\nComparing against all job roles...")
    
    from analyzers.skill_gap_analyzer import SkillGapAnalyzer
    analyzer = SkillGapAnalyzer()
    results = analyzer.compare_multiple_roles(user_skills)
    
    print(f"\nTop 3 Matching Roles:")
    for i, result in enumerate(results[:3], 1):
        print(f"\n{i}. {result['job_role']}")
        print(f"   Match: {result['overall_match_percentage']}%")
        print(f"   Skill Level: {result['skill_level']}")


def test_available_roles():
    """Test listing available roles"""
    print("\n" + "=" * 60)
    print("TEST 4: Available Job Roles")
    print("=" * 60)
    
    roles = get_all_roles()
    print(f"\nTotal Roles: {len(roles)}")
    for i, role in enumerate(roles, 1):
        print(f"{i}. {role}")


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("AI Module Test Suite")
    print("=" * 60)
    
    # Test 1: Skill Extraction
    user_skills = test_skill_extraction()
    
    # Test 2: Skill Gap Analysis
    if user_skills:
        test_skill_gap_analysis(user_skills)
    
    # Test 3: Multiple Role Comparison
    test_multiple_roles()
    
    # Test 4: Available Roles
    test_available_roles()
    
    print("\n" + "=" * 60)
    print("All Tests Completed!")
    print("=" * 60)
    
    print("\n📝 Next Steps:")
    print("1. Place a resume file (PDF or DOCX) in the ai-module directory")
    print("2. Run: result = process_resume_complete('your_resume.pdf', 'Frontend Developer')")
    print("3. Check the output/ directory for JSON results")


if __name__ == "__main__":
    main()
