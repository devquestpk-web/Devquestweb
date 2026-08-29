export type JobRole = {
  slug: string;
  title: string;
  shortTitle: string;
  category?: string;
  summary: string;
  skills: string[];
};

export const jobs: JobRole[] = [
  {
    slug: "tech-lead-full-stack-developer",
    title: "Tech Lead / Full-Stack Developer",
    shortTitle: "Tech Lead / Full-Stack Developer",
    category: "TECHNICAL TEAM",
    summary: "Lead technical delivery, shape scalable architecture, and mentor developers building modern digital products.",
    skills: ["Full-stack development", "Technical leadership", "System architecture"],
  },
  {
    slug: "frontend-ui-ux-developer",
    title: "Frontend & UI/UX Developer",
    shortTitle: "Frontend & UI/UX Developer",
    category: "TECHNICAL TEAM",
    summary: "Turn product ideas into accessible, responsive interfaces with thoughtful interaction and visual detail.",
    skills: ["React and frontend", "Responsive UI", "UX implementation"],
  },
  {
    slug: "cloud-ai-solutions-engineer",
    title: "Cloud & AI Solutions Engineer",
    shortTitle: "Cloud & AI Solutions Engineer",
    category: "TECHNICAL TEAM",
    summary: "Design cloud infrastructure, automate delivery, and deploy practical AI capabilities for real-world use cases.",
    skills: ["Cloud platforms", "DevOps automation", "Applied AI solutions"],
  },
  {
    slug: "business-development-executive",
    title: "Business Development Executive (BDE)",
    shortTitle: "Business Development Executive",
    category: "BUSINESS & GROWTH",
    summary: "Build relationships, identify meaningful opportunities, and grow partnerships across technology and education.",
    skills: ["Partnership development", "Client communication", "Growth strategy"],
  },
  {
    slug: "ai-ml-engineer",
    title: "AI / ML Engineer",
    shortTitle: "AI / ML Engineer",
    category: "TECHNICAL TEAM",
    summary: "Build, fine-tune, and deploy machine learning models and intelligent AI workflows for real-world applications.",
    skills: ["Machine Learning & Deep Learning", "LLMs & Applied AI", "Python & Model Deployment"],
  },
  {
    slug: "data-analyst",
    title: "Data Analyst",
    shortTitle: "Data Analyst",
    category: "DATA & ANALYTICS",
    summary: "Transform complex data into actionable insights, build analytical dashboards, and drive data-backed decision making.",
    skills: ["Data visualization & dashboards", "SQL & Python data analysis", "Statistical modeling & insights"],
  },
  {
    slug: "marketing-specialist",
    title: "Marketing Specialist",
    shortTitle: "Marketing Specialist",
    category: "MARKETING & GROWTH",
    summary: "Drive brand awareness, execute digital marketing campaigns, and expand DevQuest's reach across digital channels.",
    skills: ["Digital & social media marketing", "Content & campaign strategy", "Growth analytics & outreach"],
  },
  {
    slug: "graphic-designer",
    title: "Graphic Designer",
    shortTitle: "Graphic Designer",
    category: "DESIGN TEAM",
    summary: "Create captivating visual assets, brand identities, and high-impact design collateral for web and community campaigns.",
    skills: ["Brand & visual identity", "Figma, Illustrator & Photoshop", "Digital graphics & social media assets"],
  },
  {
    slug: "video-editor-content-creator",
    title: "Video Editor & Content Creator",
    shortTitle: "Video Editor",
    category: "MEDIA & CREATIVE",
    summary: "Produce engaging video content, event recaps, social media reels, and promotional visual stories.",
    skills: ["Video editing & motion graphics", "Storyboarding & reel production", "Adobe Premiere Pro & After Effects"],
  },
  {
    slug: "mobile-app-developer",
    title: "Mobile App Developer",
    shortTitle: "Mobile App Developer",
    category: "TECHNICAL TEAM",
    summary: "Develop high-performance cross-platform and native mobile applications for iOS and Android platforms.",
    skills: ["Flutter / React Native", "Mobile UI & State Management", "REST APIs & App Deployment"],
  },
];
