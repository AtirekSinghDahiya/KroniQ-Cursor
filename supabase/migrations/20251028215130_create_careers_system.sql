/*
  # Create Careers System

  1. New Tables
    - `job_postings`
      - `id` (uuid, primary key)
      - `title` (text) - Job title
      - `department` (text) - Department/Category
      - `location` (text) - Job location
      - `type` (text) - Full-time, Part-time, Contract, etc.
      - `description` (text) - Job description
      - `requirements` (text[]) - Array of requirements
      - `responsibilities` (text[]) - Array of responsibilities
      - `salary_range` (text) - Salary range (optional)
      - `is_active` (boolean) - Whether job is currently accepting applications
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `job_applications`
      - `id` (uuid, primary key)
      - `job_id` (uuid, foreign key to job_postings)
      - `full_name` (text)
      - `email` (text)
      - `phone` (text)
      - `linkedin_url` (text, optional)
      - `portfolio_url` (text, optional)
      - `resume_url` (text) - Link to uploaded resume
      - `cover_letter` (text)
      - `years_of_experience` (integer)
      - `current_location` (text)
      - `available_start_date` (date)
      - `status` (text) - new, reviewing, interviewed, accepted, rejected
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Job postings are publicly readable
    - Applications can be created by anyone but only readable by admins
*/

-- Create job_postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text NOT NULL,
  location text NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  requirements text[] NOT NULL DEFAULT '{}',
  responsibilities text[] NOT NULL DEFAULT '{}',
  salary_range text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job_postings(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  linkedin_url text,
  portfolio_url text,
  resume_url text NOT NULL,
  cover_letter text NOT NULL,
  years_of_experience integer NOT NULL,
  current_location text NOT NULL,
  available_start_date date NOT NULL,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Policies for job_postings (public read, no one can write via client)
CREATE POLICY "Anyone can view active job postings"
  ON job_postings
  FOR SELECT
  USING (is_active = true);

-- Policies for job_applications (anyone can submit, no one can read via client)
CREATE POLICY "Anyone can submit job applications"
  ON job_applications
  FOR INSERT
  WITH CHECK (true);

-- Insert sample job postings
INSERT INTO job_postings (title, department, location, type, description, requirements, responsibilities, salary_range, is_active)
VALUES 
  (
    'Senior Full-Stack Engineer',
    'Engineering',
    'Remote (US/Canada)',
    'Full-time',
    'We are seeking an experienced Full-Stack Engineer to join our core platform team. You will work on building and scaling our AI-powered creative tools that serve thousands of users daily.',
    ARRAY[
      'Bachelor''s degree in Computer Science or equivalent experience',
      '5+ years of professional software development experience',
      'Strong proficiency in TypeScript, React, and Node.js',
      'Experience with cloud platforms (AWS, GCP, or Azure)',
      'Solid understanding of database design and optimization',
      'Experience with real-time systems and WebSocket technologies',
      'Strong problem-solving and debugging skills'
    ],
    ARRAY[
      'Design, develop, and maintain scalable web applications',
      'Collaborate with product and design teams to implement new features',
      'Optimize application performance and user experience',
      'Write clean, maintainable, and well-tested code',
      'Participate in code reviews and mentor junior developers',
      'Contribute to architectural decisions and technical roadmap',
      'Help maintain and improve our CI/CD pipeline'
    ],
    '$120k - $180k + equity',
    true
  ),
  (
    'AI/ML Engineer',
    'AI Research',
    'Remote (Worldwide)',
    'Full-time',
    'Join our AI team to build and optimize the next generation of creative AI models. You will work on integrating cutting-edge AI technologies and improving model performance across our platform.',
    ARRAY[
      'Master''s or PhD in Computer Science, AI/ML, or related field',
      '3+ years of experience in machine learning and AI',
      'Strong knowledge of Python, PyTorch, and TensorFlow',
      'Experience with large language models and diffusion models',
      'Understanding of model optimization and deployment',
      'Experience with GPU computing and distributed training',
      'Published research or contributions to open-source ML projects (preferred)'
    ],
    ARRAY[
      'Develop and fine-tune AI models for creative applications',
      'Optimize model inference for production environments',
      'Research and implement state-of-the-art AI techniques',
      'Collaborate with engineering team on model integration',
      'Monitor and improve model performance and accuracy',
      'Stay current with latest AI research and innovations',
      'Contribute to technical documentation and research papers'
    ],
    '$140k - $200k + equity',
    true
  ),
  (
    'Product Designer',
    'Design',
    'Remote (US/Europe)',
    'Full-time',
    'We are looking for a talented Product Designer to help shape the future of our AI creative platform. You will create intuitive and delightful user experiences for millions of creators.',
    ARRAY[
      'Bachelor''s degree in Design, HCI, or related field',
      '4+ years of product design experience',
      'Strong portfolio showcasing UI/UX design work',
      'Proficiency in Figma, Sketch, or similar design tools',
      'Experience designing for web and mobile platforms',
      'Understanding of design systems and component libraries',
      'Strong communication and collaboration skills'
    ],
    ARRAY[
      'Design beautiful and intuitive user interfaces',
      'Create user flows, wireframes, and high-fidelity mockups',
      'Conduct user research and usability testing',
      'Collaborate with engineers to implement designs',
      'Maintain and evolve our design system',
      'Create design documentation and specifications',
      'Present design concepts to stakeholders'
    ],
    '$100k - $150k + equity',
    true
  ),
  (
    'DevOps Engineer',
    'Infrastructure',
    'Remote (US)',
    'Full-time',
    'Help us build and scale the infrastructure that powers millions of AI-generated creations. You will work on automation, monitoring, and ensuring our platform runs smoothly 24/7.',
    ARRAY[
      'Bachelor''s degree in Computer Science or equivalent experience',
      '4+ years of DevOps or Infrastructure experience',
      'Strong knowledge of AWS, Docker, and Kubernetes',
      'Experience with Infrastructure as Code (Terraform, CloudFormation)',
      'Proficiency in scripting languages (Python, Bash, Go)',
      'Understanding of CI/CD pipelines and automation',
      'Experience with monitoring and logging tools'
    ],
    ARRAY[
      'Design and maintain scalable cloud infrastructure',
      'Implement and improve CI/CD pipelines',
      'Monitor system performance and reliability',
      'Automate deployment and operational tasks',
      'Ensure security best practices across infrastructure',
      'Respond to and resolve production incidents',
      'Collaborate with engineering team on infrastructure needs'
    ],
    '$110k - $160k + equity',
    true
  ),
  (
    'Growth Marketing Manager',
    'Marketing',
    'Remote (Worldwide)',
    'Full-time',
    'Lead our growth marketing efforts to reach and engage creators worldwide. You will develop and execute strategies to drive user acquisition, activation, and retention.',
    ARRAY[
      'Bachelor''s degree in Marketing, Business, or related field',
      '5+ years of growth marketing experience',
      'Proven track record of scaling B2C products',
      'Strong analytical skills and data-driven mindset',
      'Experience with digital marketing channels (SEO, SEM, social, content)',
      'Proficiency with analytics tools (Google Analytics, Mixpanel, etc.)',
      'Excellent written and verbal communication skills'
    ],
    ARRAY[
      'Develop and execute growth marketing strategies',
      'Manage multi-channel marketing campaigns',
      'Analyze user data and optimize conversion funnels',
      'Collaborate with product team on feature launches',
      'Create compelling marketing content and messaging',
      'Build and manage marketing automation workflows',
      'Track and report on key growth metrics'
    ],
    '$90k - $140k + equity',
    true
  ),
  (
    'Customer Success Specialist',
    'Customer Support',
    'Remote (US/Canada)',
    'Full-time',
    'Join our customer success team to help users get the most out of KroniQ. You will provide exceptional support and build lasting relationships with our community.',
    ARRAY[
      'Bachelor''s degree or equivalent experience',
      '2+ years of customer success or support experience',
      'Excellent communication and problem-solving skills',
      'Technical aptitude and ability to learn quickly',
      'Experience with support tools (Zendesk, Intercom, etc.)',
      'Passion for helping people and solving problems',
      'Familiarity with AI tools and creative software (preferred)'
    ],
    ARRAY[
      'Provide timely and helpful support to users',
      'Handle customer inquiries via email and chat',
      'Create and maintain help documentation',
      'Gather and relay customer feedback to product team',
      'Identify trends in support issues and suggest improvements',
      'Onboard new users and conduct product training',
      'Build strong relationships with key customers'
    ],
    '$50k - $80k + benefits',
    true
  );
