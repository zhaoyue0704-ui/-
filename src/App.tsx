/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { StudentViews } from './components/StudentViews';
import { AdminViews } from './components/AdminViews';
import { 
  UserRole, 
  StudentProfile, 
  StudyPlan, 
  Question, 
  TestAttempt, 
  RemediationPacket, 
  ClassStudentProgress, 
  StudentFeedback 
} from './types';
import { 
  MOCK_QUESTIONS, 
  INITIAL_STUDENT_PROFILE, 
  INITIAL_STUDY_PLANS, 
  INITIAL_CLASS_PROGRESS, 
  INITIAL_FEEDBACKS,
  INITIAL_TEST_ATTEMPT
} from './mockData';
import { Users, BookOpen, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  // Global Demo Role State
  const [role, setRole] = useState<UserRole>('student');
  
  // Shared Database State
  const [student, setStudent] = useState<StudentProfile>(INITIAL_STUDENT_PROFILE);
  const [plans, setPlans] = useState<StudyPlan[]>(INITIAL_STUDY_PLANS);
  const [classProgress, setClassProgress] = useState<ClassStudentProgress[]>(INITIAL_CLASS_PROGRESS);
  const [feedbacks, setFeedbacks] = useState<StudentFeedback[]>(INITIAL_FEEDBACKS);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([INITIAL_TEST_ATTEMPT]);
  const [remediationPackets, setRemediationPackets] = useState<RemediationPacket[]>([]);

  // Navigation Routing States
  const [studentView, setStudentView] = useState<string>('S1'); // S1-S6
  const [adminView, setAdminView] = useState<string>('A1'); // A1-A6

  // Selected contexts for detailed views
  const [activePlanId, setActivePlanId] = useState<string | null>('plan_01');
  const [activePhaseId, setActivePhaseId] = useState<string | null>('p1');

  // Triggered when student submits error feedback on any question
  const handleAddFeedback = (
    qId: string, 
    qStem: string, 
    type: string, 
    content: string
  ) => {
    const newFb: StudentFeedback = {
      id: 'fb_' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      questionId: qId,
      questionStem: qStem,
      feedbackType: type as any,
      content,
      status: 'pending'
    };
    setFeedbacks(prev => [newFb, ...prev]);
  };

  const currentView = role === 'student' ? studentView : adminView;
  const setView = (v: string) => {
    if (role === 'student') setStudentView(v);
    else setAdminView(v);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      
      {/* 1. Global Prototype Demo Switcher Utility Rail (Anti-AI-Slop/Clean) */}
      <div className="bg-[#670000] text-white border-b border-brand-red px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-gold animate-pulse" />
          <span className="font-bold tracking-tight text-brand-lightred">医学教育考试学习计划平台可交互原型</span>
          <span className="text-brand-borderred">|</span>
          <span className="text-gray-100 font-medium">状态实时同步：作答及不及格即刻触发 AI 补盲，建计划全网可见</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-brand-lightred text-2xs font-semibold">切换演示视角：</span>
          <div className="bg-[#3b0000] p-1 rounded-md flex border border-brand-borderred/40">
            <button
              onClick={() => setRole('student')}
              className={`px-3 py-1 rounded text-2xs font-bold transition-all ${
                role === 'student'
                  ? 'bg-brand-gold text-[#3b0000]'
                  : 'text-brand-borderred hover:text-white'
              }`}
            >
              学生视角 (S1-S6)
            </button>
            <button
              onClick={() => setRole('admin')}
              className={`px-3 py-1 rounded text-2xs font-bold transition-all ${
                role === 'admin'
                  ? 'bg-brand-gold text-[#3b0000]'
                  : 'text-brand-borderred hover:text-white'
              }`}
            >
              教研/管理员视角 (A1-A6)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Module Screens Container */}
      <main className="flex-1 pb-16 bg-gray-50/50">
        {role === 'student' ? (
          <StudentViews
            currentView={studentView}
            setView={setView}
            student={student}
            setStudent={setStudent}
            plans={plans}
            setPlans={setPlans}
            questions={MOCK_QUESTIONS}
            testAttempts={testAttempts}
            setTestAttempts={setTestAttempts}
            remediationPackets={remediationPackets}
            setRemediationPackets={setRemediationPackets}
            activePlanId={activePlanId}
            setActivePlanId={setActivePlanId}
            activePhaseId={activePhaseId}
            setActivePhaseId={setActivePhaseId}
            onAddFeedback={handleAddFeedback}
          />
        ) : (
          <AdminViews
            currentView={adminView}
            setView={setView}
            plans={plans}
            setPlans={setPlans}
            classProgress={classProgress}
            setClassProgress={setClassProgress}
            feedbacks={feedbacks}
            setFeedbacks={setFeedbacks}
            questions={MOCK_QUESTIONS}
          />
        )}
      </main>

      {/* 3. Bottom Sticky Toolbar For Easy Access To Individual Page Routings */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between z-40 text-2xs shadow-lg">
        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="font-semibold text-brand-darkred">演示路由直达面板:</span>
          <span>(点击按钮在不跑完整动线的情况下直接进入对应页面验证结构)</span>
        </div>

        {role === 'student' ? (
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'S1', label: 'S1 首页' },
              { id: 'S2', label: 'S2 详情' },
              { id: 'S3', label: 'S3 答题' },
              { id: 'S4', label: 'S4 错题补盲' },
              { id: 'S5', label: 'S5 诊断报告' },
              { id: 'S6', label: 'S6 我的计划' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStudentView(tab.id)}
                className={`px-2.5 py-1 rounded border text-3xs font-semibold transition-colors ${
                  studentView === tab.id 
                    ? 'bg-brand-red border-brand-red text-white' 
                    : 'bg-brand-lightred/50 hover:bg-brand-lightred border-brand-borderred/50 text-brand-darkred'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'A1', label: 'A1 概览' },
              { id: 'A2', label: 'A2 学生管理' },
              { id: 'A3', label: 'A3 大纲标准' },
              { id: 'A4', label: 'A4 创建计划' },
              { id: 'A5', label: 'A5 计划总发布' },
              { id: 'A6', label: 'A6 学情看板' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAdminView(tab.id)}
                className={`px-2.5 py-1 rounded border text-3xs font-semibold transition-colors ${
                  adminView === tab.id 
                    ? 'bg-brand-red border-brand-red text-white' 
                    : 'bg-brand-lightred/50 hover:bg-brand-lightred border-brand-borderred/50 text-brand-darkred'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </footer>

    </div>
  );
}

