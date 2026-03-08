export const FIELD_OPTIONS = [
  "Software Engineering",
  "Data Science",
  "Machine Learning / AI",
  "Design",
  "Product Management",
  "DevOps / Cloud",
  "Cybersecurity",
  "Mobile Development",
  "Game Development",
  "Other",
] as const;

export const SKILL_SUGGESTIONS: Record<string, string[]> = {
  "Software Engineering": [
    "JavaScript", "TypeScript", "Python", "React", "Node.js", "SQL",
    "Git", "REST APIs", "HTML/CSS", "Docker", "AWS", "GraphQL",
  ],
  "Data Science": [
    "Python", "SQL", "Pandas", "NumPy", "Statistics",
    "Data Visualization", "R", "Jupyter", "Excel", "Tableau",
  ],
  "Machine Learning / AI": [
    "Python", "Linear Algebra", "Calculus", "Statistics", "PyTorch",
    "TensorFlow", "Scikit-learn", "Neural Networks", "NLP", "Computer Vision",
  ],
  "Design": [
    "Figma", "UI Design", "UX Research", "Prototyping", "Typography",
    "Color Theory", "Adobe Photoshop", "Adobe Illustrator", "Sketch",
  ],
  "Product Management": [
    "Agile/Scrum", "User Research", "A/B Testing", "SQL", "Roadmapping",
    "Wireframing", "Data Analysis", "Jira", "Stakeholder Management",
  ],
  "DevOps / Cloud": [
    "Linux", "Docker", "Kubernetes", "AWS", "GCP", "Azure",
    "CI/CD", "Terraform", "Ansible", "Monitoring", "Networking",
  ],
  "Cybersecurity": [
    "Networking", "Linux", "Python", "Cryptography", "Firewalls",
    "Penetration Testing", "SIEM", "Incident Response",
  ],
  "Mobile Development": [
    "React Native", "Swift", "Kotlin", "Flutter", "Dart",
    "iOS Development", "Android Development", "Firebase",
  ],
  "Game Development": [
    "Unity", "Unreal Engine", "C#", "C++", "3D Modeling",
    "Game Design", "Physics", "Shaders",
  ],
  Other: [
    "Python", "JavaScript", "SQL", "Git", "HTML/CSS",
    "Communication", "Problem Solving", "Project Management",
  ],
};

export const ALL_SKILLS = Array.from(
  new Set(Object.values(SKILL_SUGGESTIONS).flat())
).sort();
