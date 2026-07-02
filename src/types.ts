export type UserRole = 'student' | 'admin';

export type UserStage = '医科本科生' | '医学研究生' | '住培医师';

export interface StudentProfile {
  id: string;
  name: string;
  stage: UserStage;
  examGoal: string;
  avatar?: string;
  joinedPlanIds: string[];
}

export type PlanStatus = 'draft' | 'publishable' | 'published' | 'active' | 'ended' | 'archived';

export interface PlanPhase {
  id: string;
  name: string;
  type: 'practice' | 'quiz' | 'remediation';
  questionCount: number;
  difficulty: '易' | '中' | '难';
  requirement: string;
}

export interface StudyPlan {
  id: string;
  name: string;
  target: string;
  stage: UserStage;
  duration: string;
  syllabus: string[];
  phases: PlanPhase[];
  status: PlanStatus;
  studentCount: number;
  completionRate: number;
  averageScore?: number;
  remediationRules: string;
  createdAt: string;
}

export type QuestionType = 'A1' | 'A2' | 'B1' | 'X';

export interface Question {
  id: string;
  stem: string;
  type: QuestionType;
  options: string[];
  answer: string; // e.g., 'A', 'B', 'C', 'D'
  explanation: string;
  knowledgePoint: string;
  difficulty: '易' | '中' | '难';
  category: string;
}

export interface TestAttempt {
  id: string;
  studentId: string;
  planId: string;
  type: 'practice' | 'quiz' | 'remediation';
  score: number;
  maxScore: number;
  totalQuestions: number;
  correctCount: number;
  completedAt: string;
  weakPoints: string[];
  answers: { [questionId: string]: string }; // questionId -> studentAnswer
}

export interface RemediationPacket {
  id: string;
  studentId: string;
  planId: string;
  status: 'not_started' | 'studying' | 'completed' | 'retested';
  generatedAt: string;
  weakPoints: string[];
  questions: Question[];
  answers: { [questionId: string]: string };
  retestScore?: number;
}

export interface StudentFeedback {
  id: string;
  studentId: string;
  studentName: string;
  questionId: string;
  questionStem: string;
  feedbackType: '答案错漏' | '解析模糊' | '资源失效' | '难度不符';
  content: string;
  status: 'pending' | 'accepted' | 'rejected' | 'resolved';
  processedAt?: string;
  reply?: string;
}

export interface ClassStudentProgress {
  studentId: string;
  name: string;
  stage: UserStage;
  planId: string;
  progress: number; // 0 to 100
  avgCorrectRate: number; // 0 to 100
  testScore: number | null; // null if not taken
  weakPoints: string[];
  remediationStatus: '未触发' | '已生成未开始' | '加练中' | '已完成';
  remediationImprovement: number | null; // percentage improvement, null if not retested
  lastActive: string;
}
