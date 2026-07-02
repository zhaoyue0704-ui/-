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
import { 
  Users, 
  BookOpen, 
  AlertCircle, 
  Layers,
  Home,
  CheckSquare,
  BarChart,
  ClipboardList,
  PlusCircle,
  Send,
  TrendingUp,
} from 'lucide-react';

export default function App() {
  // Global Role State
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. Brand & Header Bar (Top Horizontal Navigation Layout) */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        {/* Top Branding Row */}
        <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center text-white shadow-sm">
              <Layers className="w-4.5 h-4.5 text-brand-gold" />
            </div>
            <div>
              <h1 className="text-xs font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                <span>医学考纲实训系统</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-brand-lightred text-brand-red border border-brand-borderred/20 rounded font-bold">
                  大纲匹配实训
                </span>
              </h1>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                医学统考大纲练习与评测一体化平台
              </p>
            </div>
          </div>

          {/* Right Interactions & Role Switcher */}
          <div className="flex items-center gap-4">
            {/* Role Switcher Pill */}
            <div className="bg-gray-100 p-0.5 rounded-lg flex border border-gray-200">
              <button
                onClick={() => {
                  setRole('student');
                  setStudentView('S1');
                }}
                className={`px-3 py-1.5 rounded-md text-3xs font-black transition-all cursor-pointer ${
                  role === 'student'
                    ? 'bg-brand-red text-white shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                学生端
              </button>
              <button
                onClick={() => {
                  setRole('admin');
                  setAdminView('A1');
                }}
                className={`px-3 py-1.5 rounded-md text-3xs font-black transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-brand-darkred text-white shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                教师/管理后台
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Row */}
        <div className="px-6 py-1 bg-white flex items-center justify-between">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1.5">
            {role === 'student' ? (
              <>
                {[
                  { id: 'S1', label: '工作台首页', icon: Home },
                  { id: 'S6', label: '我的学习计划', icon: BookOpen },
                  { id: 'S2', label: '当前计划详情', icon: ClipboardList },
                  { id: 'S3', label: '答题与测验', icon: CheckSquare },
                  { id: 'S4', label: '错题与补盲', icon: AlertCircle },
                  { id: 'S5', label: '大纲诊断报告', icon: BarChart },
                ].map(item => {
                  const isActive = studentView === item.id;
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setStudentView(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-3xs font-black transition-all cursor-pointer ${
                        isActive
                          ? 'bg-brand-red text-white shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </>
            ) : (
              <>
                {[
                  { id: 'A1', label: '大盘概览', icon: Home },
                  { id: 'A2', label: '学生范围管理', icon: Users },
                  { id: 'A3', label: '考纲标准配置', icon: ClipboardList },
                  { id: 'A4', label: '创建学习计划', icon: PlusCircle },
                  { id: 'A5', label: '分拨与发布中心', icon: Send },
                  { id: 'A6', label: '班级学情监控', icon: TrendingUp },
                ].map(item => {
                  const isActive = adminView === item.id;
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAdminView(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-3xs font-black transition-all cursor-pointer ${
                        isActive
                          ? 'bg-brand-darkred text-white shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </>
            )}
          </nav>

          {/* Right Role Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-4xs font-bold text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span>账号角色：</span>
            <span className={role === 'student' ? 'text-brand-red' : 'text-brand-darkred'}>
              {role === 'student' ? `${student.name} (${student.stage})` : 'zhaoyue (教研管理员)'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Content Area */}
      <div className="flex flex-1 flex-col">
        <main className="flex-1 bg-slate-50/40 p-6 overflow-y-auto">
          <div className="w-full">
            {role === 'student' ? (
              <StudentViews
                currentView={studentView}
                setView={setStudentView}
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
                setView={setAdminView}
                plans={plans}
                setPlans={setPlans}
                classProgress={classProgress}
                setClassProgress={setClassProgress}
                feedbacks={feedbacks}
                setFeedbacks={setFeedbacks}
                questions={MOCK_QUESTIONS}
              />
            )}
          </div>
        </main>
      </div>

    </div>
  );
}
