// All courses and their questions.
// type: 'theory' = manually graded by admin
// type: 'mcq' = could be auto-graded (currently we still let admin verify)
// maxScore: points available for that question

export type Question = {
  id: string;
  type: 'theory' | 'mcq';
  question: string;
  options?: string[]; // for mcq
  correctAnswer?: string; // for mcq (the option text)
  maxScore: number;
};

export type Course = {
  id: string;
  name: string;
  description: string;
  questions: Question[];
};

export const COURSES: Course[] = [
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'HTML, CSS, and the Ahia Imo project',
    questions: [
      {
        id: 'wd-1',
        type: 'theory',
        question:
          'What is web development and what is the difference between HTML and CSS?',
        maxScore: 20,
      },
      {
        id: 'wd-2',
        type: 'theory',
        question:
          'Mention three basic HTML elements and explain what each one does.',
        maxScore: 20,
      },
      {
        id: 'wd-3',
        type: 'theory',
        question:
          'What is CSS used for and mention three things it can control on a webpage?',
        maxScore: 20,
      },
      {
        id: 'wd-4',
        type: 'theory',
        question:
          'In building the Ahia Imo project using HTML and CSS, what are three basic sections you would expect on the homepage?',
        maxScore: 20,
      },
      {
        id: 'wd-5',
        type: 'theory',
        question:
          'Why is it important to start building the Ahia Imo project with HTML and CSS before learning advanced tools like React?',
        maxScore: 20,
      },
    ],
  },
  {
    id: 'graphics',
    name: 'Graphics Design',
    description: 'Design principles, branding, and visual communication',
    questions: [
      {
        id: 'gd-1',
        type: 'theory',
        question:
          'Define the scope of graphic design as a discipline. How do foundational principles like balance, contrast, and alignment serve as the bedrock for all design work, and why are they crucial to every project?',
        maxScore: 20,
      },
      {
        id: 'gd-2',
        type: 'theory',
        question:
          'Explain the difference between brand identity and brand image. How do designers ensure that the brand identity they craft consistently influences public perception and aligns with business goals?',
        maxScore: 20,
      },
      {
        id: 'gd-3',
        type: 'theory',
        question:
          'Describe the essential characteristics of an effective logo. What technical considerations must a designer keep in mind when creating a logo that is versatile, memorable, and scalable?',
        maxScore: 20,
      },
      {
        id: 'gd-4',
        type: 'theory',
        question:
          'How do different typefaces impact the personality of a brand? Discuss how designers should choose fonts based on readability, emotional resonance, and the brand\u2019s target audience.',
        maxScore: 20,
      },
      {
        id: 'gd-5',
        type: 'theory',
        question:
          'Analyze how color psychology can influence user behavior in digital design. Provide an example of a brand that leverages color to evoke trust, excitement, or calm, and explain the principles behind this choice.',
        maxScore: 20,
      },
    ],
  },
  {
    id: 'video-editing',
    name: 'Video Editing',
    description: 'CapCut, storytelling, and content creation',
    questions: [
      {
        id: 've-1',
        type: 'theory',
        question:
          'What is video editing and why is it important in digital content creation?',
        maxScore: 20,
      },
      {
        id: 've-2',
        type: 'theory',
        question:
          'Mention any four tools or sections commonly found in CapCut and explain one use of each.',
        maxScore: 20,
      },
      {
        id: 've-3',
        type: 'theory',
        question:
          'Mention three basic things a video editor can do to improve a video.',
        maxScore: 20,
      },
      {
        id: 've-4',
        type: 'theory',
        question: 'Why is storytelling important in video content creation?',
        maxScore: 20,
      },
      {
        id: 've-5',
        type: 'theory',
        question:
          'Imagine you are creating a short promotional video for Ahia Imo. Mention two things you would include in the video to attract viewers.',
        maxScore: 20,
      },
    ],
  },
  {
    id: 'leadership',
    name: 'Leadership & Entrepreneurship',
    description: 'Problem solving, leadership, and value creation',
    questions: [
      {
        id: 'le-1',
        type: 'theory',
        question:
          'Explain entrepreneurship in your own words and describe how entrepreneurs solve problems in society.',
        maxScore: 20,
      },
      {
        id: 'le-2',
        type: 'theory',
        question: 'Who is a leader and mention three qualities of a good leader.',
        maxScore: 20,
      },
      {
        id: 'le-3',
        type: 'theory',
        question:
          'Why are systems and moral values important in business and leadership?',
        maxScore: 20,
      },
      {
        id: 'le-4',
        type: 'theory',
        question:
          'What is the difference between a business idea and a business opportunity?',
        maxScore: 20,
      },
      {
        id: 'le-5',
        type: 'theory',
        question:
          'Using Ahia Imo as an example, explain one problem the platform is trying to solve and the value it creates for users.',
        maxScore: 20,
      },
    ],
  },
  {
    id: 'robotics',
    name: 'Robotics',
    description: 'ESP32, motor drivers, sensors, and autonomous systems',
    questions: [
      {
        id: 'ro-1',
        type: 'mcq',
        question:
          'Which pins on the L298N motor driver are used to control the DIRECTION of a motor (as opposed to its speed)?',
        options: [
          'ENA / ENB',
          'IN1 / IN2 / IN3 / IN4',
          'VCC / GND',
          'OUT1 / OUT2',
        ],
        correctAnswer: 'IN1 / IN2 / IN3 / IN4',
        maxScore: 10,
      },
      {
        id: 'ro-2',
        type: 'mcq',
        question: 'An ultrasonic sensor (HC-SR04) measures distance by:',
        options: [
          'Detecting infrared light bouncing off objects',
          'Sending a sound pulse and measuring time until the echo returns',
          'Using a magnetic field to sense proximity',
          'Reading capacitance changes in the air',
        ],
        correctAnswer:
          'Sending a sound pulse and measuring time until the echo returns',
        maxScore: 10,
      },
      {
        id: 'ro-3',
        type: 'mcq',
        question:
          'Why must you connect the ESP32\u2019s GND to the L298N\u2019s GND, even when the motors are powered by a separate battery?',
        options: [
          'To give the motors more power',
          'So both circuits share a common reference voltage for the logic signals',
          'To prevent the ESP32 from overheating',
          'GND connection is optional',
        ],
        correctAnswer:
          'So both circuits share a common reference voltage for the logic signals',
        maxScore: 10,
      },
      {
        id: 'ro-4',
        type: 'theory',
        question:
          'You have just built a 4-Wheel Drive robot using an ESP32 and an L298N motor driver, but during your first test, the car drives forward perfectly while the left wheels completely refuse to spin in reverse. Explain why we must use the L298N as a "gatekeeper" between the ESP32 and the motors in the first place, and describe the specific physical connections, pin choices, or logical states you would investigate to figure out exactly why that left side won\u2019t go backward.',
        maxScore: 35,
      },
      {
        id: 'ro-5',
        type: 'theory',
        question:
          'Imagine you are designing the logic for a fully autonomous robot that wakes up using the ESP32\u2019s native touch pin, drives forward, and uses an ultrasonic sensor mounted on a servo motor to avoid crashing into walls. Explain how the robot is able to physically detect your touch and measure the distance to a wall using sound, and describe the exact sequence of decisions its "brain" must make the moment it detects a wall right in front of it to find a clear path.',
        maxScore: 35,
      },
    ],
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing & Virtual Assistance',
    description: 'Digital economy, Google Workspace, and online business tools',
    questions: [
      {
        id: 'dm-1',
        type: 'theory',
        question:
          'Explain what the digital economy means and mention two ways businesses now operate differently because of digital technology.',
        maxScore: 20,
      },
      {
        id: 'dm-2',
        type: 'theory',
        question:
          'Mention any four tools in Google Workspace and explain one practical use of each tool in a digital business environment.',
        maxScore: 20,
      },
      {
        id: 'dm-3',
        type: 'theory',
        question:
          'A business owner complains that their files, emails and customer follow-ups are scattered and disorganized. As a Virtual Assistant, explain three things you would do to help improve the workflow and organization of the business.',
        maxScore: 20,
      },
      {
        id: 'dm-4',
        type: 'theory',
        question:
          'During the Ahia Imo market research exercise, what important information should students try to gather from traders or potential customers before building or promoting the platform? Mention at least four points.',
        maxScore: 20,
      },
      {
        id: 'dm-5',
        type: 'theory',
        question:
          'Explain how Google Forms can help during market research for Ahia Imo. Also mention two advantages of using digital forms instead of paper questionnaires.',
        maxScore: 20,
      },
    ],
  },
];

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getMaxTotalScore(courseId: string): number {
  const course = getCourse(courseId);
  if (!course) return 0;
  return course.questions.reduce((sum, q) => sum + q.maxScore, 0);
}
